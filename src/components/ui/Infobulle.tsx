import { useId, type ReactNode } from 'react'

interface InfobulleProps {
  texte: string
  etiquette?: string
  align?: 'gauche' | 'centre' | 'droite'
  focusable?: boolean
  className?: string
  children: ReactNode
}

export function Infobulle({ texte, etiquette, align = 'centre', focusable = true, className = '', children }: InfobulleProps) {
  const id = useId()
  const position = align === 'gauche' ? 'left-0' : align === 'droite' ? 'right-0' : 'left-1/2 -translate-x-1/2'
  return (
    <div className={`group relative ${className}`} tabIndex={focusable ? 0 : undefined}
      role={focusable && etiquette ? 'img' : undefined} aria-label={focusable ? etiquette : undefined}
      aria-describedby={focusable ? id : undefined}>
      {children}
      <span id={id} role="tooltip" className={`pointer-events-none invisible absolute bottom-full z-50 mb-2 w-max max-w-64 rounded-md bg-[#252936] px-2.5 py-1.5 text-left text-[11.5px] leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${position}`}>
        {texte}
      </span>
    </div>
  )
}
