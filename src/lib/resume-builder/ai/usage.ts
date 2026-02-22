import { createClient } from '@/lib/supabase/server'

// Pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
}

const DEFAULT_PRICING = { input: 3, output: 15 }

interface UsageLogEntry {
  user_id: string | null
  action: string
  model: string
  input_tokens: number
  output_tokens: number
}

export async function logAIUsage(entry: UsageLogEntry): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('ai_usage_log').insert({
    user_id: entry.user_id,
    action: entry.action,
    model: entry.model,
    input_tokens: entry.input_tokens,
    output_tokens: entry.output_tokens,
  })
  if (error) {
    console.error('[logAIUsage] Insert error:', error)
  }
}

export interface MonthlyUsageSummary {
  total_calls: number
  total_input_tokens: number
  total_output_tokens: number
  estimated_cost_usd: number
}

export async function getMonthlyUsage(): Promise<MonthlyUsageSummary> {
  const supabase = await createClient()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('ai_usage_log')
    .select('model, input_tokens, output_tokens')
    .gte('created_at', startOfMonth.toISOString())

  if (error || !data) {
    return {
      total_calls: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      estimated_cost_usd: 0,
    }
  }

  let totalInput = 0
  let totalOutput = 0
  let totalCost = 0

  for (const row of data) {
    const pricing = MODEL_PRICING[row.model] ?? DEFAULT_PRICING
    totalInput += row.input_tokens
    totalOutput += row.output_tokens
    totalCost +=
      (row.input_tokens / 1_000_000) * pricing.input +
      (row.output_tokens / 1_000_000) * pricing.output
  }

  return {
    total_calls: data.length,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
    estimated_cost_usd: Math.round(totalCost * 100) / 100,
  }
}
