import { Search, X } from 'lucide-react'

interface ChampRechercheProps {
  valeur: string
  onChange: (valeur: string) => void
  ariaLabel: string
  placeholder?: string
  className?: string
}

export function ChampRecherche({ valeur, onChange, ariaLabel, placeholder = 'Rechercher…', className = '' }: ChampRechercheProps) {
  return (
    <div role="search" className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA0AC]" aria-hidden="true" />
      <input type="text" value={valeur} autoComplete="off" placeholder={placeholder} aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && valeur !== '') onChange('') }}
        className="h-9 w-full rounded-lg border border-[#DADCE3] bg-white pl-9 pr-8 text-[13px] text-ink placeholder:text-[#9CA0AC] focus:border-accent" />
      {valeur !== '' && (
        <button type="button" onClick={() => onChange('')} aria-label="Effacer la recherche"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9CA0AC] hover:text-ink">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
