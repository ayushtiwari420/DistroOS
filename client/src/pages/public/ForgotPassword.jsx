import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = async (endpoint, body) => {
  const res  = await fetch(`${BASE}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Something went wrong.')
  return data
}

export default function ForgotPassword() {
  const navigate = useNavigate()

  // step: 'email' | 'otp' | 'reset' | 'done'
  const [step,    setStep]    = useState('email')
  const [email,   setEmail]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [pw,      setPw]      = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  // ── Step 1 — Send OTP ──
  const handleSendOtp = async () => {
    if (!email) return setError('Please enter your email address.')
    setLoading(true); setError('')
    try {
      await api('/auth/forgot-password', { email })
      setSuccess(`OTP sent to ${email}`)
      setStep('otp')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // ── Step 2 — Verify OTP ──
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return setError('Please enter the 6-digit OTP.')
    setLoading(true); setError('')
    try {
      await api('/auth/verify-otp', { email, otp })
      setSuccess('')
      setStep('reset')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // ── Step 3 — Reset Password ──
  const handleReset = async () => {
    if (!pw.newPassword || !pw.confirmPassword) return setError('Please fill in both fields.')
    if (pw.newPassword !== pw.confirmPassword)  return setError('Passwords do not match.')
    if (pw.newPassword.length < 8)              return setError('Password must be at least 8 characters.')
    setLoading(true); setError('')
    try {
      await api('/auth/reset-password', { email, newPassword: pw.newPassword })
      setStep('done')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // ── Step indicators ──
  const steps = [
    { key: 'email', label: 'Enter Email' },
    { key: 'otp',   label: 'Verify OTP'  },
    { key: 'reset', label: 'New Password' },
  ]
  const stepIndex = { email: 0, otp: 1, reset: 2, done: 2 }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px',
    background: 'var(--bg, #F9FAFB)',
    border: '1px solid var(--border, #E5E7EB)',
    borderRadius: 9,
    color: 'var(--text, #111827)',
    fontSize: '0.9rem',
    outline: 'none',
    marginBottom: 14,
  }

  const btnStyle = {
    width: '100%', padding: '12px',
    background: '#1A56DB',
    color: '#fff', border: 'none',
    borderRadius: 9, cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: 700,
    marginTop: 4,
    opacity: loading ? 0.7 : 1,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #F3F4F6)', padding: 20, fontFamily: 'Inter, DM Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface, #fff)', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#1A56DB', padding: '24px 28px' }}>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#fff', marginBottom: 2 }}>
            Distro<span style={{ opacity: 0.75 }}>OS</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Reset your password</div>
        </div>

        <div style={{ padding: '28px 28px 32px' }}>

          {/* Step indicators — hide on done */}
          {step !== 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              {steps.map((s, i) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: i <= stepIndex[step] ? '#1A56DB' : '#E5E7EB', color: i <= stepIndex[step] ? '#fff' : '#9CA3AF', transition: 'all 0.3s' }}>
                      {i < stepIndex[step] ? '✓' : i + 1}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: i <= stepIndex[step] ? '#1A56DB' : '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</div>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < stepIndex[step] ? '#1A56DB' : '#E5E7EB', margin: '0 6px', marginBottom: 18, transition: 'all 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '9px 14px', fontSize: '0.82rem', marginBottom: 16 }}>{error}</div>
          )}
          {success && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A', borderRadius: 8, padding: '9px 14px', fontSize: '0.82rem', marginBottom: 16 }}>{success}</div>
          )}

          {/* ── STEP 1: EMAIL ── */}
          {step === 'email' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Forgot your password?</div>
              <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 20 }}>Enter the email address linked to your account. We'll send a 6-digit OTP.</div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>Email Address</label>
              <input type="email" placeholder="yourname@gmail.com" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                style={inputStyle} />
              <button onClick={handleSendOtp} disabled={loading} style={btnStyle}>
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
            </div>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Enter OTP</div>
              <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 20 }}>
                A 6-digit OTP was sent to <strong>{email}</strong>. Check your inbox (and spam folder).
              </div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>6-Digit OTP</label>
              <input type="text" placeholder="e.g. 847291" maxLength={6} value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                style={{ ...inputStyle, fontSize: '1.4rem', letterSpacing: 8, textAlign: 'center', fontWeight: 700 }} />
              <button onClick={handleVerifyOtp} disabled={loading} style={btnStyle}>
                {loading ? 'Verifying...' : 'Verify OTP →'}
              </button>
              <button onClick={() => { setStep('email'); setOtp(''); setError(''); setSuccess('') }}
                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#6B7280', border: 'none', cursor: 'pointer', fontSize: '0.82rem', marginTop: 8 }}>
                ← Change email / Resend OTP
              </button>
            </div>
          )}

          {/* ── STEP 3: NEW PASSWORD ── */}
          {step === 'reset' && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Set New Password</div>
              <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: 20 }}>Choose a strong password with at least 8 characters.</div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>New Password</label>
              <input type="password" placeholder="Min 8 characters" value={pw.newPassword}
                onChange={e => { setPw(p => ({ ...p, newPassword: e.target.value })); setError('') }}
                style={inputStyle} />
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>Confirm New Password</label>
              <input type="password" placeholder="Re-enter password" value={pw.confirmPassword}
                onChange={e => { setPw(p => ({ ...p, confirmPassword: e.target.value })); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={inputStyle} />
              <button onClick={handleReset} disabled={loading} style={btnStyle}>
                {loading ? 'Updating...' : 'Set New Password ✓'}
              </button>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Password Reset Successfully!</div>
              <div style={{ fontSize: '0.83rem', color: '#6B7280', marginBottom: 24 }}>
                Your password has been updated. You can now log in with your new password.
              </div>
              <button onClick={() => navigate('/login')}
                style={{ ...btnStyle, width: 'auto', padding: '11px 32px' }}>
                Go to Login →
              </button>
            </div>
          )}

          {/* Back to login link */}
          {step !== 'done' && (
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: '#6B7280' }}>
              Remember your password? <Link to="/login" style={{ color: '#1A56DB', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}