/**
 * Claude on Amazon Bedrock through the Converse API, straight from the browser (llm/bedrock_client.py): text + image
 * blocks, the answer forced into a schema through tool use, retry with backoff on throttling, SigV4 or Bedrock API key.
 * Credentials live in this object's memory and go only to bedrock-runtime.<region>.amazonaws.com.
 */
import type { AwsCredentials } from '../../types'
import { isImage, Usage, type AgentName, type Block, type LLM, type Message, type StructuredRequest } from '../llm'
import { ValueError } from '../schemas'
import { BEDROCK_CONFIG, type BedrockConfig } from './config'
import { BedrockError, errorCode, friendlyError, isTransient, networkError } from './errors'
import { signRequest } from './sigv4'

const TOOL = 'submit'

/** Pydantic-style tool schema: $refs inlined, titles and defaults dropped, Optional[X] collapsed to X. Keeps the schema simple enough for any Bedrock model. */
export function toolSchema(raw: unknown, defs: Record<string, unknown> = {}): unknown {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk)
    if (!node || typeof node !== 'object') return node
    const o = node as Record<string, unknown>
    if (typeof o.$ref === 'string') return walk(defs[o.$ref.split('/').pop()!])
    if (Array.isArray(o.anyOf)) {
      const nonNull = (o.anyOf as Record<string, unknown>[]).filter((x) => x.type !== 'null')
      if (nonNull.length === 1) {
        const { anyOf: _drop, ...rest } = o
        void _drop
        return walk({ ...nonNull[0], ...rest })
      }
    }
    return Object.fromEntries(Object.entries(o).filter(([k]) => !['title', '$defs', 'default'].includes(k)).map(([k, v]) => [k, walk(v)]))
  }
  return walk(raw)
}

export function toBase64(u8: Uint8Array): string {
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return btoa(s)
}

type Json = Record<string, unknown>

async function blocksOf(content: Block[]): Promise<Json[]> {
  const out: Json[] = []
  for (const b of content) {
    if (!isImage(b)) {
      out.push({ text: b })
      continue
    }
    const bytes = await b.load()
    if (bytes) out.push({ image: { format: b.mediaType === 'image/jpeg' ? 'jpeg' : 'png', source: { bytes: toBase64(bytes) } } })
  }
  return out
}

export interface ConverseParams {
  system: string
  messages: Message[]
  schema: StructuredRequest<unknown>['schema']
  maxTokens: number
  temperature?: number
}

/** The Converse request body of one structured call. */
export async function buildConverseBody(p: ConverseParams): Promise<Json> {
  const messages: Json[] = []
  for (const m of p.messages) messages.push({ role: m.role, content: await blocksOf(m.content) })
  return {
    system: [{ text: p.system }],
    messages,
    inferenceConfig: { maxTokens: p.maxTokens, ...(p.temperature === undefined ? {} : { temperature: p.temperature }) },
    toolConfig: {
      tools: [{ toolSpec: { name: TOOL, description: 'Submit the final structured answer.', inputSchema: { json: toolSchema(p.schema.jsonSchema) } } }],
      toolChoice: { tool: { name: TOOL } },
    },
  }
}

/** The tool call of a Converse answer, checked against the schema. A ValueError makes the agent loop ask again. */
export function parseConverse<T>(agent: string, resp: unknown, schema: StructuredRequest<T>['schema']): { value: T; inputTokens: number; outputTokens: number } {
  const r = (resp ?? {}) as { output?: { message?: { content?: Json[] } }; usage?: { inputTokens?: number; outputTokens?: number }; stopReason?: string }
  const usage = { inputTokens: r.usage?.inputTokens ?? 0, outputTokens: r.usage?.outputTokens ?? 0 }
  for (const block of r.output?.message?.content ?? []) {
    const tu = block.toolUse as { input?: unknown } | undefined
    if (!tu) continue
    let input = tu.input
    if (typeof input === 'string') {
      try {
        input = JSON.parse(input)
      } catch {
        throw new ValueError(`${agent}: the tool call was not valid JSON`)
      }
    }
    return { value: schema.parse(input), ...usage }
  }
  throw new ValueError(`${agent}: model returned no tool call (stopReason=${r.stopReason ?? '?'})`)
}

export interface BedrockOptions {
  model?: string
  config?: BedrockConfig
  fetch?: typeof fetch
  /** abortable pause between retries (tests make it instant) */
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>
  timeoutMs?: number
  now?: () => Date
}

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new BedrockError('Stopped.', 'cancelled'))
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new BedrockError('Stopped.', 'cancelled'))
    }, { once: true })
  })

export class BedrockLLM implements LLM {
  usage = new Usage()
  remote = true
  readonly defaultModel: string
  readonly pricing: BedrockConfig['pricing']
  readonly agentDefaults: NonNullable<LLM['agentDefaults']>
  readonly region: string
  private cfg: BedrockConfig
  private inflight = new Set<AbortController>()
  private noTemperature = new Set<string>() // models that rejected `temperature`
  private stopped = false
  private doFetch: typeof fetch
  private sleep: NonNullable<BedrockOptions['sleep']>
  private timeoutMs: number
  private now: () => Date

  constructor(private creds: AwsCredentials, opts: BedrockOptions = {}) {
    this.cfg = opts.config ?? BEDROCK_CONFIG
    this.region = (creds.region || this.cfg.region).trim()
    this.defaultModel = opts.model || this.cfg.default_model
    this.pricing = this.cfg.pricing
    this.agentDefaults = Object.fromEntries(Object.entries(this.cfg.agents).map(([k, v]) => [k, { maxTokens: v.max_tokens, temperature: v.temperature }]))
    this.doFetch = opts.fetch ?? ((...a) => fetch(...a))
    this.sleep = opts.sleep ?? defaultSleep
    this.timeoutMs = opts.timeoutMs ?? 180_000
    this.now = opts.now ?? (() => new Date())
  }

