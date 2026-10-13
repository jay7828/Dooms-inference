/** configs/bedrock.yaml of the Dooms backend, as data. */
import type { AgentName } from '../llm'

export interface BedrockConfig {
  region: string
  default_model: string
  agents: Record<AgentName, { model: string | null; temperature: number; max_tokens: number }>
  retry: { max_attempts: number; base_delay_s: number }
  pricing: { input_per_m: number; output_per_m: number }
}

export const BEDROCK_CONFIG: BedrockConfig = {
  region: 'us-east-1',
  default_model: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  agents: {
    task_decomposer: { model: null, temperature: 0.0, max_tokens: 1500 },
    skill_generator: { model: null, temperature: 0.0, max_tokens: 4000 },
    parameter_setter: { model: null, temperature: 0.0, max_tokens: 2000 },
    vision_grounder: { model: null, temperature: 0.0, max_tokens: 1500 },
  },
  retry: { max_attempts: 3, base_delay_s: 1.5 },
  pricing: { input_per_m: 3.0, output_per_m: 15.0 },
}

export const REGIONS = ['us-east-1', 'us-west-2', 'us-east-2', 'eu-west-1', 'eu-central-1', 'ap-northeast-1', 'ap-southeast-2', 'ap-south-1']

/** Claude inference profiles worth offering. The prefix is the profile's geography; `global.` works in every region. */
const BASE_MODELS = ['anthropic.claude-sonnet-4-5-20250929-v1:0', 'anthropic.claude-haiku-4-5-20251001-v1:0']

export const geoPrefix = (region: string): string => (region.startsWith('us-') ? 'us' : region.startsWith('eu-') ? 'eu' : region.startsWith('ap-') ? 'apac' : 'global')

/** Model ids for the connect dialog: the config default first, then the profiles of the region's geography and `global.`. */
export function modelsForRegion(region: string): string[] {
  const geo = geoPrefix(region)
  const out = [BEDROCK_CONFIG.default_model.replace(/^[a-z]+\./, `${geo}.`)]
  for (const g of [geo, 'global']) for (const m of BASE_MODELS) out.push(`${g}.${m}`)
  return [...new Set(out)]
}
