import { Badge } from '@/components/ui/Badge'
import { useDossierApercu } from '@/hooks/useDossierApercu'
import { ETAT_DOSSIER } from '@/utils/dossiers'
import type { EtatDossier, TypeAnticipation } from '@/types/anticipation'

interface DossierBadgeProps {
  etat: EtatDossier | null | undefined
  matricule: string
  type: TypeAnticipation
  dateEcheance: string | null
}

/** État du dossier lié à une ligne d'agent ; cliquable pour l’aperçu. */
export function DossierBadge({ etat, matricule, type, dateEcheance }: DossierBadgeProps) {
  const { ouvrir, etatAffiche } = useDossierApercu()
  if (!etat || !dateEcheance) return <span className="text-[#9CA0AC]" title="Aucun dossier pour cette échéance">—</span>
  const cible = { matricule, type, dateEcheance: dateEcheance.slice(0, 10) }
  const affiche = ETAT_DOSSIER[etatAffiche(cible, etat)]
  return (
    <button type="button" title="Voir le dossier" aria-label={`Dossier : ${affiche.label}. Ouvrir l’aperçu`}
      onClick={(e) => { e.stopPropagation(); ouvrir(cible, etat) }}
      className="rounded-full transition-shadow hover:ring-2 hover:ring-accent/40">
      <Badge tone={affiche.tone}>{affiche.label}</Badge>
    </button>
  )
}
