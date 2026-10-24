import { Play } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate, joursRestantsDepuis } from '@/utils/date'
import { TYPE_LABELS, libelleEcheance } from '@/utils/anticipation'
import { ETAT_DOSSIER, etatDe } from '@/utils/dossiers'
import type { DossierDTO } from '@/types/dossier'

interface LigneDossierProps {
  d: DossierDTO
  afficherNombre: boolean
  separateur?: boolean   // filet plus marqué au-dessus : première ligne d'un agent (sauf le premier)
  onDemarrer: () => void
  onOuvrir: () => void
}

export function NombreDossiers({ n }: { n: number }) {
  return (
    <span title={`${n} dossier${n > 1 ? 's' : ''} au total pour cet agent, tous états confondus`}
      className="inline-flex flex-shrink-0 items-center rounded-full bg-[#EAEBF0] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[#4B4F5A]">
      {n} dossier{n > 1 ? 's' : ''}
    </span>
  )
}

function Precision({ d }: { d: DossierDTO }) {
  if (d.enRetard) {
    const j = d.joursRetard ?? 0
    return <p className="mt-1 text-[12px] font-medium text-danger">{j} jour{j > 1 ? 's' : ''} de retard</p>
  }
  if (d.statut === 'EN_COURS' && d.dateDemarrage) {
    return <p className="mt-1 text-[12px] text-[#6B7180]">Depuis le {formatDate(d.dateDemarrage)}</p>
  }
  if (d.statut === 'SANS_SUITE' && d.motifSansSuite) {
    return <p title={d.motifSansSuite} className="mt-1 max-w-[220px] truncate text-[12px] text-[#6B7180]">{d.motifSansSuite}</p>
  }
  return null
}

export function LigneDossier({ d, afficherNombre, separateur = false, onDemarrer, onOuvrir }: LigneDossierProps) {
  const affiche = ETAT_DOSSIER[etatDe(d)]
  const demarrable = d.statut === 'EN_ATTENTE_DE_TRAITEMENT'
  return (
    <tr className={`${d.enRetard ? 'bg-[#FDF4F4]' : 'bg-white'} hover:bg-[#F7F8FA] ${separateur ? 'border-t-2 border-t-[#D5D8E0]' : ''}`}>
      <td className={`table-cell border-l-4 ${d.enRetard ? 'border-l-danger' : 'border-l-transparent'}`}>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onOuvrir} title="Ouvrir le détail du dossier"
            className="block min-w-0 max-w-[260px] truncate text-left text-[13px] font-medium text-ink hover:underline">{d.nomComplet}</button>
          {afficherNombre && d.nbDossiersAgent > 1 && <NombreDossiers n={d.nbDossiersAgent} />}
        </div>
        <p className="font-mono text-[11.5px] text-[#6B7180]">{d.matricule}</p>
      </td>
      <td className="table-cell whitespace-nowrap"><Badge>{TYPE_LABELS[d.type]}</Badge></td>
      <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(d.datePreparation)}</td>
      <td className="table-cell whitespace-nowrap">
        <span className={d.enRetard ? 'font-semibold text-danger' : 'text-[#4B4F5A]'}>{formatDate(d.dateEcheance)}</span>
        {demarrable && !d.enRetard && (
          <p className="mt-1 text-[12px] text-[#9CA0AC]">{libelleEcheance(joursRestantsDepuis(d.dateEcheance))}</p>
        )}
      </td>
      <td className="table-cell">
        <Badge tone={affiche.tone}>{affiche.label}</Badge>
        <Precision d={d} />
      </td>
      <td className="table-cell">
        <div className="flex items-center justify-end gap-1.5">
          {demarrable && (
            <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} onClick={onDemarrer}
              aria-label={`Démarrer le dossier de ${d.nomComplet}`}>Démarrer</Button>
          )}
          <Button size="sm" variant="ghost" onClick={onOuvrir}>Détails</Button>
        </div>
      </td>
    </tr>
  )
}
