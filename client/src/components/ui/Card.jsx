import React from 'react'

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-xs transition-shadow duration-150 hover:shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-slate-100 flex flex-col gap-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-base font-semibold text-slate-900 tracking-tight font-display ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p
      className={`text-xs text-slate-500 leading-normal ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
