const colorMap = {
  amber:  { value: 'var(--amber)',  bg: 'var(--amber-light)' },
  green:  { value: 'var(--green)',  bg: 'var(--green-light)' },
  teal:   { value: '#0891B2',       bg: '#ECFEFF'            },
  red:    { value: 'var(--red)',    bg: 'var(--red-light)'   },
  blue:   { value: 'var(--blue)',   bg: 'var(--blue-light)'  },
  purple: { value: 'var(--purple)', bg: 'var(--purple-light)'},
}

const deltaColorMap = {
  up:      'var(--green)',
  down:    'var(--red)',
  neutral: 'var(--text-muted)',
}

const deltaArrow = { up: '↑', down: '↓', neutral: '→' }

export default function StatCard({ icon, label, value, delta, deltaType = 'up', color = 'blue' }) {
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon-wrap" style={{ background: c.bg }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
        </div>
        <span className="stat-card-label">{label}</span>
      </div>

      <div className="stat-card-value" style={{ color: c.value }}>
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
