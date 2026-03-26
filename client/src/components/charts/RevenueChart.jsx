import { useState } from 'react'

const monthlyData = [
  { month: 'Aug', revenue: 180000, orders: 210 },
  { month: 'Sep', revenue: 220000, orders: 255 },
  { month: 'Oct', revenue: 195000, orders: 230 },
  { month: 'Nov', revenue: 260000, orders: 298 },
  { month: 'Dec', revenue: 310000, orders: 340 },
  { month: 'Jan', revenue: 285000, orders: 315 },
  { month: 'Feb', revenue: 340000, orders: 372 },
]

const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue))

function formatRevenue(val) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  return `₹${(val / 1000).toFixed(0)}K`
}

export default function RevenueChart() {
  const [hovered, setHovered] = useState(null)
  const [view, setView]       = useState('revenue') // 'revenue' | 'orders'

  const maxOrders = Math.max(...monthlyData.map((d) => d.orders))
  const maxVal    = view === 'revenue' ? maxRevenue : maxOrders

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-title">Revenue Overview</h3>
          <p className="chart-subtitle">Last 7 months performance</p>
        </div>
        <div className="chart-toggle">
          <button
            className={view === 'revenue' ? 'active' : ''}
            onClick={() => setView('revenue')}
          >
            Revenue
          </button>
          <button
            className={view === 'orders' ? 'active' : ''}
            onClick={() => setView('orders')}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-body">
        {/* Y axis labels */}
        <div className="chart-y-axis">
          {[100, 75, 50, 25, 0].map((pct) => (
            <span key={pct}>
              {view === 'revenue'
                ? formatRevenue((maxVal * pct) / 100)
                : Math.round((maxVal * pct) / 100)}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div className="chart-bars-wrap">
          {/* Grid lines */}
          <div className="chart-grid">
            {[0, 25, 50, 75, 100].map((pct) => (
              <div key={pct} className="chart-grid-line" style={{ bottom: `${pct}%` }} />
            ))}
          </div>

          {/* Bars */}
          <div className="chart-bars">
            {monthlyData.map((d, i) => {
              const val     = view === 'revenue' ? d.revenue : d.orders
              const heightPct = (val / maxVal) * 100
              const isHov   = hovered === i

              return (
                <div
                  key={d.month}
                  className="chart-bar-col"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Tooltip */}
                  {isHov && (
                    <div className="chart-tooltip">
                      <div className="chart-tooltip-month">{d.month}</div>
                      <div className="chart-tooltip-val">
                        {view === 'revenue' ? formatRevenue(d.revenue) : `${d.orders} orders`}
                      </div>
                    </div>
                  )}

                  <div
                    className="chart-bar"
                    style={{
                      height: `${heightPct}%`,
                      background: isHov
                        ? 'var(--amber)'
                        : i === monthlyData.length - 1
                        ? 'var(--amber)'
                        : 'var(--card-2)',
                      border: `1px solid ${isHov || i === monthlyData.length - 1 ? 'var(--amber)' : 'var(--border)'}`,
                      opacity: isHov ? 1 : i === monthlyData.length - 1 ? 0.9 : 0.6,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                  <span className="chart-bar-label">{d.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="chart-summary">
        {[
          { label: 'This Month',  value: formatRevenue(340000), color: 'var(--amber)' },
          { label: 'Last Month',  value: formatRevenue(285000), color: 'var(--text)' },
          { label: 'Growth',      value: '+19.3%',              color: 'var(--green)' },
        ].map((s) => (
          <div key={s.label} className="chart-summary-item">
            <span className="chart-summary-label">{s.label}</span>
            <span className="chart-summary-value" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
