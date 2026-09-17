import React from 'react'

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  helperText = '',
  error = '',
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  icon: Icon = null,
  options = null, // Array of { value, label } for select mode
  rows = 3,
  ...props
}) {
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 7)}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--blue)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        )}

        {type === 'select' ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`select ${error ? 'input-error' : ''} ${className}`}
            style={{ paddingLeft: Icon ? 36 : 12 }}
            {...props}
          >
            {options &&
              options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`textarea ${error ? 'input-error' : ''} ${className}`}
            style={{ paddingLeft: Icon ? 36 : 12 }}
            {...props}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`input ${error ? 'input-error' : ''} ${className}`}
            style={{ paddingLeft: Icon ? 36 : 12 }}
            {...props}
          />
        )}
      </div>

      {error ? (
        <p className="form-error-msg">{error}</p>
      ) : helperText ? (
        <p className="form-helper">{helperText}</p>
      ) : null}
    </div>
  )
}
