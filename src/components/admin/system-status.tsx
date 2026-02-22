'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Brain,
  Database,
  DollarSign,
  RefreshCw,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getSystemStatus,
  type SystemStatus,
} from '@/app/admin/system-status-actions'

function StatusDot({
  status,
}: {
  status: 'connected' | 'error' | 'unconfigured' | 'loading'
}) {
  return (
    <span
      role="status"
      aria-label={status}
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        status === 'connected' && 'bg-emerald-500',
        status === 'error' && 'bg-red-500',
        status === 'unconfigured' && 'bg-amber-500',
        status === 'loading' && 'bg-muted-foreground animate-pulse'
      )}
    />
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function SystemStatusPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const s = await getSystemStatus()
      setStatus(s)
    } catch {
      // Keep previous status if refresh fails
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    // Refresh every 5 minutes
    const interval = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  const aiStatus = status?.ai.status ?? 'loading'
  const dbStatus = status?.database.status ?? 'loading'
  const cost = status?.usage.estimated_cost_usd ?? 0
  const calls = status?.usage.total_calls ?? 0

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-t px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
            System
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh system status"
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn('h-3 w-3', loading && 'animate-spin')}
            />
          </button>
        </div>

        {/* Row 1: Service statuses */}
        <div className="mb-2 flex items-center gap-3">
          {/* AI Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Brain className="text-muted-foreground h-3.5 w-3.5" />
                <StatusDot status={loading ? 'loading' : aiStatus} />
                <span className="text-muted-foreground text-[11px]">AI</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">
                AI:{' '}
                {aiStatus === 'connected'
                  ? 'Connected'
                  : aiStatus === 'error'
                    ? 'Error'
                    : aiStatus === 'unconfigured'
                      ? 'Not configured'
                      : 'Checking...'}
              </p>
              {status?.ai.error && (
                <p className="text-destructive mt-0.5 max-w-52 break-words">
                  {status.ai.error}
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* DB Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Database className="text-muted-foreground h-3.5 w-3.5" />
                <StatusDot status={loading ? 'loading' : dbStatus} />
                <span className="text-muted-foreground text-[11px]">DB</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">
                DB:{' '}
                {dbStatus === 'connected'
                  ? 'Connected'
                  : dbStatus === 'error'
                    ? 'Error'
                    : 'Checking...'}
              </p>
              {status?.database.latency_ms != null && (
                <p className="text-muted-foreground">
                  {status.database.latency_ms}ms latency
                </p>
              )}
              {status?.database.error && (
                <p className="text-destructive mt-0.5 max-w-52 break-words">
                  {status.database.error}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Row 2: Usage & Cost */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Zap className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {loading
                    ? '—'
                    : `${calls} call${calls !== 1 ? 's' : ''}`}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">AI usage this month</p>
              <p className="text-muted-foreground">
                {formatTokens(status?.usage.total_input_tokens ?? 0)} input
                &middot;{' '}
                {formatTokens(status?.usage.total_output_tokens ?? 0)} output
              </p>
            </TooltipContent>
          </Tooltip>

          <div className="bg-border h-3 w-px" />

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <DollarSign className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {loading
                    ? '—'
                    : cost > 0
                      ? `$${cost.toFixed(2)}`
                      : '$0.00'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">Estimated AI cost this month</p>
              <a
                href="https://console.anthropic.com/settings/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary mt-1 flex items-center gap-1 hover:underline"
              >
                Check balance on Anthropic
                <ExternalLink className="h-3 w-3" />
              </a>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