  modelFor(agent: AgentName): string {
    return this.cfg.agents[agent]?.model || this.defaultModel
  }

  abort(): void {
    this.stopped = true
    for (const c of this.inflight) c.abort()
  }

  /** One signed Converse request. Throws BedrockError. */
  async converse(model: string, body: Json): Promise<unknown> {
    if (this.stopped) throw new BedrockError('Stopped.', 'cancelled')
    const url = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${encodeURIComponent(model)}/converse`
    const payload = JSON.stringify(body)
    let headers: Record<string, string>
    const c = this.creds
    if (c.bearer_token) headers = { 'content-type': 'application/json', authorization: `Bearer ${c.bearer_token.trim()}` }
    else {
      if (!c.access_key_id?.trim() || !c.secret_access_key?.trim()) throw new BedrockError('AWS access key ID and secret access key are required.', 'credentials')
      headers = await signRequest({
        method: 'POST', url, headers: { 'content-type': 'application/json' }, body: payload, region: this.region, service: 'bedrock', now: this.now(),
        keys: { accessKeyId: c.access_key_id.trim(), secretAccessKey: c.secret_access_key.trim(), sessionToken: c.session_token?.trim() || undefined },
      })
    }
    const ctl = new AbortController()
    this.inflight.add(ctl)
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      ctl.abort()
    }, this.timeoutMs)
    try {
      let res: Response
      try {
        res = await this.doFetch(url, { method: 'POST', headers, body: payload, signal: ctl.signal, cache: 'no-store', credentials: 'omit' })
      } catch (e) {
        if (timedOut) throw new BedrockError(`${model} did not answer within ${Math.round(this.timeoutMs / 1000)} s.`, 'timeout')
        if (ctl.signal.aborted || (e instanceof Error && e.name === 'AbortError')) throw new BedrockError('Stopped.', 'cancelled')
        throw networkError(this.region)
      }
      let text: string
      try {
        text = await res.text()
      } catch (e) {
        if (timedOut) throw new BedrockError(`${model} did not answer within ${Math.round(this.timeoutMs / 1000)} s.`, 'timeout')
        if (ctl.signal.aborted) throw new BedrockError('Stopped.', 'cancelled')
        void e
        throw networkError(this.region)
      }
      let json: unknown = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        /* not JSON (a proxy error page, say) */
      }
      if (!res.ok) {
        const code = errorCode(res.headers.get('x-amzn-errortype'), json)
        const msg = (json && typeof json === 'object' && typeof (json as Json).message === 'string' ? ((json as Json).message as string) : '') || res.headers.get('x-amzn-errormessage') || ''
        throw friendlyError(res.status, code, msg, model, this.region)
      }
      return json
    } finally {
      clearTimeout(timer)
      this.inflight.delete(ctl)
    }
  }

  async structured<T>(req: StructuredRequest<T>): Promise<T> {
    const model = this.modelFor(req.agent)
    const maxTokens = req.maxTokens ?? this.agentDefaults[req.agent]?.maxTokens ?? 2000
    const retry = this.cfg.retry
    for (let attempt = 0; attempt < retry.max_attempts; attempt++) {
      const t0 = performance.now()
      const body = await buildConverseBody({ ...req, maxTokens, temperature: this.noTemperature.has(model) ? undefined : (req.temperature ?? 0) })
      const record = (inT: number, outT: number, ok: boolean): void =>
        this.usage.add({ agent: req.agent, model, input_tokens: inT, output_tokens: outT, latency_s: (performance.now() - t0) / 1000, ok })
      try {
        const resp = await this.converse(model, body)
        const parsed = (() => {
          try {
            return parseConverse(req.agent, resp, req.schema)
          } catch (e) {
            const u = (resp as { usage?: { inputTokens?: number; outputTokens?: number } } | null)?.usage
            record(u?.inputTokens ?? 0, u?.outputTokens ?? 0, false)
            throw e
          }
        })()
        record(parsed.inputTokens, parsed.outputTokens, true)
        return parsed.value
      } catch (e) {
        if (e instanceof ValueError) throw e
        if (!(e instanceof BedrockError)) throw e
        record(0, 0, false)
        // a model that does not take `temperature` (some newer ones): ask again without it, once, not counted as a retry
        if (e.kind === 'rejected' && /temperature/i.test(e.message) && !this.noTemperature.has(model)) {
          this.noTemperature.add(model)
          attempt--
          continue
        }
        if (e.kind === 'cancelled') throw e
        if ((isTransient(e.code, e.status) || e.kind === 'throttle' || e.kind === 'server') && attempt < retry.max_attempts - 1) {
          const ctl = new AbortController()
          this.inflight.add(ctl)
          try {
            await this.sleep(retry.base_delay_s * 2 ** attempt * 1000, ctl.signal)
          } finally {
            this.inflight.delete(ctl)
          }
          continue
        }
        throw e
      }
    }
    throw new BedrockError('Bedrock did not answer.', 'other')
  }
}

/** Factory used by the session: credentials and model come with the run command (memory only). */
export function bedrockFromMessage(msg: Record<string, unknown>, opts: BedrockOptions = {}): BedrockLLM {
  const creds = msg.credentials as AwsCredentials | undefined
  if (!creds || (!creds.bearer_token && !(creds.access_key_id && creds.secret_access_key)))
    throw new BedrockError('Claude needs your credentials. Choose "Connect Claude" and add a Claude API key or AWS Bedrock credentials.', 'credentials')
  return new BedrockLLM(creds, { ...opts, model: typeof msg.model === 'string' && msg.model ? msg.model : opts.model })
}
