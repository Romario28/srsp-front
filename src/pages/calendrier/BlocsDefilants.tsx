import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface BlocDefilant {
  cle: string
  titre: string
  contenu: ReactNode
}

interface BlocsDefilantsProps {
  blocs: readonly BlocDefilant[]
  ariaLabel: string
}

/**
 * Blocs côte à côte, un seul visible à la fois ; on passe de l'un à l'autre avec les flèches, au doigt,
 * au pavé tactile ou au clavier. Chaque bloc défile verticalement dans sa propre zone (dès 1024 px de large).
 * Le premier bloc est affiché à l'ouverture.
 */
export function BlocsDefilants({ blocs, ariaLabel }: BlocsDefilantsProps) {
  const zone = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  const dernier = blocs.length - 1

  // Le bloc affiché se déduit de la position de défilement : flèches, doigt et clavier donnent le même résultat
  const lireIndex = useCallback(() => {
    const el = zone.current
    if (!el || el.clientWidth === 0) return
    const i = Math.min(dernier, Math.max(0, Math.round(el.scrollLeft / el.clientWidth)))
    indexRef.current = i
    setIndex(i)
  }, [dernier])

  const aller = (cible: number) => {
    const el = zone.current
    if (!el) return
    const i = Math.min(dernier, Math.max(0, cible))
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: i * el.clientWidth, behavior: reduit ? 'auto' : 'smooth' })
  }

  // Une largeur qui change (fenêtre redimensionnée) ne doit pas laisser la zone entre deux blocs
  useEffect(() => {
    const el = zone.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observateur = new ResizeObserver(() => el.scrollTo({ left: indexRef.current * el.clientWidth }))
    observateur.observe(el)
    return () => observateur.disconnect()
  }, [])

  const actuel = blocs[index] ?? blocs[0]
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Navigation : précédent, titre du bloc affiché avec ses repères, suivant */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2">
        <Button variant="secondary" size="sm" disabled={index === 0} onClick={() => aller(index - 1)}
          aria-label={index > 0 ? `Bloc précédent : ${blocs[index - 1].titre}` : 'Bloc précédent'}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[12.5px] font-semibold text-ink">{actuel.titre}</span>
          <span aria-hidden="true" className="flex items-center gap-1">
            {blocs.map((b, i) => (
              <span key={b.cle} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-accent' : 'bg-[#DADCE3]'}`} />
            ))}
          </span>
          <span role="status" aria-live="polite" className="sr-only">Bloc {index + 1} sur {blocs.length} : {actuel.titre}</span>
        </div>
        <Button variant="secondary" size="sm" disabled={index === dernier} onClick={() => aller(index + 1)}
          aria-label={index < dernier ? `Bloc suivant : ${blocs[index + 1].titre}` : 'Bloc suivant'}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Zone horizontale : barre masquée (les flèches la remplacent), arrêt net sur chaque bloc */}
      <div ref={zone} onScroll={lireIndex} tabIndex={0} role="region" aria-label={ariaLabel}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {blocs.map((b) => (
          // Chaque bloc fait la largeur de la zone et défile verticalement seul (dès 1024 px)
          <div key={b.cle} role="group" aria-label={b.titre}
            className="flex w-full min-w-0 flex-shrink-0 snap-start flex-col gap-2 lg:overflow-y-auto">
            {b.contenu}
          </div>
        ))}
      </div>
    </div>
  )
}
