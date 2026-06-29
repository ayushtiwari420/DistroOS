/**
 * AccountProfile — full-featured SaaS Profile Management page.
 * Works in both Wholesaler and Retailer dashboards (CSS variable
 * theme adapts automatically).
 *
 * Sections
 * ─────────
 * 1. Profile Overview   — avatar + summary card
 * 2. Edit Profile       — editable fields with dirty-check
 * 3. Profile Picture    — upload / preview / remove (JPG·PNG ≤ 2 MB)
 * 4. Change Password    — verify current → new with strength rules
 * 5. Account Information— read-only metadata
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  User, Lock, ShieldCheck, Camera, Save, X, Eye, EyeOff,
  BadgeCheck, Calendar, Clock, Hash, Pencil, RefreshCw, Trash2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchProfile,
  saveProfile,
  changePassword as apiChangePassword,
  uploadAvatar,
  removeAvatar,
} from '../../services/profile.service'

// ─────────────────────────────────────────────────────────────
// Design primitives
// ─────────────────────────────────────────────────────────────

const css = {
  card: {
    background: 'var(--surface, #fff)',
    border: '1px solid var(--border, #E2E5ED)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
  },
  cardHeader: {
    padding: '16px 22px',
    borderBottom: '1px solid var(--border, #E2E5ED)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  cardBody: { padding: '22px 22px' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    background: 'var(--bg, #F5F6FA)',
    border: '1.5px solid var(--border, #E2E5ED)',
    borderRadius: 8,
    color: 'var(--text, #111827)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  inputFocus: {
    borderColor: 'var(--blue, #2563EB)',
    boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
  },
  inputDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
    background: 'var(--bg-2, #ECEEF4)',
  },
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted, #6B7280)',
    marginBottom: 5,
  },
  fieldWrap: { marginBottom: 16 },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 20px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.15s',
  },
  btnPrimary: { background: 'var(--blue, #2563EB)', color: '#fff' },
  btnDanger:  { background: 'var(--red-light, #FEF2F2)', color: 'var(--red, #DC2626)', border: '1px solid #FCA5A5' },
  btnGhost:   { background: 'var(--bg, #F5F6FA)', color: 'var(--text-muted, #6B7280)', border: '1px solid var(--border, #E2E5ED)' },
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, subtitle, accent = 'var(--blue, #2563EB)', children }) {
  return (
    <div style={css.card}>
      <div style={css.cardHeader}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={css.cardBody}>{children}</div>
    </div>
  )
}

function Field({ label, required, children, error }) {
  return (
    <div style={css.fieldWrap}>
      {label && (
        <label style={css.label}>
          {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
        </label>
      )}
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--red, #DC2626)' }}>{error}</p>}
    </div>
  )
}

function Input({ focusColor, error, ...props }) {
  const [focused, setFocused] = useState(false)
  const borderStyle = error
    ? { borderColor: 'var(--red, #DC2626)', boxShadow: '0 0 0 3px rgba(220,38,38,0.08)' }
    : focused ? css.inputFocus : {}
  return (
    <input
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
      style={{ ...css.input, ...(props.disabled ? css.inputDisabled : {}), ...borderStyle, ...props.style }}
    />
  )
}

function PasswordInput({ value, onChange, placeholder, disabled, error, id }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  const borderStyle = error
    ? { borderColor: 'var(--red, #DC2626)', boxShadow: '0 0 0 3px rgba(220,38,38,0.08)' }
    : focused ? css.inputFocus : {}
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...css.input, paddingRight: 38, ...borderStyle }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex', padding: 2,
        }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

function Toast({ message, type = 'success', onDismiss }) {
  const isSuccess = type === 'success'
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      maxWidth: 360, padding: '12px 16px',
      background: isSuccess ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${isSuccess ? '#86EFAC' : '#FCA5A5'}`,
      color: isSuccess ? '#15803D' : '#DC2626',
      borderRadius: 10,
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      animation: 'fadeUp 0.3s ease',
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.85rem',
    }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{isSuccess ? '✅' : '❌'}</span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, flexShrink: 0, lineHeight: 1 }}>
        <X size={14} />
      </button>
    </div>
  )
}

function Spinner({ size = 18, color = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '11px 0',
      borderBottom: '1px solid var(--border, #E2E5ED)',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 7,
        background: 'var(--bg, #F5F6FA)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontFamily: mono ? 'ui-monospace, monospace' : undefined, fontWeight: mono ? 500 : undefined }}>{value || '—'}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    active:    { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', label: 'Active' },
    pending:   { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B', label: 'Pending' },
    suspended: { bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444', label: 'Suspended' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: '0.75rem', fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  )
}

function RoleBadge({ role }) {
  const map = {
    wholesaler: { bg: '#EFF4FF', color: '#2563EB', label: 'Wholesaler' },
    retailer:   { bg: '#F5F3FF', color: '#7C3AED', label: 'Retailer' },
    salesman:   { bg: '#F0FDF4', color: '#16A34A', label: 'Salesman' },
    admin:      { bg: '#FEF2F2', color: '#DC2626', label: 'Admin' },
  }
  const r = map[role] || { bg: '#F5F6FA', color: '#6B7280', label: role }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      background: r.bg, color: r.color,
      fontSize: '0.75rem', fontWeight: 700,
    }}>
      {r.label}
    </span>
  )
}

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { label: '8+ characters',   ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number',           ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const barColor = score === 0 ? '#E2E5ED' : score === 1 ? '#EF4444' : score === 2 ? '#F59E0B' : '#22C55E'
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 3, borderRadius: 999, background: '#E2E5ED', marginBottom: 6 }}>
        <div style={{ height: '100%', borderRadius: 999, background: barColor, width: `${(score / 3) * 100}%`, transition: 'width 0.3s, background 0.3s' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: '0.7rem', color: c.ok ? '#16A34A' : 'var(--text-faint, #9CA3AF)', display: 'flex', alignItems: 'center', gap: 3 }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Avatar Section
// ─────────────────────────────────────────────────────────────

function AvatarSection({ user, onUserUpdate, onToast }) {
  const fileRef = useRef()
  const [preview, setPreview]   = useState(null)
  const [file, setFile]         = useState(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving]   = useState(false)

  const currentUrl = preview || user?.profileImage?.url || null
  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)) {
      onToast('Only JPG, JPEG, and PNG files are allowed.', 'error'); return
    }
    if (f.size > 2 * 1024 * 1024) {
      onToast('Image size must be under 2 MB.', 'error'); return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const data = await uploadAvatar(file)
      onUserUpdate(data.user)
      setFile(null)
      setPreview(null)
      onToast('Profile picture updated successfully!', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setFile(null)
    setPreview(null)
  }

  const handleRemove = async () => {
    if (!user?.profileImage?.url) return
    setRemoving(true)
    try {
      const data = await removeAvatar()
      onUserUpdate(data.user)
      setPreview(null)
      setFile(null)
      onToast('Profile picture removed.', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <SectionCard icon={Camera} title="Profile Picture" subtitle="Upload a JPG or PNG, max 2 MB">
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Avatar preview */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'var(--blue-light, #EFF4FF)',
            border: '3px solid var(--blue-muted, #BFCFED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {currentUrl
              ? <img src={currentUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--blue, #2563EB)' }}>{initials}</span>
            }
          </div>
          {/* Quick upload badge */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--blue, #2563EB)', color: '#fff',
              border: '2px solid var(--surface, #fff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Camera size={12} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {file ? (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 3 }}>Ready to upload:</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{file.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{(file.size / 1024).toFixed(0)} KB</div>
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              {currentUrl ? 'Click the button below to change your photo.' : 'No profile picture yet. Upload one to personalise your account.'}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Select file */}
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
            {!file && (
              <button
                onClick={() => fileRef.current?.click()}
                style={{ ...css.btn, ...css.btnGhost, fontSize: '0.82rem', padding: '7px 14px' }}
              >
                <Camera size={14} /> {currentUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
            )}

            {/* Upload pending file */}
            {file && (
              <>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{ ...css.btn, ...css.btnPrimary, fontSize: '0.82rem', padding: '7px 14px', opacity: uploading ? 0.7 : 1 }}
                >
                  {uploading ? <Spinner size={14} /> : <Save size={14} />}
                  {uploading ? 'Uploading…' : 'Save Photo'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{ ...css.btn, ...css.btnGhost, fontSize: '0.82rem', padding: '7px 14px' }}
                >
                  <X size={14} /> Cancel
                </button>
              </>
            )}

            {/* Remove existing */}
            {!file && currentUrl && user?.profileImage?.url && (
              <button
                onClick={handleRemove}
                disabled={removing}
                style={{ ...css.btn, ...css.btnDanger, fontSize: '0.82rem', padding: '7px 14px', opacity: removing ? 0.7 : 1 }}
              >
                {removing ? <Spinner size={14} color="var(--red, #DC2626)" /> : <Trash2 size={14} />}
                {removing ? 'Removing…' : 'Remove Photo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────
// Edit Profile Section
// ─────────────────────────────────────────────────────────────

function EditProfileSection({ user, onUserUpdate, onToast }) {
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [errors, setErrors]     = useState({})

  const initForm = useCallback(() => ({
    name:         user?.name || '',
    phone:        user?.phone || '',
    city:         user?.city || '',
    businessName: user?.businessName || '',
  }), [user])

  const [form, setForm] = useState(initForm)

  // Sync when user changes (e.g. after avatar update)
  useEffect(() => {
    if (!editing) setForm(initForm())
  }, [user, editing, initForm])

  const isDirty = JSON.stringify(form) !== JSON.stringify(initForm())

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'
    else if (form.name.trim().length > 60) errs.name = 'Name must be under 60 characters.'
    if (form.phone && !/^[+]?[0-9\s\-]{7,15}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone number.'
    if (form.city && form.city.trim().length > 60) errs.city = 'City must be under 60 characters.'
    if (form.businessName && form.businessName.trim().length > 100) errs.businessName = 'Business name must be under 100 characters.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    if (!isDirty) { onToast('No changes to save.', 'error'); return }
    setSaving(true)
    try {
      const data = await saveProfile(form)
      onUserUpdate(data.user)
      setEditing(false)
      onToast('Profile updated successfully!', 'success')
    } catch (e) {
      onToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm(initForm())
    setErrors({})
    setEditing(false)
  }

  return (
    <SectionCard
      icon={Pencil}
      title="Personal Information"
      subtitle="Update your name, contact details, and business info"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 20px' }}>
        <Field label="Full Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={handleChange('name')}
            placeholder="Your full name"
            disabled={!editing}
            error={!!errors.name}
          />
        </Field>

        <Field label="Phone Number" error={errors.phone}>
          <Input
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+91 9876543210"
            disabled={!editing}
            error={!!errors.phone}
          />
        </Field>

        <Field label="Business / Shop Name" error={errors.businessName}>
          <Input
            value={form.businessName}
            onChange={handleChange('businessName')}
            placeholder="e.g. Sharma Distributors"
            disabled={!editing}
            error={!!errors.businessName}
          />
        </Field>

        <Field label="City" error={errors.city}>
          <Input
            value={form.city}
            onChange={handleChange('city')}
            placeholder="Your city"
            disabled={!editing}
            error={!!errors.city}
          />
        </Field>

        <Field label="Email Address">
          <div style={{ position: 'relative' }}>
            <Input value={user?.email || ''} disabled />
            <span style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.68rem', color: 'var(--text-faint)', background: 'var(--bg-2, #ECEEF4)',
              padding: '1px 6px', borderRadius: 4, fontWeight: 600,
            }}>Read-only</span>
          </div>
        </Field>

        <Field label="Role">
          <div style={{ ...css.input, ...css.inputDisabled, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RoleBadge role={user?.role} />
          </div>
        </Field>
      </div>

      {/* Action bar */}
      <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{ ...css.btn, ...css.btnPrimary }}
          >
            <Pencil size={14} /> Edit Profile
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              style={{ ...css.btn, ...css.btnPrimary, opacity: (saving || !isDirty) ? 0.65 : 1 }}
            >
              {saving ? <Spinner size={14} /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{ ...css.btn, ...css.btnGhost }}
            >
              <X size={14} /> Cancel
            </button>
            {!isDirty && <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)', alignSelf: 'center' }}>No changes made</span>}
          </>
        )}
      </div>
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────
// Change Password Section
// ─────────────────────────────────────────────────────────────

function ChangePasswordSection({ onToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors]   = useState({})
  const [saving, setSaving]   = useState(false)

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: undefined, general: undefined }))
  }

  const validate = () => {
    const errs = {}
    if (!form.currentPassword) errs.currentPassword = 'Current password is required.'
    if (!form.newPassword)     errs.newPassword = 'New password is required.'
    else {
      if (form.newPassword.length < 8)       errs.newPassword = 'Must be at least 8 characters.'
      else if (!/[A-Z]/.test(form.newPassword)) errs.newPassword = 'Must contain at least one uppercase letter.'
      else if (!/[0-9]/.test(form.newPassword)) errs.newPassword = 'Must contain at least one number.'
    }
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your new password.'
    else if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await apiChangePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })
      onToast('Password changed successfully!', 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
    } catch (e) {
      onToast(e.message, 'error')
      if (e.message?.toLowerCase().includes('current')) {
        setErrors(p => ({ ...p, currentPassword: e.message }))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard
      icon={Lock}
      title="Change Password"
      subtitle="Verify your current password before setting a new one"
      accent="var(--purple, #7C3AED)"
    >
      <div style={{ maxWidth: 440 }}>
        <Field label="Current Password" error={errors.currentPassword}>
          <PasswordInput
            id="currentPassword"
            value={form.currentPassword}
            onChange={handleChange('currentPassword')}
            placeholder="Enter your current password"
            error={!!errors.currentPassword}
          />
        </Field>

        <Field label="New Password" error={errors.newPassword}>
          <PasswordInput
            id="newPassword"
            value={form.newPassword}
            onChange={handleChange('newPassword')}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            error={!!errors.newPassword}
          />
          <PasswordStrength password={form.newPassword} />
        </Field>

        <Field label="Confirm New Password" error={errors.confirmPassword}>
          <PasswordInput
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            placeholder="Re-enter new password"
            error={!!errors.confirmPassword}
          />
        </Field>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ ...css.btn, background: 'var(--purple, #7C3AED)', color: '#fff', opacity: saving ? 0.7 : 1, marginTop: 4 }}
        >
          {saving ? <Spinner size={14} /> : <Lock size={14} />}
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────
// Account Info Section (read-only)
// ─────────────────────────────────────────────────────────────

