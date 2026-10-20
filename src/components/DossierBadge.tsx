import { Badge } from '@/components/ui/Badge'
import { ETAT_DOSSIER } from '@/utils/dossiers'
import type { EtatDossier } from '@/types/anticipation'

/** État du dossier lié à une ligne d'agent ; « — » quand aucun dossier ne correspond. */
export function DossierBadge({ etat }: { etat: EtatDossier | null | undefined }) {
  if (!etat) return <span className="text-[#9CA0AC]" title="Aucun dossier pour cette échéance">—</span>
  const config = ETAT_DOSSIER[etat]
  return config ? <Badge tone={config.tone}>{config.label}</Badge> : <Badge>{etat}</Badge>
}
