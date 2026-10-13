/**
 * Claude through the Claude API (api.anthropic.com), called straight from the browser with the visitor's own API key.
 * The counterpart of bedrock/client.ts for people who have a Claude API key and no AWS account. The key lives in this
 * object's memory and goes only to api.anthropic.com.
 *
 * The answer is collected through a `submit` tool. Current models reject a forced tool choice, so the tool choice is
 * `auto` and the system prompt asks for the call; an answer without one is a ValueError the agent loop retries.
 */
import Anthropic from '@anthropic-ai/sdk'
import { isImage, Usage, type AgentName, type LLM, type Message, type Pricing, type StructuredRequest } from '../llm'
import { ValueError } from '../schemas'
import { BEDROCK_CONFIG } from '../bedrock/config'
import { BedrockError } from '../bedrock/errors'
import { toBase64, toolSchema } from '../bedrock/client'

const TOOL = 'submit'
const SUBMIT_RULE = `\n\nGive your final answer by calling the \`${TOOL}\` tool exactly once. Do not answer in plain text.`

/** Models offered in the connect dialog, with their list prices (USD per million tokens) for the cost metric. */
export const ANTHROPIC_MODELS: { id: string; label: string; pricing: Pricing }[] = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', pricing: { input_per_m: 4, output_per_m: 20 } },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', pricing: { input_per_m: 2, output_per_m: 10 } },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', pricing: { input_per_m: 0.1, output_per_m: 0.5 } },
]
export const ANTHROPIC_DEFAULT_MODEL = 'claude-opus-5-5'

export interface AnthropicOptions {
  model?: string
  fetch?: typeof fetch
  timeoutMs?: number
}

async function toParams(messages: Message[]): Promise<Anthropic.MessageParam[]> {
  const out: Anthropic.MessageParam[] = []
  for (const m of messages) {
    const content: Anthropic.ContentBlockParam[] = []
    for (const b of m.content) {
      if (!isImage(b)) {
        content.push({ type: 'text', text: b })
        continue
      }
      const bytes = await b.load()
      if (bytes) content.push({ type: 'image', source: { type: 'base64', media_type: b.mediaType, data: toBase64(bytes) } })
    }
    out.push({ role: m.role, content })
  }
  return out
}

/** A message for the person who clicked Run. Keys never appear in it. */
export function friendlyAnthropicError(e: unknown, model: string): BedrockError {
  if (e instanceof Anthropic.APIUserAbortError) return new BedrockError('Stopped.', 'cancelled')
  if (e instanceof Anthropic.AuthenticationError) return new BedrockError('The Claude API does not recognise this API key. Check it in the Claude Console and connect again.', 'credentials', 'authentication_error', 401)
  if (e instanceof Anthropic.PermissionDeniedError) return new BedrockError(`This API key is not allowed to use ${model}. Check the key's workspace and model access in the Claude Console.`, 'access', 'permission_error', 403)
  if (e instanceof Anthropic.NotFoundError) return new BedrockError(`The Claude API does not know the model ${model}. Pick another model in the connect dialog.`, 'model', 'not_found_error', 404)
  if (e instanceof Anthropic.RateLimitError) return new BedrockError('The Claude API is rate limiting this key. Wait a moment and run again.', 'throttle', 'rate_limit_error', 429)
  if (e instanceof Anthropic.BadRequestError) return new BedrockError(`The Claude API rejected the request: ${e.message}`, 'rejected', 'invalid_request_error', 400)
  if (e instanceof Anthropic.APIConnectionTimeoutError) return new BedrockError(`${model} did not answer in time.`, 'timeout')
  if (e instanceof Anthropic.APIConnectionError) return new BedrockError('Could not reach api.anthropic.com. Check the network connection (and any ad or script blocker).', 'network')
  if (e instanceof Anthropic.APIError) return new BedrockError(`The Claude API answered with an error (HTTP ${e.status ?? '?'}): ${e.message}`, (e.status ?? 0) >= 500 ? 'server' : 'other', '', e.status ?? 0)
  return new BedrockError(`Could not call the Claude API: ${e instanceof Error ? e.message.slice(0, 200) : 'unknown error'}`, 'other')
}

export class AnthropicLLM implements LLM {
  usage = new Usage()
  remote = true
  readonly defaultModel: string
  readonly pricing: Pricing
  readonly agentDefaults: NonNullable<LLM['agentDefaults']>
  private client: Anthropic
  private inflight = new Set<AbortController>()
  private stopped = false

