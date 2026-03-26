import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../ui/Brandlogo'

const navLinks = [
  { label: 'Features',   href: '#features' },
  { label: 'How it works', href: '#how'   },
  { label: 'Roles',      href: '#roles'   },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.25s ease',
    }}>
      <div style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '0 28px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <BrandLogo size="md" variant="dark" />
        </Link>

        {/* Nav links — desktop */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              style={{
                padding: '6px 14px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                borderRadius: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to="/login"
            style={{
              padding: '7px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              borderRadius: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            style={{
              padding: '7px 18px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              background: 'var(--blue)',
              textDecoration: 'none',
              borderRadius: 7,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
