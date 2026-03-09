import { Metric } from '../ui/Metric'

interface StripePanelData {
  mrr: number
  mrrDelta30d: number
  activeSubscriptions: number
  newSubscriptions24h: number
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
  currency: string
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
  const mrrDeltaStr =
    data.mrrDelta30d >= 0
      ? `+${formatCurrency(data.mrrDelta30d, data.currency)} (30d)`
      : `${formatCurrency(data.mrrDelta30d, data.currency)} (30d)`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Metric
          label="MRR"
          value={formatCurrency(data.mrr, data.currency)}
          subValue={mrrDeltaStr}
          trend={mrrTrend}
        />
        <Metric label="Active Subs" value={data.activeSubscriptions} />
        <Metric label="New (24h)" value={data.newSubscriptions24h} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Canceled (30d)" value={data.canceledSubscriptions30d} />
        <Metric
          label="Failed (24h)"
          value={data.failedPayments24h}
          subValue={
            data.failedPaymentAmount > 0
              ? formatCurrency(data.failedPaymentAmount, data.currency)
              : undefined
          }
          trend={data.failedPayments24h > 0 ? 'down' : 'neutral'}
        />
        <Metric
          label="Currency"
          value={data.currency.toUpperCase()}
        />
      </div>
      {data.recentEvents.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Recent payments</p>
          <div className="space-y-1.5">
            {data.recentEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-400 truncate max-w-[60%]">
                  {event.description ?? event.id.slice(0, 12)}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      event.status === 'succeeded'
                        ? 'text-[#00D46A]'
                        : event.status === 'failed'
                          ? 'text-[#FF4545]'
                          : 'text-gray-400'
                    }
                  >
                    {formatCurrency(event.amount, event.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
