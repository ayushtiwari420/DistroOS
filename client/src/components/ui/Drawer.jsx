import React, { useEffect } from 'react'
import { X } from 'lucide-react'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Drawer({ isOpen, onClose, size = 'md', children, className = '' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-10">
        <div
          className={`w-screen ${sizes[size] || sizes.md} bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250 ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function DrawerHeader({ children, onClose, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex flex-col gap-0.5">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export function DrawerTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold font-display text-slate-900 ${className}`}>
      {children}
    </h3>
  )
}

export function DrawerBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 flex-1 overflow-y-auto text-xs text-slate-700 ${className}`}>
      {children}
    </div>
  )
}

export function DrawerFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}

export default Drawer
