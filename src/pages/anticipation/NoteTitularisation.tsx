import { BoutonInfo } from '@/components/ui/BoutonInfo'
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
 * mais ne se dépose qu'à l'échéance. Se masque seul pour tout autre type, sans échéance, ou quand les deux dates coïncident.
 * La note est dans un « i » ; seule une ligne courte reste visible.
 */
export function NoteTitularisation({ type, datePreparation, dateEcheance, className = '' }: NoteTitularisationProps) {
  if (type !== 'TITULARISATION' || !dateEcheance) return null
  if (datePreparation && memeJour(datePreparation, dateEcheance)) return null

  const date = 'font-medium text-[#4B4F5A]'
  return (
    <div role="note" className={`flex items-center gap-1.5 text-[12px] text-[#6B7180] ${className}`}>
      <span>Titularisation : préparation et dépôt</span>
      <BoutonInfo etiquette="Aide : titularisation, préparation et dépôt" largeur={360}>
        <p>
          {datePreparation
            ? <>Le dossier peut être préparé dès le <span className={date}>{formatDate(datePreparation)}</span>, </>
            : <>Le dossier peut être préparé en amont, </>}
          mais le dépôt n&apos;est possible qu&apos;à partir du <span className={date}>{formatDate(dateEcheance)}</span>.
        </p>
      </BoutonInfo>
    </div>
  )
}
