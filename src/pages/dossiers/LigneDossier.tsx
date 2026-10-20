import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/date'
import { TYPE_LABELS } from '@/utils/anticipation'
import { ETAPES, STATUT_DOSSIER } from '@/utils/dossiers'
import { CelluleEtape } from './CelluleEtape'
import type { DossierDTO, EtapeDossier } from '@/types/dossier'

interface LigneDossierProps {
  d: DossierDTO
  selectionne: boolean
  onToggle: () => void
  onOuvrir: () => void
  onEtape: (etape: EtapeDossier, valeur: string | null) => Promise<void>
}

export function LigneDossier({ d, selectionne, onToggle, onOuvrir, onEtape }: LigneDossierProps) {
  const sansSuite = d.statut === 'SANS_SUITE'
  const statut = STATUT_DOSSIER[d.statut]
  return (
    <tr className={`${d.enRetard ? 'bg-[#FDF4F4]' : 'bg-white'} hover:bg-[#F7F8FA]`}>
      <td className={`sticky left-0 z-[1] min-w-[250px] border-l-4 bg-inherit px-4 py-2.5 ${d.enRetard ? 'border-l-danger' : 'border-l-transparent'}`}>
        <div className="flex items-start gap-2.5">
          <input type="checkbox" checked={selectionne} disabled={sansSuite} onChange={onToggle}
            aria-label={`Sélectionner ${d.nomComplet}`} className="mt-1 h-4 w-4 flex-shrink-0 accent-accent" />
          <div className="min-w-0">
            <button type="button" onClick={onOuvrir} className="block max-w-[210px] truncate text-left text-[13px] font-medium text-ink hover:underline">{d.nomComplet}</button>
            <p className="font-mono text-[11.5px] text-[#6B7180]">{d.matricule}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {d.enRetard && <span title={`Échéance dépassée depuis le ${formatDate(d.dateEcheance)}`}><Badge tone="danger">En retard de {d.joursRetard} j</Badge></span>}
              {d.aRelancer && <Badge tone="warning">À relancer · {d.joursSansNouvelle} j sans nouvelle</Badge>}
            </div>
          </div>
        </div>
      </td>
      <td className="table-cell whitespace-nowrap"><Badge>{TYPE_LABELS[d.type]}</Badge></td>
      <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(d.datePreparation)}</td>
      <td className={`table-cell whitespace-nowrap ${d.enRetard ? 'font-semibold text-danger' : 'text-[#4B4F5A]'}`}>{formatDate(d.dateEcheance)}</td>
      {ETAPES.map((etape) => <td key={etape.cle} className="px-1 py-1.5">
        <CelluleEtape valeur={d.etapes[etape.cle]} datePreparation={d.datePreparation} libelle={`${etape.label}, ${d.nomComplet}`} modifiable={!sansSuite}
          onEnregistrer={(valeur) => onEtape(etape.cle, valeur)} />
      </td>)}
      <td className="table-cell whitespace-nowrap"><span title={d.motifSansSuite ?? undefined}><Badge tone={statut.tone}>{statut.label}</Badge></span></td>
    </tr>
  )
}
