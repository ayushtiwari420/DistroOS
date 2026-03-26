const variants = {
  pending:    { bg: 'var(--amber-light)',  color: 'var(--amber)',  dot: '#D97706' },
  approved:   { bg: 'var(--green-light)',  color: 'var(--green)',  dot: '#16A34A' },
  dispatched: { bg: 'var(--blue-light)',   color: 'var(--blue)',   dot: '#2563EB' },
  cancelled:  { bg: 'var(--red-light)',    color: 'var(--red)',    dot: '#DC2626' },
  overdue:    { bg: 'var(--red-light)',    color: 'var(--red)',    dot: '#DC2626' },
  paid:       { bg: 'var(--green-light)',  color: 'var(--green)',  dot: '#16A34A' },
  low:        { bg: 'var(--amber-light)',  color: 'var(--amber)',  dot: '#D97706' },
  critical:   { bg: 'var(--red-light)',    color: 'var(--red)',    dot: '#DC2626' },
  active:     { bg: 'var(--green-light)',  color: 'var(--green)',  dot: '#16A34A' },
  suspended:  { bg: 'var(--red-light)',    color: 'var(--red)',    dot: '#DC2626' },
  visited:    { bg: 'var(--green-light)',  color: 'var(--green)',  dot: '#16A34A' },
  default:    { bg: 'var(--bg-2)',         color: 'var(--text-muted)', dot: '#9CA3AF' },
}

export default function Badge({ status }) {
  const key   = status?.toLowerCase() || 'default'
  const style = variants[key] || variants.default

  return (
    <span style={{
      background: style.bg,
      color: style.color,
      padding: '3px 10px',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.dot, flexShrink: 0, display: 'inline-block' }} />
      {status}
    </span>
  )
}
