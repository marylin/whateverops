import type { IntegrationResult } from '../../lib/api'

interface DailyDigestProps {
  panels: IntegrationResult[]
}

// ── helpers ──────────────────────────────────────────────────────────────────

function getPanel(panels: IntegrationResult[], id: string): Record<string, unknown> | null {
  const panel = panels.find((p) => p.id.replace(/-\d+$/, '') === id)
  if (!panel?.data) return null
  return panel.data as Record<string, unknown>
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

// ── metric extractors ─────────────────────────────────────────────────────────

function getMoney(panels: IntegrationResult[]): {
  label: string
  value: string
  sub: string | null
  color: string
} {
  const stripe = getPanel(panels, 'stripe')
  if (!stripe) return { label: 'Revenue', value: 'N/A', sub: null, color: 'text-gray-500' }

  const mrr = typeof stripe.mrr === 'number' ? stripe.mrr : 0
  const growthPct = typeof stripe.mrrGrowthPct === 'number' ? stripe.mrrGrowthPct : 0

  const formatted = `$${fmt(mrr)}`
  const sign = growthPct > 0 ? '+' : ''
  const sub = `${sign}${growthPct}% mo`
  const color =
    growthPct > 5 ? 'text-[#50FA7B]' : growthPct > 0 ? 'text-[#8BE9FD]' : 'text-[#FF5555]'

  return { label: 'MRR', value: formatted, sub, color }
}

function getHealth(panels: IntegrationResult[]): {
  label: string
  value: string
  sub: string | null
  color: string
} {
  const total = panels.length
  const okCount = panels.filter((p) => p.status === 'ok').length
  const errorCount = panels.filter((p) => p.status === 'error').length

  const color =
    errorCount > 0 ? 'text-[#FF5555]' : okCount < total ? 'text-[#FFB86C]' : 'text-[#50FA7B]'

  return {
    label: 'Health',
    value: `${okCount}/${total}`,
    sub: errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : 'all green',
    color,
  }
}

function getUsers(panels: IntegrationResult[]): {
  label: string
  value: string
  sub: string | null
  color: string
} {
  // Prefer PostHog DAU
  const posthog = getPanel(panels, 'posthog')
  if (posthog) {
    const dau = typeof posthog.dau === 'number' ? posthog.dau : 0
    const changePct = typeof posthog.dauChangePercent === 'number' ? posthog.dauChangePercent : null
    const sub = changePct != null ? `${changePct > 0 ? '+' : ''}${changePct}% vs yesterday` : null
    const color =
      changePct != null && changePct > 0
        ? 'text-[#50FA7B]'
        : changePct != null && changePct < 0
          ? 'text-[#FF5555]'
          : 'text-[#8BE9FD]'
    return { label: 'Users', value: fmt(dau), sub, color }
  }

  // Fall back to Supabase Auth total users
  const supabaseAuth = getPanel(panels, 'supabase-auth')
  if (supabaseAuth) {
    const total = typeof supabaseAuth.totalUsers === 'number' ? supabaseAuth.totalUsers : 0
    const trend = typeof supabaseAuth.signupsTrend === 'string' ? supabaseAuth.signupsTrend : 'flat'
    const trendLabel = trend === 'up' ? 'signups ↑' : trend === 'down' ? 'signups ↓' : null
    const color =
      trend === 'up' ? 'text-[#50FA7B]' : trend === 'down' ? 'text-[#FF5555]' : 'text-[#8BE9FD]'
    return { label: 'Users', value: fmt(total), sub: trendLabel, color }
  }

  return { label: 'Users', value: 'N/A', sub: null, color: 'text-gray-500' }
}

interface CostDetail {
  label: string
  value: string
  sub: string | null
  color: string
  breakdown: string | null
}

function getCosts(panels: IntegrationResult[]): CostDetail {
  const anthropic = getPanel(panels, 'anthropic')
  const openai = getPanel(panels, 'openai')

  const getSpend = (p: Record<string, unknown> | null): number => {
    if (!p) return -1
    const usage = p.usage as Record<string, unknown> | undefined
    if (usage && typeof usage.totalCost30d === 'number') return usage.totalCost30d
    return 0
  }

  const anthropicSpend = getSpend(anthropic)
  const openaiSpend = getSpend(openai)

  const hasAnthropic = anthropicSpend >= 0
  const hasOpenAI = openaiSpend >= 0

  if (!hasAnthropic && !hasOpenAI) {
    return { label: 'AI Costs', value: 'N/A', sub: null, color: 'text-gray-500', breakdown: null }
  }

  const total = (hasAnthropic ? anthropicSpend : 0) + (hasOpenAI ? openaiSpend : 0)

  let breakdown: string | null = null
  if (hasAnthropic && hasOpenAI) {
    breakdown = `Anthropic $${anthropicSpend.toFixed(2)} · OpenAI $${openaiSpend.toFixed(2)}`
  }

  const sub =
    hasAnthropic && !hasOpenAI ? 'Anthropic' : !hasAnthropic && hasOpenAI ? 'OpenAI' : null

  return {
    label: 'AI Costs',
    value: `$${total.toFixed(2)}/mo`,
    sub,
    color: total > 100 ? 'text-[#FFB86C]' : 'text-[#8BE9FD]',
    breakdown,
  }
}

function getAttention(panels: IntegrationResult[]): {
  label: string
  value: string
  sub: string | null
  color: string
} {
  let count = 0
  const reasons: string[] = []

  const stripe = getPanel(panels, 'stripe')
  if (stripe) {
    const failedPayments =
      typeof stripe.failedPayments24h === 'number' ? stripe.failedPayments24h : 0
    const disputes =
      stripe.disputes && typeof (stripe.disputes as Record<string, unknown>).count === 'number'
        ? ((stripe.disputes as Record<string, unknown>).count as number)
        : 0
    if (failedPayments > 0) {
      count += failedPayments
      reasons.push(`${failedPayments} failed pmt${failedPayments > 1 ? 's' : ''}`)
    }
    if (disputes > 0) {
      count += disputes
      reasons.push(`${disputes} dispute${disputes > 1 ? 's' : ''}`)
    }
  }

  const sentry = getPanel(panels, 'sentry')
  if (sentry) {
    const newIssues = typeof sentry.newIssues24h === 'number' ? sentry.newIssues24h : 0
    if (newIssues > 0) {
      count += newIssues
      reasons.push(`${newIssues} new error${newIssues > 1 ? 's' : ''}`)
    }
  }

  const github = getPanel(panels, 'github')
  if (github) {
    const cicd = github.cicd as Record<string, unknown> | undefined
    const lastConclusion = cicd?.lastRunConclusion
    if (lastConclusion === 'failure') {
      count += 1
      reasons.push('CI failing')
    }
  }

  const linear = getPanel(panels, 'linear')
  if (linear) {
    const overdueCount = typeof linear.overdueCount === 'number' ? linear.overdueCount : 0
    if (overdueCount > 0) {
      count += overdueCount
      reasons.push(`${overdueCount} overdue`)
    }
  }

  if (count === 0) {
    return { label: 'Attention', value: 'All clear', sub: null, color: 'text-[#50FA7B]' }
  }

  const sub = reasons.slice(0, 2).join(', ') + (reasons.length > 2 ? '…' : '')
  return {
    label: 'Attention',
    value: `${count} item${count > 1 ? 's' : ''}`,
    sub,
    color: 'text-[#FF5555]',
  }
}

// ── sub-component ─────────────────────────────────────────────────────────────

interface MetricTileProps {
  label: string
  value: string
  sub: string | null
  valueColor: string
  tooltip?: string | null
}

function MetricTile({ label, value, sub, valueColor, tooltip }: MetricTileProps) {
  return (
    <div className="flex-1 min-w-0 px-4 py-3 relative group" title={tooltip ?? undefined}>
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500 truncate">
        {label}
      </p>
      <p className={`text-lg font-bold leading-tight mt-0.5 truncate ${valueColor}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 whitespace-nowrap">
          <div className="bg-[#2A2A3E] border border-[#3D3D5C] rounded px-2 py-1 text-[11px] text-gray-300 shadow-lg">
            {tooltip}
          </div>
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function DailyDigest({ panels }: DailyDigestProps) {
  if (panels.length === 0) return null

  const money = getMoney(panels)
  const health = getHealth(panels)
  const users = getUsers(panels)
  const costs = getCosts(panels)
  const attention = getAttention(panels)

  return (
    <div className="mb-5 rounded-xl border border-[#2A2A3E] bg-[#1E1E2E] overflow-hidden">
      <div className="flex flex-wrap divide-x divide-[#2A2A3E]">
        <MetricTile
          label={money.label}
          value={money.value}
          sub={money.sub}
          valueColor={money.color}
        />
        <MetricTile
          label={health.label}
          value={health.value}
          sub={health.sub}
          valueColor={health.color}
        />
        <MetricTile
          label={users.label}
          value={users.value}
          sub={users.sub}
          valueColor={users.color}
        />
        <MetricTile
          label={costs.label}
          value={costs.value}
          sub={costs.sub ?? costs.breakdown}
          valueColor={costs.color}
          tooltip={costs.breakdown ?? undefined}
        />
        <MetricTile
          label={attention.label}
          value={attention.value}
          sub={attention.sub}
          valueColor={attention.color}
        />
      </div>
    </div>
  )
}
