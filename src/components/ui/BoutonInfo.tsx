import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { Info } from 'lucide-react'

const MARGE = 8          // distance minimale au bord de l'écran
const ECART = 6          // distance entre l'icône et le panneau
const HAUTEUR_MIN = 96   // en dessous, le panneau garde cette hauteur et défile

/** Place le panneau sous l'icône (ou au-dessus s'il y a plus de place), sans jamais dépasser de l'écran. */
function placer(bouton: HTMLElement, panneau: HTMLElement, largeurMax: number) {
  const r = bouton.getBoundingClientRect()
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const largeur = Math.min(largeurMax, vw - 2 * MARGE)
  panneau.style.width = `${largeur}px`
  panneau.style.left = `${Math.max(MARGE, Math.min(r.left, vw - largeur - MARGE))}px`
  const hauteur = panneau.scrollHeight + 2   // hauteur naturelle (+ 2 px de bordure), indépendante du max-height posé
  const espaceBas = vh - r.bottom - ECART - MARGE
  const espaceHaut = r.top - ECART - MARGE
  const dessous = espaceBas >= hauteur || espaceBas >= espaceHaut
  const dispo = Math.max(dessous ? espaceBas : espaceHaut, HAUTEUR_MIN)
  panneau.style.maxHeight = `${dispo}px`
  const finale = Math.min(hauteur, dispo)
  const top = dessous ? r.bottom + ECART : r.top - ECART - finale
  panneau.style.top = `${Math.max(MARGE, Math.min(top, vh - finale - MARGE))}px`
}

interface BoutonInfoProps {
  /** Nom accessible de l'icône, ex. « Aide : imports de référentiels ». */
  etiquette: string
  /** Largeur maximale du panneau en px (réduite si l'écran est plus étroit). */
  largeur?: number
  /** Classes du conteneur (ex. « ml-auto »). */
  className?: string
  children: ReactNode
}

/**
 * Petite icône « i » : un panneau d'aide flottant, fermé par défaut.
 * Se ferme par un nouveau clic sur l'icône, la touche Échap, un clic à l'extérieur ou la sortie du focus.
 */
export function BoutonInfo({ etiquette, largeur = 420, className = '', children }: BoutonInfoProps) {
  const [ouvert, setOuvert] = useState(false)
  const racine = useRef<HTMLDivElement>(null)
  const bouton = useRef<HTMLButtonElement>(null)
  const panneau = useRef<HTMLDivElement>(null)
  const idPanneau = useId()

  // Positionnement avant l'affichage, puis à chaque redimensionnement ou défilement (hors défilement du panneau lui-même)
  useLayoutEffect(() => {
    if (!ouvert) return
    const replacer = () => { if (bouton.current && panneau.current) placer(bouton.current, panneau.current, largeur) }
    const surDefilement = (e: Event) => { if (!(e.target instanceof Node && panneau.current?.contains(e.target))) replacer() }
    replacer()
    window.addEventListener('resize', replacer)
    window.addEventListener('scroll', surDefilement, true)
    return () => {
      window.removeEventListener('resize', replacer)
      window.removeEventListener('scroll', surDefilement, true)
    }
  }, [ouvert, largeur])

  useEffect(() => {
    if (!ouvert) return
    const surClic = (e: PointerEvent) => { if (!racine.current?.contains(e.target as Node)) setOuvert(false) }
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()   // dans une fenêtre modale, Échap ne ferme que ce panneau (la fenêtre écoute en phase de remontée)
      setOuvert(false)
      bouton.current?.focus()
    }
    document.addEventListener('pointerdown', surClic)
    document.addEventListener('keydown', surTouche, true)
    return () => {
      document.removeEventListener('pointerdown', surClic)
      document.removeEventListener('keydown', surTouche, true)
    }
  }, [ouvert])

  return (
    <div ref={racine} className={`relative inline-flex ${className}`}
      onBlur={(e: FocusEvent<HTMLDivElement>) => {
        const vers = e.relatedTarget as Node | null
        if (vers && !racine.current?.contains(vers)) setOuvert(false)   // Tab vers un autre élément
      }}>
      <button ref={bouton} type="button" aria-expanded={ouvert} aria-controls={ouvert ? idPanneau : undefined}
        aria-label={etiquette} title={ouvert ? undefined : etiquette} onClick={() => setOuvert((o) => !o)}
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
          ouvert ? 'bg-accent-light text-accent-dark' : 'text-[#9CA0AC] hover:bg-[#F0F1F4] hover:text-accent-dark'}`}>
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      {ouvert && (
        <div ref={panneau} id={idPanneau} role="region" aria-label={etiquette}
          className="fixed z-[60] flex flex-col gap-1.5 overflow-y-auto rounded-lg border border-[#E4E6EB] bg-white p-3 text-left text-[12.5px] font-normal normal-case leading-snug tracking-normal text-[#4B4F5A] shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

interface TexteInfobulleProps {
  texte: string
  /** Côté d'ancrage de l'info-bulle ; « droite » pour un élément proche du bord droit. */
  align?: 'gauche' | 'droite'
  children: ReactNode
}

/** Info-bulle au survol ou au focus clavier, pour un texte très court. Écrite en <span> : utilisable dans un paragraphe. */
export function TexteInfobulle({ texte, align = 'gauche', children }: TexteInfobulleProps) {
  const id = useId()
  return (
    <span className="group relative inline-block cursor-help" tabIndex={0} aria-describedby={id}>
      <span className="underline decoration-[#9CA0AC] decoration-dotted underline-offset-2">{children}</span>
      <span id={id} role="tooltip"
        className={`pointer-events-none invisible absolute bottom-full z-50 mb-2 w-max max-w-64 rounded-md bg-[#252936] px-2.5 py-1.5 text-left text-[11.5px] font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${align === 'droite' ? 'right-0' : 'left-0'}`}>
        {texte}
      </span>
    </span>
  )
}
