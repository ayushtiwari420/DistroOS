const variants = {
  pending:    { bg: '#FFFBEB', color: '#D97706', dot: '#D97706' },
  approved:   { bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
  dispatched: { bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
  delivered:  { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  completed:  { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  cancelled:  { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
  rejected:   { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
  overdue:    { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
  paid:       { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  low:        { bg: '#FFFBEB', color: '#D97706', dot: '#D97706' },
  critical:   { bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
  active:     { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  suspended:  { bg: '#F3F4F6', color: '#4B5563', dot: '#6B7280' },
  visited:    { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  healthy:    { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  clear:      { bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  default:    { bg: '#F3F4F6', color: '#4B5563', dot: '#6B7280' },
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

