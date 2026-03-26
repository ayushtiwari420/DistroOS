import { useState } from 'react'
import { Link }     from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import BrandLogo    from '../../components/ui/BrandLogo'

const roles = [
  { key: 'wholesaler', label: 'Wholesaler' },
  { key: 'salesman',   label: 'Salesman'   },
  { key: 'retailer',  label: 'Retailer'   },
  { key: 'admin',     label: 'Admin'      },
]

export default function LoginPage() {
  const { login }                   = useAuth()
  const [selectedRole, setRole]     = useState('wholesaler')
  const [form, setForm]             = useState({ email: '', password: '' })
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password, selectedRole)
      // AuthContext handles redirect automatically
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">

      {/* ── Left Panel ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <BrandLogo size="lg" variant="light" />
          <div>
            <h2 className="auth-left-heading">
              Your distribution<br />
              <span>business, online.</span>
            </h2>
            <p className="auth-left-sub">
              Manage orders, inventory, retailers and your sales team — all from one place.
            </p>
          </div>
          <div className="auth-left-stats">
            {[
              { num: '500+', label: 'Active Retailers' },
              { num: '3x',   label: 'Faster Ordering'  },
              { num: '99.8%',label: 'Uptime'            },
            ].map(s => (
              <div key={s.label}>
                <div className="auth-left-stat-num">{s.num}</div>
                <div className="auth-left-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="auth-left-features">
            {[
              'Real-time order tracking',
              'Credit management built-in',
              'Salesman route assignment',
              'Analytics & reports',
            ].map(f => (
              <div key={f} className="auth-left-feature">
                <div className="auth-left-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h1>Sign in</h1>
            <p>Select your role and enter your credentials</p>
          </div>

          {/* Role selector */}
          <div className="role-grid">
            {roles.map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={`role-card ${selectedRole === r.key ? 'active' : ''}`}
              >
                <span className="role-card-label" style={{ fontSize: '0.8rem', fontWeight: selectedRole === r.key ? 600 : 500 }}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: 'var(--red-light)', border: '1px solid #FCA5A5',
              color: 'var(--red)', borderRadius: 'var(--radius)',
              padding: '10px 14px', fontSize: '0.85rem',
              marginBottom: 16, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email address</label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@business.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 38 }}
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading
                ? <span className="auth-spinner" />
                : `Sign in as ${roles.find(r => r.key === selectedRole)?.label}`
              }
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

        </div>
      </div>
    </div>
  )
}
