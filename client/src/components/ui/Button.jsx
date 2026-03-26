// Reusable Button component
// Usage: <Button variant="primary" size="lg" onClick={...}>Click Me</Button>
// variants: "primary" | "outline" | "ghost"
// sizes:    "sm" | "md" | "lg"

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const base = {
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    transition: 'all 0.2s',
    textDecoration: 'none',
    borderRadius: size === 'lg' ? '10px' : '8px',
  }

  const sizeStyles = {
    sm: { padding: '6px 16px', fontSize: '0.8rem' },
    md: { padding: '10px 22px', fontSize: '0.9rem' },
    lg: { padding: '14px 32px', fontSize: '1rem' },
  }

  const variantStyles = {
    primary: {
      background: 'var(--amber)',
      color: '#0A1628',
    },
    outline: {
      background: 'transparent',
      color: 'var(--amber)',
      border: '1.5px solid var(--amber)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    },
  }

  const hoverMap = {
    primary: (e) => {
      e.currentTarget.style.background = 'var(--amber-light)'
      e.currentTarget.style.transform = 'translateY(-1px)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.3)'
    },
    outline: (e) => {
      e.currentTarget.style.background = 'var(--amber-dim)'
      e.currentTarget.style.transform = 'translateY(-1px)'
    },
    ghost: (e) => {
      e.currentTarget.style.color = 'var(--text)'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
    },
  }

  const leaveMap = {
    primary: (e) => {
      e.currentTarget.style.background = 'var(--amber)'
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    },
    outline: (e) => {
      e.currentTarget.style.background = 'transparent'
      e.currentTarget.style.transform = 'translateY(0)'
    },
    ghost: (e) => {
      e.currentTarget.style.color = 'var(--text-muted)'
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.background = 'transparent'
    },
  }

  return (
    <button
      type={type}
      onClick={onClick}
      style={{ ...base, ...sizeStyles[size], ...variantStyles[variant] }}
      onMouseEnter={hoverMap[variant]}
      onMouseLeave={leaveMap[variant]}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
