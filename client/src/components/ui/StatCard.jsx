const colorMap = {
  amber:  { iconColor: '#D97706', bg: '#FFFBEB' },
  green:  { iconColor: '#16A34A', bg: '#F0FDF4' },
  teal:   { iconColor: '#2563EB', bg: '#EFF6FF' },
  red:    { iconColor: '#DC2626', bg: '#FEF2F2' },
  blue:   { iconColor: '#2563EB', bg: '#EFF6FF' },
  purple: { iconColor: '#2563EB', bg: '#EFF6FF' },
  slate:  { iconColor: '#4B5563', bg: '#F8FAFC' },
}


const deltaColorMap = {
  up:      '#16A34A',
  down:    '#DC2626',
  neutral: '#6B7280',
}

const deltaArrow = { up: '↑', down: '↓', neutral: '→' }

export default function StatCard({ icon, label, value, delta, deltaType = 'up', color = 'slate' }) {
  const c = colorMap[color] || colorMap.slate

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon-wrap" style={{ background: c.bg, color: c.iconColor }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
        </div>
        <span className="stat-card-label">{label}</span>
      </div>

      <div className="stat-card-value" style={{ color: 'var(--text)' }}>
        {value}
      </div>

      {delta && (
        <div className="stat-card-delta" style={{ color: deltaColorMap[deltaType] }}>
          {deltaArrow[deltaType]} {delta}
        </div>
      )}
    </div>
  )
}

