import { bedrock } from "./provider"

/** Model metadata for the admin UI and cost-aware routing */
export interface ModelInfo {
  label: string
  provider: "Anthropic" | "Amazon" | "Meta"
  tier: "premium" | "standard" | "fast"
  capabilities: ("tools" | "streaming" | "vision" | "reasoning")[]
}

/**
 * Available models in the Bedrock catalog.
 * Each agent pulls its model_id from the ai_prompts table,
 * falling back to the default if not set.
 */
export const AVAILABLE_MODELS: Record<string, ModelInfo> = {
  "us.anthropic.claude-sonnet-4-20250514-v1:0": {
    label: "Claude Sonnet 4",
    provider: "Anthropic",
    tier: "premium",
    capabilities: ["tools", "streaming", "vision", "reasoning"],
  },
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0": {
    label: "Claude 3.5 Sonnet v2",
    provider: "Anthropic",
    tier: "standard",
    capabilities: ["tools", "streaming", "vision"],
  },
  "us.anthropic.claude-3-5-haiku-20241022-v1:0": {
    label: "Claude 3.5 Haiku",
    provider: "Anthropic",
    tier: "fast",
    capabilities: ["tools", "streaming"],
  },
  "amazon.nova-pro-v1:0": {
    label: "Amazon Nova Pro",
    provider: "Amazon",
    tier: "standard",
    capabilities: ["streaming"],
  },
  "meta.llama3-70b-instruct-v1:0": {
    label: "Llama 3 70B",
    provider: "Meta",
    tier: "standard",
    capabilities: ["streaming"],
  },
} as const

export type ModelId = keyof typeof AVAILABLE_MODELS

export const DEFAULT_MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"

/** Get a Bedrock model instance by ID, falling back to default */
export function getModel(modelId?: string | null) {
  const id = modelId ?? DEFAULT_MODEL_ID
  return bedrock(id)
}

/** Get model metadata for display in admin UI */
export function getModelInfo(modelId: string): ModelInfo | null {
  return AVAILABLE_MODELS[modelId] ?? null
}

/** Get list of model IDs that support a specific capability */
export function getModelsWithCapability(capability: ModelInfo["capabilities"][number]): string[] {
  return Object.entries(AVAILABLE_MODELS)
    .filter(([, info]) => info.capabilities.includes(capability))
    .map(([id]) => id)
}
