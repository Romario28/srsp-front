import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './Button'

interface MenuDeroulantProps {
  libelle: ReactNode
  icon?: ReactNode
  disabled?: boolean
  title?: string
  largeur?: string
  children: (fermer: () => void) => ReactNode
}

/** Menu accessible qui se ferme au clic extérieur, à Échap ou au départ du focus clavier. */
export function MenuDeroulant({ libelle, icon, disabled = false, title, largeur = 'w-72', children }: MenuDeroulantProps) {
  const [ouvert, setOuvert] = useState(false)
  const racine = useRef<HTMLDivElement>(null)
  const idPanneau = useId()
  const visible = ouvert && !disabled

  useEffect(() => { if (disabled) setOuvert(false) }, [disabled])

  useEffect(() => {
    if (!visible) return
    const surClic = (e: PointerEvent) => {
      if (!racine.current?.contains(e.target as Node)) setOuvert(false)
    }
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOuvert(false)
      racine.current?.querySelector('button')?.focus()
    }
    document.addEventListener('pointerdown', surClic)
    document.addEventListener('keydown', surTouche)
    return () => {
      document.removeEventListener('pointerdown', surClic)
      document.removeEventListener('keydown', surTouche)
    }
  }, [visible])

  return (
    <div ref={racine} className="relative" onBlur={(e) => {
      const vers = e.relatedTarget as Node | null
      if (vers && !racine.current?.contains(vers)) setOuvert(false)
    }}>
      <span className="inline-flex" title={title}>
        <Button variant="secondary" size="sm" icon={icon} disabled={disabled}
          aria-haspopup="true" aria-expanded={visible} aria-controls={visible ? idPanneau : undefined}
          onClick={() => setOuvert((o) => !o)}>
          {libelle}<ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${visible ? 'rotate-180' : ''}`} />
        </Button>
      </span>
      {visible && <div id={idPanneau} className={`absolute left-0 top-full z-30 mt-1.5 rounded-xl border border-[#E4E6EB] bg-white shadow-lg ${largeur}`}>
        {children(() => setOuvert(false))}
      </div>}
    </div>
  )
}
