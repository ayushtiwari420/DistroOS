import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  User, Building2, Lock, CreditCard, Bell, ShieldCheck, LogOut, ChevronDown,
  Camera, Save, X, Eye, EyeOff, Check, Copy, AlertCircle, FileText, Smartphone,
  Mail, Sparkles, CheckCircle2, Shield, RefreshCw, Trash2, Pencil, ExternalLink
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
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────
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
      background: isSuccess ? '#EFF6FF' : '#FEF2F2',
      border: `1px solid ${isSuccess ? '#BFDBFE' : '#FCA5A5'}`,
      color: isSuccess ? '#1E40AF' : '#DC2626',
      borderRadius: 10,
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
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

function Spinner({ size = 16, color = 'var(--blue, #2563EB)' }) {
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

// ─────────────────────────────────────────────────────────────
// MAIN DROPDOWN & MODAL CONTAINER
// ─────────────────────────────────────────────────────────────
export default function AccountSystemDropdown() {
  const { user: ctxUser, setUser: setCtxUser, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(null) // null = modal closed; 'profile' | 'business' | 'security' | 'billing' | 'notifications' | 'system'
  const [toast, setToast] = useState(null)
  const dropdownRef = useRef(null)

  // Sync state user with auth context
  const [user, setUser] = useState(ctxUser)
  useEffect(() => {
    setUser(ctxUser)
  }, [ctxUser])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUserUpdate = (updated) => {
    setUser(updated)
    setCtxUser?.(updated)
  }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'WS'

  const openAccountTab = (tabKey) => {
    setActiveTab(tabKey)
    setDropdownOpen(false)
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Profile Trigger Button */}
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 10px 5px 6px',
          background: dropdownOpen ? 'var(--blue-light, #EFF6FF)' : 'var(--surface, #FFFFFF)',
          border: `1.5px solid ${dropdownOpen ? 'var(--blue, #2563EB)' : 'var(--border, #E5E7EB)'}`,
          borderRadius: 999,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: dropdownOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
          fontFamily: '"Inter", sans-serif',
        }}
      >
        {/* Avatar badge */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--blue-light, #EFF6FF)',
            border: '1.5px solid var(--blue, #2563EB)',
            color: 'var(--blue, #2563EB)',
            fontWeight: 700,
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {user?.profileImage?.url ? (
            <img src={user.profileImage.url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>

        {/* Name and Role text */}
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', paddingRight: 2 }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
              color: 'var(--text, #111827)',
              lineHeight: '1.2',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name || 'Wholesaler Admin'}
          </span>
          <span
            style={{
              fontSize: '0.66rem',
              color: 'var(--text-muted, #6B7280)',
              lineHeight: '1.2',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {user?.businessName || 'DistroOS Partner'}
          </span>
        </div>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted, #6B7280)',
            transition: 'transform 0.2s',
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: 2,
          }}
        />
      </button>

      {/* Account System Dropdown Menu */}
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 280,
            background: '#FFFFFF',
            border: '1px solid var(--border, #E5E7EB)',
            borderRadius: 14,
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 100,
            overflow: 'hidden',
            fontFamily: '"Inter", sans-serif',
            animation: 'fadeInScale 0.18s ease-out forwards',
          }}
        >
          {/* Header Info Banner */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
              borderBottom: '1px solid var(--border, #E5E7EB)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: '#EFF6FF',
                border: '2px solid #2563EB',
                color: '#2563EB',
                fontWeight: 800,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {user?.profileImage?.url ? (
                <img src={user.profileImage.url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827', truncate: true }}>
                {user?.name || 'Wholesaler Admin'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || 'admin@distroos.com'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  {user?.role || 'Wholesaler'}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Account Management Options List */}
          <div style={{ padding: '6px 0' }}>
            <div style={{ padding: '6px 14px 4px', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase' }}>
              Account Management
            </div>

            {[
              { key: 'profile', label: 'Personal Profile', sub: 'Name, phone & photo', icon: User },
              { key: 'business', label: 'Business Details', sub: 'GSTIN, shop & address', icon: Building2 },
              { key: 'security', label: 'Security & Password', sub: 'Password & 2FA security', icon: Lock },
              { key: 'billing', label: 'Subscription & Plan', sub: 'Enterprise plan & usage', icon: CreditCard },
              { key: 'notifications', label: 'Notification Settings', sub: 'SMS, Email & WhatsApp', icon: Bell },
              { key: 'system', label: 'System & Account Info', sub: 'Metadata & user ID', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => openAccountTab(item.key)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    fontFamily: '"Inter", sans-serif',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} style={{ color: '#2563EB' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{item.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#6B7280' }}>{item.sub}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border, #E5E7EB)', padding: '6px 0' }}>
            <button
              onClick={() => {
                setDropdownOpen(false)
                logout?.()
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#DC2626',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'background 0.15s',
                fontFamily: '"Inter", sans-serif',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={16} strokeWidth={2} />
              <span>Sign Out Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Management Modal Overlay */}
      {activeTab && (
        <AccountManagementModal
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setActiveTab(null)}
          user={user}
          onUserUpdate={handleUserUpdate}
          showToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ACCOUNT MANAGEMENT MODAL COMPONENT
// ─────────────────────────────────────────────────────────────
function AccountManagementModal({ activeTab, setActiveTab, onClose, user, onUserUpdate, showToast }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: '"Inter", sans-serif',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 860,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.25s ease-out forwards',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border, #E5E7EB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--blue-light, #EFF6FF)',
                border: '1px solid var(--blue-muted, #BFDBFE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue, #2563EB)',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                Account Management Center
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, marginTop: 2 }}>
                Manage your credentials, business details, security settings, and notifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border, #E5E7EB)',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEF2F2'
              e.currentTarget.style.color = '#DC2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.color = '#6B7280'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Navigation Tabs Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 24px',
            background: '#F8FAFC',
            borderBottom: '1px solid var(--border, #E5E7EB)',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'profile', label: 'Profile Details', icon: User },
            { key: 'business', label: 'Business Info', icon: Building2 },
            { key: 'security', label: 'Security & Password', icon: Lock },
            { key: 'billing', label: 'Subscription & Plan', icon: CreditCard },
            { key: 'notifications', label: 'Notifications', icon: Bell },
            { key: 'system', label: 'System Info', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--blue, #2563EB)' : '#6B7280',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  border: isActive ? '1px solid var(--border, #E5E7EB)' : '1px solid transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Modal Body Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'profile' && <ProfileTabSection user={user} onUserUpdate={onUserUpdate} showToast={showToast} />}
          {activeTab === 'business' && <BusinessTabSection user={user} onUserUpdate={onUserUpdate} showToast={showToast} />}
          {activeTab === 'security' && <SecurityTabSection showToast={showToast} />}
          {activeTab === 'billing' && <BillingTabSection user={user} />}
          {activeTab === 'notifications' && <NotificationTabSection showToast={showToast} />}
          {activeTab === 'system' && <SystemTabSection user={user} />}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB 1: PROFILE DETAILS
// ─────────────────────────────────────────────────────────────
function ProfileTabSection({ user, onUserUpdate, showToast }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Name is required.', 'error')
      return
    }
    setSaving(true)
    try {
      const data = await saveProfile({
        name: form.name,
        phone: form.phone,
        city: form.city,
        businessName: user?.businessName || '',
      })
      onUserUpdate(data.user)
      showToast('Profile updated successfully!', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)) {
      showToast('Only JPG/PNG images are allowed.', 'error')
      return
    }
    setUploading(true)
    try {
      const data = await uploadAvatar(f)
      onUserUpdate(data.user)
      showToast('Profile picture uploaded successfully!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const initials = (user?.name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Avatar Header Widget */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '18px 20px',
          background: '#F8FAFC',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#EFF6FF',
            border: '2px solid #2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            fontSize: '1.5rem',
            fontWeight: 800,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {user?.profileImage?.url ? (
            <img src={user.profileImage.url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827' }}>Profile Photo</h3>
          <p style={{ margin: '2px 0 10px', fontSize: '0.78rem', color: '#6B7280' }}>
            Upload a high-res JPG or PNG photo (Max 2 MB)
          </p>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: '#2563EB',
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {uploading ? <Spinner size={14} color="#FFF" /> : <Camera size={14} />}
              {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
            {user?.profileImage?.url && (
              <button
                onClick={async () => {
                  try {
                    const res = await removeAvatar()
                    onUserUpdate(res.user)
                    showToast('Profile photo removed.', 'success')
                  } catch (err) {
                    showToast(err.message, 'error')
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Full Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Enter full name"
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Phone Number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>City / Location</label>
          <input
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="e.g. Surat, Gujarat"
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Email Address (Read-only)</label>
          <input
            value={user?.email || ''}
            disabled
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem', background: '#F1F5F9', color: '#64748B' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 20px',
            background: 'var(--blue, #2563EB)',
            color: '#FFF',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saving ? <Spinner size={14} color="#FFF" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB 2: BUSINESS INFO
// ─────────────────────────────────────────────────────────────
function BusinessTabSection({ user, onUserUpdate, showToast }) {
  const [form, setForm] = useState({
    businessName: user?.businessName || '',
    gstin: '24AAACD1234E1Z5',
    regType: 'Private Limited',
    address: 'Plot 42, GIDC Industrial Estate, Ring Road',
    state: 'Gujarat',
    pincode: '395002',
    supportPhone: '+91 261 2456789',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = await saveProfile({
        name: user?.name || '',
        phone: user?.phone || '',
        city: user?.city || '',
        businessName: form.businessName,
      })
      onUserUpdate(data.user)
      showToast('Business details updated successfully!', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, color: '#1E40AF', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Building2 size={18} style={{ flexShrink: 0, color: '#2563EB' }} />
        <span>Your business identity is displayed on invoices, purchase orders, and retailer credit agreements.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Registered Business Name</label>
          <input
            value={form.businessName}
            onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
            placeholder="e.g. Surat Agro Wholesale Pvt Ltd"
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>GSTIN / Tax ID</label>
          <input
            value={form.gstin}
            onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))}
            placeholder="GSTIN Number"
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem', fontFamily: 'monospace' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Entity Type</label>
          <select
            value={form.regType}
            onChange={(e) => setForm((p) => ({ ...p, regType: e.target.value }))}
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem', background: '#FFF' }}
          >
            <option value="Proprietorship">Proprietorship</option>
            <option value="Partnership Firm">Partnership Firm</option>
            <option value="Private Limited">Private Limited</option>
            <option value="LLP">Limited Liability Partnership (LLP)</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Support / Billing Hotline</label>
          <input
            value={form.supportPhone}
            onChange={(e) => setForm((p) => ({ ...p, supportPhone: e.target.value }))}
            placeholder="+91..."
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>Warehouse / Office Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="Full Address"
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>State</label>
          <input
            value={form.state}
            onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>PIN Code</label>
          <input
            value={form.pincode}
            onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
            className="input"
            style={{ width: '100%', height: 38, fontSize: '0.875rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 20px',
            background: 'var(--blue, #2563EB)',
            color: '#FFF',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saving ? <Spinner size={14} color="#FFF" /> : <Save size={14} />}
          {saving ? 'Updating...' : 'Save Business Details'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB 3: SECURITY & PASSWORD
// ─────────────────────────────────────────────────────────────
function SecurityTabSection({ showToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [twoFactor, setTwoFactor] = useState(true)

  const handlePasswordSubmit = async () => {
    if (!form.currentPassword || !form.newPassword) {
      showToast('Please enter both current and new password.', 'error')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('New password confirmation does not match.', 'error')
      return
    }
    if (form.newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error')
      return
    }
    setSaving(true)
    try {
      await apiChangePassword(form)
      showToast('Password updated successfully!', 'success')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Change Password Box */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, background: '#FFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Lock size={18} style={{ color: '#2563EB' }} />
          <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827' }}>Change Account Password</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Current Password</label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="input"
              style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min 8 characters"
              className="input"
              style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              className="input"
              style={{ width: '100%', height: 38, fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handlePasswordSubmit}
            disabled={saving}
            style={{
              padding: '7px 18px',
              background: '#2563EB',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* 2FA & Active Sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, background: '#FFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} style={{ color: '#2563EB' }} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827' }}>Two-Factor Authentication (2FA)</span>
            </div>
            <button
              onClick={() => {
                setTwoFactor(!twoFactor)
                showToast(`2FA has been ${!twoFactor ? 'enabled' : 'disabled'}.`, 'success')
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '1px solid #BFDBFE',
                cursor: 'pointer',
                background: twoFactor ? '#EFF6FF' : '#FEF2F2',
                color: twoFactor ? '#2563EB' : '#DC2626',
              }}
            >
              {twoFactor ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
            Requires an OTP via SMS or authenticator app when signing in from an unrecognized device.
          </p>
        </div>

        <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, background: '#FFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Smartphone size={18} style={{ color: '#2563EB' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827' }}>Active Sessions</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>💻 <strong>Chrome / Windows 11</strong> (Current session)</div>
            <div style={{ color: '#9CA3AF' }}>IP: 103.24.88.12 • Surat, IN</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB 4: SUBSCRIPTION & BILLING
// ─────────────────────────────────────────────────────────────
function BillingTabSection({ user }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Current Plan Card */}
      <div
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
          borderRadius: 14,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>
            CURRENT ENTERPRISE PLAN
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: '"Plus Jakarta Sans", sans-serif', marginTop: 2 }}>
            DistroOS SaaS Unlimited Partner
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: 4 }}>
            Auto-renews on Oct 31, 2026 • ₹4,999 / month billed annually
          </div>
        </div>
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 700,
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          ACTIVE PLAN
        </div>
      </div>

      {/* Plan Usage Limits Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Linked Retailers', used: '45', limit: 'Unlimited', pct: 45 },
          { label: 'Catalog SKUs', used: '120', limit: 'Unlimited', pct: 60 },
          { label: 'Monthly Orders', used: '₹12.5L', limit: '₹50L Limit', pct: 25 },
        ].map((item) => (
          <div key={item.label} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 14, background: '#FFF' }}>
            <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827', margin: '4px 0' }}>{item.used}</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{item.limit}</div>
            <div style={{ height: 4, background: '#E5E7EB', borderRadius: 999, marginTop: 8 }}>
              <div style={{ height: '100%', width: `${item.pct}%`, background: '#2563EB', borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, background: '#FFF' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827' }}>Recent Billing Invoices</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { date: 'Sep 01, 2026', inv: 'INV-2026-009', amount: '₹4,999', status: 'Paid' },
            { date: 'Aug 01, 2026', inv: 'INV-2026-008', amount: '₹4,999', status: 'Paid' },
          ].map((inv) => (
            <div key={inv.inv} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: '0.8rem' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#111827', marginRight: 10 }}>{inv.inv}</span>
                <span style={{ color: '#6B7280' }}>{inv.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>{inv.amount}</span>
                <span style={{ fontSize: '0.7rem', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB 5: NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
function NotificationTabSection({ showToast }) {
  const [settings, setSettings] = useState({
    emailOrders: true,
    emailCredit: true,
    smsOrders: false,
    whatsappAlerts: true,
    lowStockAlerts: true,
  })

  const toggle = (k) => {
    setSettings((p) => {
      const updated = { ...p, [k]: !p[k] }
      showToast('Notification preference saved!', 'success')
      return updated
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0 0 10px' }}>
        Configure how DistroOS notifies you about new retailer orders, overdue credit warnings, and stock depletion.
      </p>

      {[
        { key: 'emailOrders', title: 'New Retailer Orders (Email)', desc: 'Instant email summary when a retailer places an order.' },
        { key: 'emailCredit', title: 'Credit Overdue Alerts (Email)', desc: 'Alerts when a retailer passes their payment due date.' },
        { key: 'whatsappAlerts', title: 'WhatsApp Business Instant Alerts', desc: 'Receive high-priority order & payment notifications directly on WhatsApp.' },
        { key: 'lowStockAlerts', title: 'Smart Reorder Stock Warnings', desc: 'Get notified when catalog inventory drops below reorder threshold.' },
        { key: 'smsOrders', title: 'SMS Transaction Receipts', desc: 'Send automated SMS updates for order dispatches.' },
      ].map((item) => (
        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFF' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827' }}>{item.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>{item.desc}</div>
          </div>
          <button
            onClick={() => toggle(item.key)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 999,
              background: settings[item.key] ? '#2563EB' : '#E5E7EB',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: settings[item.key] ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#FFF',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB 6: SYSTEM & ACCOUNT INFO
// ─────────────────────────────────────────────────────────────
function SystemTabSection({ user }) {
  const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 18, background: '#FFF' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.88rem', fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#111827' }}>System Metadata & Instance Details</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'User ID', val: user?._id || '650f1234abcd5678', copy: true },
            { label: 'Account Role', val: user?.role || 'wholesaler' },
            { label: 'Account Status', val: user?.status || 'active' },
            { label: 'Created Date', val: fmt(user?.createdAt) },
            { label: 'Last Login', val: fmt(user?.lastLogin) },
            { label: 'API Region & Instance', val: 'ap-south-1 (Mumbai, India)' },
            { label: 'DistroOS Client Build', val: 'v2.4.0-production' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: '0.8rem' }}>
              <span style={{ color: '#6B7280', fontWeight: 600 }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, color: '#111827', fontFamily: item.copy ? 'monospace' : 'inherit' }}>{item.val}</span>
                {item.copy && (
                  <button
                    onClick={() => navigator.clipboard.writeText(item.val)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', padding: 2 }}
                    title="Copy ID"
                  >
                    <Copy size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
