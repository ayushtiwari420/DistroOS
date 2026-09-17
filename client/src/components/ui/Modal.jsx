import React, { useEffect } from 'react'
import { X } from 'lucide-react'

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
}

export function Modal({ isOpen, onClose, size = 'md', children, className = '' }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={`relative w-full ${sizes[size] || sizes.md} bg-white rounded-xl shadow-xl border border-slate-200 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ children, onClose, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
      <div className="flex flex-col gap-0.5">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export function ModalTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold font-display text-slate-900 ${className}`}>
      {children}
    </h3>
  )
}

export function ModalBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 overflow-y-auto max-h-[calc(90vh-140px)] text-xs text-slate-700 ${className}`}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}

export default Modal
