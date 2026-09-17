import React from 'react'
import { Boxes } from 'lucide-react'

export default function BrandLogo({ size = 'md', variant = 'dark', collapsed = false }) {
  const sizes = {
    sm: { font: '0.95rem', mono: '0.85rem', box: 26, icon: 14 },
    md: { font: '1.1rem',  mono: '0.95rem', box: 32, icon: 16 },
    lg: { font: '1.3rem',  mono: '1.05rem', box: 38, icon: 20 },
  }

  const s = sizes[size] || sizes.md

  const textColor   = variant === 'light' ? '#FFFFFF' : 'var(--text, #111827)'
  const accentColor = variant === 'light' ? 'rgba(255,255,255,0.7)' : 'var(--blue, #2563EB)'
  const iconBg      = variant === 'light' ? 'rgba(255,255,255,0.2)' : 'var(--blue, #2563EB)'
  const iconColor   = '#FFFFFF'

  if (collapsed) {
    return (
      <div style={{
        width: s.box,
        height: s.box,
        background: iconBg,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: iconColor,
        boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
        flexShrink: 0,
      }}>
        <Boxes size={s.icon} strokeWidth={2.2} />
      </div>
    )
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <div style={{
        width: s.box,
        height: s.box,
        background: iconBg,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: iconColor,
        boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
        flexShrink: 0,
      }}>
        <Boxes size={s.icon} strokeWidth={2.2} />
      </div>
      <span style={{
        fontFamily: '"Manrope", "Plus Jakarta Sans", sans-serif',
        fontWeight: 800,
        fontSize: s.font,
        color: textColor,
        letterSpacing: '-0.03em',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 0,
      }}>
        Distro
        <span style={{ color: accentColor, fontWeight: 700 }}>OS</span>
      </span>
    </div>
  )
}
