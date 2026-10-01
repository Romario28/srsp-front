interface SegmentedOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value} type="button" aria-pressed={active} onClick={() => onChange(option.value)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors ${active ? 'border-accent bg-accent-light text-accent-dark' : 'border-[#DADCE3] bg-white text-[#6B7180] hover:border-accent'}`}
          >
            {option.label}
            {option.count != null && <span className={`rounded-full px-1.5 text-[11px] ${active ? 'bg-white/70 text-accent-dark' : 'bg-[#EAEBF0] text-[#4B4F5A]'}`}>{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
