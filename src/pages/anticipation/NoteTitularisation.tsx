import { Info } from 'lucide-react'
import { formatDate } from '@/utils/date'
import type { TypeAnticipation } from '@/types/anticipation'

interface NoteTitularisationProps {
  type: TypeAnticipation
  datePreparation: string | null | undefined
  dateEcheance: string | null | undefined
  className?: string
}

const memeJour = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10)

/**
 * Rappel de règle, propre à la titularisation : le dossier se prépare dès la date de préparation,
 * mais ne se dépose qu'à l'échéance. S'affiche sous les deux dates, sans les remplacer ni les renommer.
 * Se masque seul pour tout autre type, sans échéance, ou quand les deux dates coïncident.
 * L'espacement avec ce qui précède est à la charge du parent (gap du conteneur), pas du composant.
 */
export function NoteTitularisation({ type, datePreparation, dateEcheance, className = '' }: NoteTitularisationProps) {
  if (type !== 'TITULARISATION' || !dateEcheance) return null
  if (datePreparation && memeJour(datePreparation, dateEcheance)) return null

  const date = 'font-medium text-[#4B4F5A]'
  return (
    <div
      role="note"
      // Bordure fine + fond clair : la note reste repérable sans fond trop marqué.
      className={`flex items-start gap-2 rounded-lg border border-[#EAEBF0] bg-[#FAFAFB] px-3 py-2 text-[12px] leading-snug text-[#6B7180] ${className}`}
    >
      {/* Aligné sur la première ligne du texte (mt-0.5), même si la note passe sur plusieurs lignes */}
      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <p>
        {datePreparation
          ? <>Le dossier peut être préparé dès le <span className={date}>{formatDate(datePreparation)}</span>, </>
          : <>Le dossier peut être préparé en amont, </>}
        mais le dépôt n&apos;est possible qu&apos;à partir du <span className={date}>{formatDate(dateEcheance)}</span>.
      </p>
    </div>
  )
}
