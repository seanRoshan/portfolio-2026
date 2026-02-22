'use server'

import { createClient } from '@/lib/supabase/server'
import { isAIAvailable } from '@/lib/resume-builder/ai/client'
import { getMonthlyUsage, type MonthlyUsageSummary } from '@/lib/resume-builder/ai/usage'

export interface SystemStatus {
  ai: {
    configured: boolean
    status: 'connected' | 'error' | 'unconfigured'
    error?: string
  }
  database: {
    status: 'connected' | 'error'
    latency_ms?: number
    error?: string
  }
  usage: MonthlyUsageSummary
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const [ai, database, usage] = await Promise.all([
    checkAIStatus(),
    checkDatabaseStatus(),
    getMonthlyUsageSafe(),
  ])

  return { ai, database, usage }
}

async function checkAIStatus(): Promise<SystemStatus['ai']> {
  if (!isAIAvailable()) {
    return { configured: false, status: 'unconfigured' }
  }

  // API key is set — try a minimal API call to verify it works
  try {
    const { getAnthropicClient } = await import('@/lib/resume-builder/ai/client')
    const client = getAnthropicClient()
    if (!client) {
      return { configured: false, status: 'unconfigured' }
    }

    // Count tokens on a tiny prompt to verify key validity (cheapest possible call)
    await client.messages.countTokens({
      model: 'claude-sonnet-4-5-20250929',
      messages: [{ role: 'user', content: 'hi' }],
    })

    return { configured: true, status: 'connected' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { configured: true, status: 'error', error: message }
  }
}

async function checkDatabaseStatus(): Promise<SystemStatus['database']> {
  try {
    const start = Date.now()
    const supabase = await createClient()
    // Simple health check query
    const { error } = await supabase.from('site_settings').select('id').limit(1)
    const latency = Date.now() - start

    if (error) {
      return { status: 'error', error: error.message }
    }

    return { status: 'connected', latency_ms: latency }
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}

async function getMonthlyUsageSafe(): Promise<MonthlyUsageSummary> {
  try {
    return await getMonthlyUsage()
  } catch {
    return {
      total_calls: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      estimated_cost_usd: 0,
    }
  }
}
