import { Badge } from '@/components/ui/Badge'
import { formatDate, joursRestantsDepuis } from '@/utils/date'
import { libelleEcheance, toneDelai } from '@/utils/anticipation'
import type { AlerteDTO } from '@/types/alerte'

export function EcheanceAlerte({ alerte }: { alerte: AlerteDTO }) {
  if (alerte.dateEcheance == null) return <span className="text-[#9CA0AC]">—</span>
  const jours = joursRestantsDepuis(alerte.dateEcheance)
  return <div className="flex flex-col items-start gap-1">
    <span className="whitespace-nowrap text-[#4B4F5A]">{formatDate(alerte.dateEcheance)}</span>
    {alerte.statut !== 'ACQUITTEE' && jours != null && <Badge tone={toneDelai(jours)}>{libelleEcheance(jours)}</Badge>}
  </div>
}