  constructor(apiKey: string, opts: AnthropicOptions = {}) {
    this.defaultModel = opts.model || ANTHROPIC_DEFAULT_MODEL
    this.pricing = ANTHROPIC_MODELS.find((m) => m.id === this.defaultModel)?.pricing ?? ANTHROPIC_MODELS[0]!.pricing
    this.agentDefaults = Object.fromEntries(Object.entries(BEDROCK_CONFIG.agents).map(([k, v]) => [k, { maxTokens: v.max_tokens, temperature: v.temperature }]))
    // the page calls the API itself with the visitor's own key: there is no server of ours to keep it on
    this.client = new Anthropic({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 2, timeout: opts.timeoutMs ?? 180_000, ...(opts.fetch ? { fetch: opts.fetch } : {}) })
  }

  abort(): void {
    this.stopped = true
    for (const c of this.inflight) c.abort()
  }

  /** The models this key can use, newest first (also the cheapest way to check a key: it spends no tokens). */
  async listModels(): Promise<string[]> {
    const ids: string[] = []
    for await (const m of this.client.models.list({ limit: 100 })) ids.push(m.id)
    return ids
  }

  async structured<T>(req: StructuredRequest<T>): Promise<T> {
    if (this.stopped) throw new BedrockError('Stopped.', 'cancelled')
    const model = this.defaultModel
    const t0 = performance.now()
    const record = (inT: number, outT: number, ok: boolean): void =>
      this.usage.add({ agent: req.agent, model, input_tokens: inT, output_tokens: outT, latency_s: (performance.now() - t0) / 1000, ok })
    const ctl = new AbortController()
    this.inflight.add(ctl)
    let resp: Anthropic.Message
    try {
      resp = await this.client.messages.create(
        {
          model,
          // thinking is always on for the current models and shares this budget with the answer, so leave it room
          max_tokens: Math.max(16000, req.maxTokens ?? 0),
          system: req.system + SUBMIT_RULE,
          messages: await toParams(req.messages),
          tools: [{ name: TOOL, description: 'Submit the final structured answer.', input_schema: toolSchema(req.schema.jsonSchema) as Anthropic.Tool.InputSchema }],
          tool_choice: { type: 'auto' },
          output_config: { effort: 'medium' },
        },
        { signal: ctl.signal },
      )
    } catch (e) {
      record(0, 0, false)
      throw friendlyAnthropicError(e, model)
    } finally {
      this.inflight.delete(ctl)
    }
    const inT = resp.usage.input_tokens + (resp.usage.cache_read_input_tokens ?? 0) + (resp.usage.cache_creation_input_tokens ?? 0)
    const outT = resp.usage.output_tokens
    if (resp.stop_reason === 'refusal') {
      record(inT, outT, false)
      throw new BedrockError(`${model} declined this request. Rephrase the command or pick another model.`, 'rejected', 'refusal')
    }
    const call = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === TOOL)
    if (!call) {
      record(inT, outT, false)
      throw new ValueError(`${req.agent}: the model answered without calling ${TOOL} (stop_reason=${resp.stop_reason ?? '?'}). Call ${TOOL} with the answer.`)
    }
    try {
      const value = req.schema.parse(call.input)
      record(inT, outT, true)
      return value
    } catch (e) {
      record(inT, outT, false)
      throw e
    }
  }
}

export interface AnthropicValidateResult {
  ok: boolean
  message?: string
  identity?: string
  region: string
  models: string[]
  tested_model?: string
}

/** Connect-dialog check: list the key's models (no tokens spent) and keep the ones this engine offers. */
export async function validateAnthropicKey(apiKey: string, model: string | null, opts: AnthropicOptions = {}): Promise<AnthropicValidateResult> {
  const key = apiKey.trim()
  const offered = ANTHROPIC_MODELS.map((m) => m.id)
  try {
    const available = await new AnthropicLLM(key, opts).listModels()
    const models = offered.filter((id) => available.includes(id))
    if (!models.length) return { ok: false, message: 'This key works, but none of the models this app uses are available to it.', region: 'Claude API', models: [] }
    const tested = model && models.includes(model) ? model : models[0]!
    return { ok: true, message: 'Connected.', identity: `key …${key.slice(-4)}`, region: 'Claude API', models, tested_model: tested }
  } catch (e) {
    return { ok: false, message: friendlyAnthropicError(e, model ?? ANTHROPIC_DEFAULT_MODEL).message, region: 'Claude API', models: [] }
  }
}

/** Factory used by the session: the key and model come with the run command (memory only). */
export function anthropicFromMessage(msg: Record<string, unknown>, opts: AnthropicOptions = {}): AnthropicLLM {
  const key = (msg.credentials as { api_key?: string } | undefined)?.api_key
  if (!key) throw new BedrockError('Claude needs your API key. Choose "Connect Claude" first.', 'credentials')
  return new AnthropicLLM(key, { ...opts, model: typeof msg.model === 'string' && msg.model ? msg.model : opts.model })
}
export type { AgentName }
