import { useRef, useState, type KeyboardEvent } from 'react'
import { formatDate, todayInputValue } from '@/utils/date'

interface CelluleEtapeProps {
  valeur: string | null
  modifiable: boolean
  libelle: string
  /** Doit gérer ses erreurs elle-même : la cellule revient en lecture dans tous les cas. */
  onEnregistrer: (valeur: string | null) => Promise<void>
}

/** Une étape du cahier : clic, date, Entrée. Échap annule ; sortir sans rien changer n'enregistre rien. */
export function CelluleEtape({ valeur, modifiable, libelle, onEnregistrer }: CelluleEtapeProps) {
  const [saisie, setSaisie] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const annule = useRef(false)
  const proposee = valeur ?? todayInputValue()

  const valider = async () => {
    if (saisie === null || envoi) return
    const suivante = saisie === '' ? null : saisie
    if (suivante === valeur) { setSaisie(null); return }
    setEnvoi(true)
    try { await onEnregistrer(suivante) } finally { setEnvoi(false); setSaisie(null) }
  }
  const surTouche = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); void valider() }
    if (e.key === 'Escape') { annule.current = true; setSaisie(null) }
  }
  const surSortie = () => {
    if (annule.current) { annule.current = false; return }
    if (saisie === proposee) setSaisie(null)
    else void valider()
  }

  if (saisie === null) {
    return (
      <button type="button" disabled={!modifiable} onClick={() => setSaisie(proposee)}
        aria-label={`${libelle} : ${valeur ? formatDate(valeur) : 'non renseignée'}${modifiable ? ', modifier' : ''}`}
        className={`h-8 w-full min-w-[92px] rounded-md px-1.5 text-left text-[12.5px] ${valeur ? 'font-medium text-ink' : 'text-[#C4C7D0]'} ${modifiable ? 'hover:bg-accent-light hover:text-accent-dark' : 'cursor-default'}`}>
        {valeur ? formatDate(valeur) : '+'}
      </button>
    )
  }
  return <input type="date" autoFocus value={saisie} max={todayInputValue()} disabled={envoi} aria-label={libelle}
    onChange={(e) => setSaisie(e.target.value)} onKeyDown={surTouche} onBlur={surSortie}
    className="h-8 w-[136px] rounded-md border border-accent bg-white px-1 text-[12.5px] text-ink" />
}
