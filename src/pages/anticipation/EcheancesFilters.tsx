import { Calculator, Info, RotateCcw, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { formatMois, MAX_MOIS } from '@/utils/anticipation'
import { datesActives, type EtatFiltres } from './filtres'
import type { ConfigurationDelaiDTO } from '@/types/configurationDelai'
import type { CritereDate } from '@/types/anticipation'

const CRITERES: { value: CritereDate; label: string }[] = [
  { value: 'PREPARATION', label: 'Date de préparation' },
  { value: 'ECHEANCE', label: "Date d'échéance" },
]

interface EcheancesFiltersProps {
  etat: EtatFiltres
  onChange: (patch: Partial<EtatFiltres>) => void
  config: ConfigurationDelaiDTO | null
  erreur: string | null
  isLoading: boolean
  onCalculer: () => void
  onAnnuler: () => void
}

export function EcheancesFilters({ etat, onChange, config, erreur, isLoading, onCalculer, onAnnuler }: EcheancesFiltersProps) {
  const dates = datesActives(etat)
  const nomDate = etat.critere === 'PREPARATION' ? 'Préparation' : 'Échéance'
  return (
    <form onSubmit={(event) => { event.preventDefault(); onCalculer() }} className="flex flex-col gap-4 rounded-xl border border-[#E4E6EB] bg-white p-5">
      <div className="grid gap-6 md:grid-cols-2">
        <fieldset disabled={dates} className="min-w-0 disabled:opacity-50">
          <legend className="mb-2 text-[13px] font-semibold text-ink">Fenêtre relative</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Préparation (mois avant l'échéance)" type="number" min={0} max={MAX_MOIS} step={1} inputMode="numeric" value={etat.prevenance} onChange={(e) => onChange({ prevenance: e.target.value })} placeholder={config ? String(config.prevenanceMois) : 'valeur configurée'} hint={config ? `Configuré : ${formatMois(config.prevenanceMois)}` : undefined} />
            <Input label="Retard (mois après)" type="number" min={0} max={MAX_MOIS} step={1} inputMode="numeric" value={etat.retard} onChange={(e) => onChange({ retard: e.target.value })} placeholder={config ? String(config.retardMois) : 'valeur configurée'} hint={config ? `Configuré : ${formatMois(config.retardMois)} · 0 = aucun retard` : '0 = aucun retard'} />
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" icon={<RotateCcw className="h-3.5 w-3.5" />} disabled={!config} onClick={() => config && onChange({ prevenance: String(config.prevenanceMois), retard: String(config.retardMois) })}>Valeurs configurées</Button>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-[13px] font-semibold text-ink">Intervalle de dates (prioritaire)</legend>
          <div role="radiogroup" aria-label="Date sur laquelle porte l'intervalle" className="mb-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {CRITERES.map((c) => <label key={c.value} className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
              <input type="radio" name="critere-date" value={c.value} checked={etat.critere === c.value} onChange={() => onChange({ critere: c.value })} className="h-4 w-4 accent-accent" />{c.label}
            </label>)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={`${nomDate} à partir du`} type="date" value={etat.dateDebut} onChange={(e) => onChange({ dateDebut: e.target.value })} />
            <Input label={`${nomDate} jusqu'au`} type="date" min={etat.dateDebut || undefined} value={etat.dateFin} onChange={(e) => onChange({ dateFin: e.target.value })} hint="Une seule des deux dates suffit." />
          </div>
          {dates && <Button type="button" variant="ghost" size="sm" className="mt-2" icon={<X className="h-3.5 w-3.5" />} onClick={() => onChange({ dateDebut: '', dateFin: '' })}>Effacer les dates</Button>}
        </fieldset>
      </div>
      {dates && <div className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark"><Info className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>Les dates remplacent la fenêtre de visibilité : la tolérance de retard configurée est ignorée et aucune limite n'est appliquée.{etat.critere === 'PREPARATION' && ' La date de préparation reste calculée avec le délai de préparation configuré pour ce type.'}</span></div>}
      {erreur && <ErrorBanner message={erreur} />}
      <div className="flex justify-end gap-2">
        {isLoading && <Button type="button" variant="secondary" onClick={onAnnuler}>Annuler</Button>}
        <Button type="submit" isLoading={isLoading} icon={<Calculator className="h-4 w-4" />}>Calculer</Button>
      </div>
    </form>
  )
}
