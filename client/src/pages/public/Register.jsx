import { useState }          from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser }      from '../../services/auth.service'
import BrandLogo             from '../../components/ui/BrandLogo'

const roles = [
  { key: 'wholesaler', label: 'Wholesaler', desc: 'I run a wholesale distribution business' },
  { key: 'salesman',   label: 'Salesman',   desc: 'I am a field sales representative'       },
  { key: 'retailer',  label: 'Retailer',   desc: 'I am a shopkeeper / retailer'             },
]

const steps = ['Your Role', 'Business Info', 'Account']

export default function RegisterPage() {
  const [step, setStep]         = useState(0)
  const [role, setRole]         = useState('wholesaler')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState({
    businessName: '', ownerName: '', phone: '', city: '',
    email: '', password: '', confirmPassword: '',
  })
  const navigate = useNavigate()

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const nextStep = () => { setError(''); setStep(s => Math.min(s + 1, 2)) }
  const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await registerUser({
        name:         form.ownerName,
        email:        form.email,
        password:     form.password,
        role,
        businessName: form.businessName,
        city:         form.city,
        phone:        form.phone,
      })
      // Redirect to login with success message
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      // express-validator returns array of errors
      if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors.map(e => e.msg).join(' '))
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const ErrorBox = () => error ? (
    <div style={{
      background: 'var(--red-light)', border: '1px solid #FCA5A5',
      color: 'var(--red)', borderRadius: 'var(--radius)',
      padding: '10px 14px', fontSize: '0.85rem',
      marginBottom: 14, fontWeight: 500,
    }}>
      {error}
    </div>
  ) : null

  return (
    <div className="auth-page">

      {/* ── Left Panel ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <BrandLogo size="lg" variant="light" />
          <div>
            <h2 className="auth-left-heading">
              Start digitizing<br />
              <span>your distribution.</span>
            </h2>
            <p className="auth-left-sub">
              Join hundreds of wholesalers who moved their business online with DistroOS.
            </p>
          </div>
          <div className="auth-left-features">
            {[
              'Set up in under 5 minutes',
              'No credit card required',
              'Works on mobile & desktop',
              'Free trial included',
            ].map(f => (
              <div key={f} className="auth-left-feature">
                <div className="auth-left-feature-dot" />
                {f}
              </div>
            ))}
          </div>
          <div className="auth-step-sidebar">
            {steps.map((s, i) => (
              <div key={s} className={`step-sidebar-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="step-sidebar-dot">{i < step ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          <div className="auth-form-header">
            <h1>Create account</h1>
            <p>Step {step + 1} of 3 — {steps[step]}</p>
          </div>

          <div className="progress-bar-wrap">
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${((step + 1) / 3) * 100}%` }} />
            </div>
          </div>

          {/* ── Step 0: Role ── */}
          {step === 0 && (
            <div className="step-content">
              <p className="step-label">What best describes you?</p>
              <div className="register-role-grid">
                {roles.map(r => (
                  <button key={r.key} type="button"
                    onClick={() => setRole(r.key)}
                    className={`register-role-card ${role === r.key ? 'active' : ''}`}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <span className="register-role-label">{r.label}</span>
                      <span className="register-role-desc">{r.desc}</span>
                    </div>
                    {role === r.key && (
                      <div style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg viewBox="0 0 12 12" fill="none" style={{ width:10, height:10 }}>
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button className="auth-submit-btn" onClick={nextStep}>
                Continue as {roles.find(r => r.key === role)?.label}
              </button>
            </div>
          )}

          {/* ── Step 1: Business ── */}
          {step === 1 && (
            <div className="step-content">
              <p className="step-label">Tell us about your business</p>
              <ErrorBox />
              <div className="auth-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Business name</label>
                    <input className="input" type="text" name="businessName"
                      placeholder="e.g. Mehta Traders"
                      value={form.businessName} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Owner name</label>
                    <input className="input" type="text" name="ownerName"
                      placeholder="Your full name"
                      value={form.ownerName} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Phone number</label>
                    <input className="input" type="tel" name="phone"
                      placeholder="+91 98765 43210"
                      value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input className="input" type="text" name="city"
                      placeholder="e.g. Mumbai"
                      value={form.city} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="auth-btn-row" style={{ marginTop: 16 }}>
                <button className="auth-back-btn" onClick={prevStep}>Back</button>
                <button className="auth-submit-btn" onClick={nextStep}
                  disabled={!form.ownerName}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Account ── */}
          {step === 2 && (
            <div className="step-content">
              <p className="step-label">Set your login credentials</p>
              <ErrorBox />
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label>Email address</label>
                  <input className="input" type="email" name="email"
                    placeholder="you@business.com"
                    value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input className="input" type={showPass ? 'text' : 'password'}
                        name="password" placeholder="Min. 8 characters"
                        value={form.password} onChange={handleChange}
                        required autoComplete="new-password"
                        style={{ paddingRight: 38 }} />
                      <button type="button" className="pass-toggle"
                        onClick={() => setShowPass(p => !p)}>
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm password</label>
                    <input className="input" type={showPass ? 'text' : 'password'}
                      name="confirmPassword" placeholder="Repeat password"
                      value={form.confirmPassword} onChange={handleChange}
                      required autoComplete="new-password" />
                  </div>
                </div>
                <div className="auth-btn-row">
                  <button type="button" className="auth-back-btn" onClick={prevStep}>Back</button>
                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? <span className="auth-spinner" /> : 'Create account'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  )
}
