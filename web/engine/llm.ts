/**
 * The model interface the pipeline plans with (llm/base.py). The Demo planner (scriptedLlm.ts) implements it with
 * hand-written plans; a Bedrock/Claude client can implement the same interface and be dropped into createSession().
 */
import type { Schema } from './schemas'

export type AgentName = 'task_decomposer' | 'skill_generator' | 'parameter_setter' | 'vision_grounder'

/** An image the model may look at. Pixels are produced on demand (null: this environment cannot render). */
export interface ImageBlock {
  type: 'image'
  mediaType: 'image/png' | 'image/jpeg'
  load(): Promise<Uint8Array | null>
}
export type Block = string | ImageBlock
export const isImage = (b: Block): b is ImageBlock => typeof b !== 'string'

export interface Message {
  role: 'user' | 'assistant'
  content: Block[]
}

export interface StructuredRequest<T> {
  /** which of the four agents is asking (routes the scripted planner, labels usage) */
  agent: AgentName
  system: string
  /** the conversation so far; the agents send one user message and, on a rejected answer, extend it with feedback */
  messages: Message[]
  /** the answer is forced into this schema (Bedrock: forced tool use with schema.jsonSchema) */
  schema: Schema<T>
  maxTokens?: number
  temperature?: number
}

export interface CallRecord {
  agent: string
  model: string
  input_tokens: number
  output_tokens: number
  latency_s: number
  ok: boolean
}

export class Usage {
  calls: CallRecord[] = []
  add(rec: CallRecord): void {
    this.calls.push(rec)
  }
  get nCalls(): number {
    return this.calls.length
  }
  get inputTokens(): number {
    return this.calls.reduce((a, c) => a + c.input_tokens, 0)
  }
  get outputTokens(): number {
    return this.calls.reduce((a, c) => a + c.output_tokens, 0)
  }
  get latencyS(): number {
    return this.calls.reduce((a, c) => a + c.latency_s, 0)
  }
  byAgent(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const c of this.calls) out[c.agent] = (out[c.agent] ?? 0) + 1
    return out
  }
  cost(pricing: Pricing): number {
    return (this.inputTokens * pricing.input_per_m + this.outputTokens * pricing.output_per_m) / 1e6
  }
}

export interface Pricing {
  input_per_m: number
  output_per_m: number
}
export const NO_PRICING: Pricing = { input_per_m: 0, output_per_m: 0 }

export interface LLM {
  usage: Usage
  /** model id shown in the UI ("scripted" for the Demo planner) */
  defaultModel: string
  /** USD per million tokens, for the cost metric (zero for the Demo planner) */
  pricing: Pricing
  /** true for network models: the session lets Stop interrupt the wait */
  remote?: boolean
  /** per-agent token budget / temperature of this model's config (configs/bedrock.yaml); the agents use it unless told otherwise */
  agentDefaults?: Partial<Record<AgentName, { maxTokens: number; temperature: number }>>
  /** drop every call in flight (Stop): their promises reject */
  abort?(): void
  /** One model call whose output is forced into `req.schema`; rejects with ValueError-compatible output if it does not fit. */
  structured<T>(req: StructuredRequest<T>): Promise<T>
}

/** All text of a request's last user message, joined (what the scripted planner pattern-matches on). */
export const textOf = (blocks: Block[]): string => blocks.filter((b): b is string => typeof b === 'string').join('\n')
export const lastUserBlocks = (messages: Message[]): Block[] => [...messages].reverse().find((m) => m.role === 'user')?.content ?? []
