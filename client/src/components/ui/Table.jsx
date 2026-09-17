import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Table({ className = '', children, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className={`w-full text-left border-collapse text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ className = '', children, ...props }) {
  return (
    <thead className={`bg-[#F8FAFC] border-b border-slate-200 ${className}`} {...props}>
      {children}
    </thead>
  )
}

export function TableHead({ className = '', children, ...props }) {
  return (
    <th
      className={`px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase select-none ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableBody({ className = '', children, ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className = '', children, ...props }) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50/80 ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableCell({ className = '', children, ...props }) {
  return (
    <td className={`px-4 py-3.5 text-slate-700 align-middle ${className}`} {...props}>
      {children}
    </td>
  )
}

export function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = ''
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={`px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 ${className}`}>
      <div>
        Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 text-slate-600 font-medium">
          {currentPage} / {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default Table
