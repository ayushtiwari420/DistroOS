import React from 'react'
import { Inbox } from 'lucide-react'

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are no records available to display at this time.',
  action = null,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
        {React.isValidElement(Icon) ? Icon : <Icon className="w-6 h-6 stroke-[1.75]" />}
      </div>
      <h4 className="text-sm font-semibold font-display text-slate-900 mb-1">
        {title}
      </h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}

export default EmptyState
