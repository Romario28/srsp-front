import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, required, className = '', children, ...rest }, ref) => {
    const selectId = id ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-[13px] font-medium text-ink">
          {label}{required && <span className="text-danger"> *</span>}
        </label>
        <select
          id={selectId} ref={ref}
          className={`h-10 rounded-lg border bg-white px-3 text-sm text-ink
            ${error ? 'border-danger' : 'border-[#DADCE3]'}
            focus:border-accent disabled:bg-[#F4F5F7] disabled:text-[#9CA0AC] ${className}`}
          aria-invalid={!!error}
          {...rest}
        >
          {children}
        </select>
        {error && <span className="text-[12px] text-danger">{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'
