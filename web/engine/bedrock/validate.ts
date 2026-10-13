/** Connect-dialog check for Browser mode (what POST /api/bedrock/validate does on the server): one tiny Converse call. */
import type { AwsCredentials } from '../../types'
import { BEDROCK_CONFIG, modelsForRegion } from './config'
import { BedrockError } from './errors'
import { BedrockLLM, type BedrockOptions } from './client'

export interface ValidateResult {
  ok: boolean
  message?: string
  identity?: string
  region: string
  models: string[]
  tested_model?: string
}

export async function validateInBrowser(creds: AwsCredentials, model: string | null, opts: BedrockOptions = {}): Promise<ValidateResult> {
  const region = (creds.region || BEDROCK_CONFIG.region).trim()
  const models = modelsForRegion(region)
  const tested = model && model.trim() ? model.trim() : models[0]!
  if (!models.includes(tested)) models.push(tested)
  const id = creds.bearer_token ? 'Bedrock API key' : `key ${(creds.access_key_id ?? '').trim().slice(0, 4)}…${(creds.access_key_id ?? '').trim().slice(-4)}`
  try {
    const llm = new BedrockLLM({ ...creds, region }, { ...opts, model: tested, config: { ...BEDROCK_CONFIG, retry: { max_attempts: 1, base_delay_s: 0 } } })
    await llm.converse(tested, { messages: [{ role: 'user', content: [{ text: 'hi' }] }], inferenceConfig: { maxTokens: 5 } })
    return { ok: true, message: 'Connected.', identity: id, region, models, tested_model: tested }
  } catch (e) {
    // a model that rejects `temperature` is not an invalid connection: no temperature is sent here anyway
    return { ok: false, message: e instanceof BedrockError ? e.message : `Could not connect: ${e instanceof Error ? e.message.slice(0, 200) : 'unknown error'}`, region, models }
  }
}
