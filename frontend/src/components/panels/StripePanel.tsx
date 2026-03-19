import { Metric } from '../ui/Metric'

interface StripePanelData {
  mrr: number
  mrrDelta30d: number
  mrrGrowthPct: number
  projectedAnnualRevenue: number
  arpu: number
  activeSubscriptions: number
  newSubscriptions24h: number
  daysSinceLastNewSub: number | null
  canceledSubscriptions30d: number
  failedPayments24h: number
  failedPaymentAmount: number
  recentEvents: Array<{
    id: string
    amount: number
    currency: string
    status: string
    date: string
    description: string | null
  }>
  churnRate30d: number
  currency: string
  netRevenue30d: number
  disputes: { count: number; totalAmount: number }
  openInvoices: { count: number; totalAmount: number }
  recentPayouts: Array<{ amount: number; arrivalDate: string; status: string }>
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function StripePanel({ data }: { data: StripePanelData }) {
  const mrrTrend = data.mrrDelta30d > 0 ? 'up' : data.mrrDelta30d < 0 ? 'down' : 'neutral'
  const growthArrow = data.mrrGrowthPct > 0 ? '\u2191' : data.mrrGrowthPct < 0 ? '\u2193' : ''
  const growthColor =
    data.mrrGrowthPct > 0
      ? 'text-[#10B981]'
      : data.mrrGrowthPct < 0
        ? 'text-[#EF4444]'
        : 'text-gray-400'

  const hasAlerts = data.disputes.count > 0 || data.failedPayments24h > 0 || data.churnRate30d > 5

  return (
    <div className="space-y-4">
      {/* Hero: MRR with % change */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-white">{formatCurrency(data.mrr, data.currency)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Monthly Recurring Revenue</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${growthColor}`}>
            {growthArrow} {Math.abs(data.mrrGrowthPct)}%
          </p>
          <p className="text-[10px] text-gray-600">30d growth</p>
        </div>
      </div>

      {/* Alert row */}
      {hasAlerts && (
        <div className="space-y-1">
          {data.disputes.count > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#EF444415] border border-[#EF444430]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
              <span className="text-xs text-[#EF4444]">
                {data.disputes.count} dispute{data.disputes.count !== 1 ? 's' : ''} (
                {formatCurrency(data.disputes.totalAmount, data.currency)}) &mdash; respond within 7
                days
              </span>
            </div>
          )}
          {data.failedPayments24h > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#EF444415] border border-[#EF444430]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
              <span className="text-xs text-[#EF4444]">
                {data.failedPayments24h} failed payment
                {data.failedPayments24h !== 1 ? 's' : ''} in 24h (
                {formatCurrency(data.failedPaymentAmount, data.currency)})
              </span>
            </div>
          )}
          {data.churnRate30d > 5 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#F59E0B15] border border-[#F59E0B30]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="text-xs text-[#F59E0B]">
                Churn rate {data.churnRate30d}% &mdash; above 5% threshold
              </span>
            </div>
          )}
        </div>
      )}

      {/* Supporting metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Active Subs" value={data.activeSubscriptions} />
        <Metric
          label="Net Revenue (30d)"
          value={formatCurrency(data.netRevenue30d, data.currency)}
          trend={mrrTrend}
        />
        <Metric label="ARPU" value={formatCurrency(data.arpu, data.currency)} />
      </div>

      {/* Secondary info row */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {data.openInvoices.count > 0 && (
          <span>
            {data.openInvoices.count} open invoice{data.openInvoices.count !== 1 ? 's' : ''} (
            {formatCurrency(data.openInvoices.totalAmount, data.currency)})
          </span>
        )}
        {data.recentPayouts.length > 0 && (
          <span className="text-gray-600">
            Last payout: {formatCurrency(data.recentPayouts[0]!.amount, data.currency)}
          </span>
        )}
      </div>
    </div>
  )
}
