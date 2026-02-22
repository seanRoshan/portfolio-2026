import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  if (!client) {
    client = new Anthropic({ apiKey })
  }
  return client
}

export function isAIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
