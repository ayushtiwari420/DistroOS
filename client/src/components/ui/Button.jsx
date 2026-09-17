import React from 'react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...props
}) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }

  const vClass = variantClasses[variant] || 'btn-primary'
  const sClass = sizeClasses[size] || 'btn-md'

  const renderIcon = () => {
    if (loading) {
      return (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      )
    }
    if (!icon) return null
    if (React.isValidElement(icon)) {
      return icon
    }
    const IconComp = icon
    return <IconComp size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={2} />
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn ${vClass} ${sClass} ${className}`}
      style={{
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
      {...props}
    >
      {renderIcon()}
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </button>
  )
}
