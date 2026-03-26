/**
 * BrandLogo — text-only wordmark for DistroOS
 * Props:
 *  size:    'sm' | 'md' | 'lg'
 *  variant: 'dark' | 'light' (light = white text, for blue backgrounds)
 *  collapsed: bool (sidebar icon-only mode — shows "D" monogram)
 */
export default function BrandLogo({ size = 'md', variant = 'dark', collapsed = false }) {
  const sizes = {
    sm: { font: '0.9rem',  mono: '0.85rem', pad: '5px 8px'  },
    md: { font: '1.05rem', mono: '0.9rem',  pad: '6px 9px'  },
    lg: { font: '1.25rem', mono: '1rem',    pad: '7px 11px' },
  }

  const s = sizes[size] || sizes.md

  const textColor      = variant === 'light' ? '#ffffff'              : 'var(--text)'
  const accentColor    = variant === 'light' ? 'rgba(255,255,255,0.6)': 'var(--blue)'
  const monoBg         = variant === 'light' ? 'rgba(255,255,255,0.15)': 'var(--blue-light)'
  const monoText       = variant === 'light' ? '#ffffff'              : 'var(--blue)'
  const monoBorder     = variant === 'light' ? 'rgba(255,255,255,0.25)': 'var(--blue-muted)'

  // Collapsed mode — just a styled "D" monogram
  if (collapsed) {
    return (
      <div style={{
        width: 32, height: 32,
        background: monoBg,
        border: `1.5px solid ${monoBorder}`,
        borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 800,
        fontSize: s.mono,
        color: monoText,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}>
        D
      </div>
    )
  }

  return (
    <span style={{
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 800,
      fontSize: s.font,
      color: textColor,
      letterSpacing: '-0.03em',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 0,
    }}>
      Distro
      <span style={{ color: accentColor, fontWeight: 700 }}>OS</span>
    </span>
  )
}