function AccountInfoSection({ user }) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <SectionCard
      icon={ShieldCheck}
      title="Account Information"
      subtitle="Read-only system details about your account"
      accent="var(--green, #16A34A)"
    >
      <div style={{ borderTop: '1px solid var(--border)', marginTop: -4 }}>
        <InfoRow icon={Hash}       label="User ID"        value={user?._id}         mono />
        <InfoRow icon={BadgeCheck} label="Role"           value={<RoleBadge role={user?.role} />} />
        <InfoRow icon={BadgeCheck} label="Account Status" value={<StatusBadge status={user?.status} />} />
        <InfoRow icon={Calendar}   label="Member Since"   value={fmt(user?.createdAt)} />
        <InfoRow icon={RefreshCw}  label="Last Updated"   value={fmt(user?.updatedAt)} />
        <div style={{ paddingBottom: 1 }}>
          <InfoRow icon={Clock}    label="Last Login"     value={user?.lastLogin ? fmt(user.lastLogin) : 'No recent login recorded'} />
        </div>
      </div>
    </SectionCard>
  )
}

// ─────────────────────────────────────────────────────────────
// Profile Overview Banner
// ─────────────────────────────────────────────────────────────

function ProfileOverview({ user }) {
  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const lastLogin  = user?.lastLogin  ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No recent login'

  return (
    <div style={{
      ...css.card,
      background: 'linear-gradient(135deg, var(--blue, #2563EB) 0%, #1D4ED8 100%)',
      border: 'none',
      color: '#fff',
      padding: '28px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexWrap: 'wrap',
    }}>
      {/* Avatar */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        border: '3px solid rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {user?.profileImage?.url
          ? <img src={user.profileImage.url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{initials}</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.35rem', fontWeight: 800, marginBottom: 4 }}>
          {user?.name || 'Unknown User'}
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: 8 }}>{user?.email}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <RoleBadge role={user?.role} />
          <StatusBadge status={user?.status} />
          {user?.businessName && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 999 }}>
              {user.businessName}
            </span>
          )}
          {user?.city && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 999 }}>
              📍 {user.city}
            </span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Member since</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{joinedDate}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 4 }}>Last login</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lastLogin}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

export default function AccountProfile() {
  const { user: ctxUser, setUser: setCtxUser } = useAuth()

  const [user, setUser]       = useState(ctxUser)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null) // { message, type }

  // Fetch fresh profile on mount (ensures stale ctx data is refreshed)
  useEffect(() => {
    let ignore = false
    fetchProfile()
      .then(d => { if (!ignore) { setUser(d.user); setCtxUser?.(d.user) } })
      .catch(() => { if (!ignore) setUser(ctxUser) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUserUpdate = (updated) => {
    setUser(updated)
    setCtxUser?.(updated)
  }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner size={32} color="var(--blue, #2563EB)" />
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading profile…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', animation: 'fadeUp 0.35s ease' }}>
        {/* Banner */}
        <ProfileOverview user={user} />

        {/* Two-column layout on wider screens */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <EditProfileSection   user={user} onUserUpdate={handleUserUpdate} onToast={showToast} />
            <ChangePasswordSection                                              onToast={showToast} />
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <AvatarSection        user={user} onUserUpdate={handleUserUpdate} onToast={showToast} />
            <AccountInfoSection   user={user} />
          </div>
        </div>
      </div>

      {/* Toast portal */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </>
  )
}
