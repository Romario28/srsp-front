import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, required, className = '', ...rest }, ref) => {
    const inputId = id ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[13px] font-medium text-ink">
          {label}{required && <span className="text-danger"> *</span>}
        </label>
        <input
          id={inputId} ref={ref}
          className={`h-10 rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-[#9CA0AC]
            ${error ? 'border-danger' : 'border-[#DADCE3]'}
            focus:border-accent disabled:bg-[#F4F5F7] disabled:text-[#9CA0AC] ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {hint && !error && <span className="text-[12px] text-[#6B7180]">{hint}</span>}
        {error && <span id={`${inputId}-error`} className="text-[12px] text-danger">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
