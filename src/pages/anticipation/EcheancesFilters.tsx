import type { ReactNode } from 'react'
import { AlertTriangle, Info, Loader2, RotateCcw, X } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { formatMois, MAX_MOIS } from '@/utils/anticipation'
import { datesActives, type EtatFiltres } from './filtres'
import type { ConfigurationDelaiDTO } from '@/types/configurationDelai'
import type { CritereDate } from '@/types/anticipation'

const CRITERES: { value: CritereDate; label: string }[] = [
  { value: 'PREPARATION', label: 'Date de préparation' },
  { value: 'ECHEANCE', label: "Date d'échéance" },
]

const EXPLICATIONS: Record<CritereDate, string> = {
  PREPARATION: "La fenêtre et les dates portent sur la date de préparation (échéance − délai de préparation du type).",
  ECHEANCE: "La fenêtre et les dates portent sur la date d'échéance de chaque agent.",
}
const CHAMP = 'h-8 rounded-lg border border-[#DADCE3] bg-white px-2 text-[13px] text-ink placeholder:text-[#9CA0AC] focus:border-accent disabled:bg-[#F4F5F7] disabled:text-[#9CA0AC]'
const BOUTON_ICONE = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#6B7180] transition-colors hover:bg-[#F0F1F4] hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'
const TITRE = 'text-[12.5px] font-semibold text-ink'

/** Libellé à gauche du champ, unité à droite ; le <label> englobe le champ (clic sur le texte = focus). */
function Champ({ label, titre, suffixe, children }: { label: string; titre?: string; suffixe?: string; children: ReactNode }) {
  return (
    <label title={titre} className="flex items-center gap-1.5 text-[12px] text-[#6B7180]">
      <span>{label}</span>{children}{suffixe && <span>{suffixe}</span>}
    </label>
  )
}

interface EcheancesFiltersProps {
  etat: EtatFiltres
  onChange: (patch: Partial<EtatFiltres>) => void
  config: ConfigurationDelaiDTO | null
  erreur: string | null
  occupe: boolean
}

export function EcheancesFilters({ etat, onChange, config, erreur, occupe }: EcheancesFiltersProps) {
  const dates = datesActives(etat)
  const surPreparation = etat.critere === 'PREPARATION'
  const nomDate = surPreparation ? 'Préparation' : 'Échéance'
  const titrePrevenance = (surPreparation ? 'Mois avant la date de préparation' : "Préparation : mois avant l'échéance")
    + (config ? ` · configuré : ${formatMois(config.prevenanceMois)}` : '')
  const titreRetard = (surPreparation ? 'Mois après la date de préparation' : "Retard : mois après l'échéance")
    + (config ? ` · configuré : ${formatMois(config.retardMois)}` : '') + ' · 0 = aucun retard'
  const titreReinit = config
    ? `Remettre les valeurs configurées (${config.prevenanceMois} / ${config.retardMois} mois)` : 'Valeurs configurées indisponibles'
  return (
    <section aria-label="Filtres du calcul" className="flex flex-col gap-2 rounded-xl border border-[#E4E6EB] bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2">
          <span className={TITRE}>Calculer à partir de</span>
          <SegmentedControl
            options={CRITERES} value={etat.critere} onChange={(critere) => onChange({ critere })}
            ariaLabel="Date sur laquelle portent la fenêtre relative et l'intervalle de dates"
          />
        </div>
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-[#6B7180]">{EXPLICATIONS[etat.critere]}</p>
        <Loader2 aria-hidden="true" className={`h-4 w-4 flex-shrink-0 animate-spin text-accent ${occupe ? '' : 'invisible'}`} />
        <span role="status" aria-live="polite" className="sr-only">{occupe ? 'Mise à jour des résultats en cours' : ''}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#EAEBF0] pt-2">
        <fieldset disabled={dates} aria-label="Fenêtre relative" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 disabled:opacity-50">
          <span className={TITRE}>Fenêtre</span>
          <Champ label={surPreparation ? 'Avant' : 'Préparation'} suffixe="mois" titre={titrePrevenance}>
            <input type="number" min={0} max={MAX_MOIS} step={1} inputMode="numeric" value={etat.prevenance}
              onChange={(e) => onChange({ prevenance: e.target.value })} aria-label={titrePrevenance}
              placeholder={config ? String(config.prevenanceMois) : '—'} className={`${CHAMP} w-16`} />
          </Champ>
          <Champ label={surPreparation ? 'Après' : 'Retard'} suffixe="mois" titre={titreRetard}>
            <input type="number" min={0} max={MAX_MOIS} step={1} inputMode="numeric" value={etat.retard}
              onChange={(e) => onChange({ retard: e.target.value })} aria-label={titreRetard}
              placeholder={config ? String(config.retardMois) : '—'} className={`${CHAMP} w-16`} />
          </Champ>
          <button type="button" className={BOUTON_ICONE} disabled={!config} title={titreReinit} aria-label={titreReinit}
            onClick={() => config && onChange({ prevenance: String(config.prevenanceMois), retard: String(config.retardMois) })}>
            <RotateCcw className="h-4 w-4" />
          </button>
        </fieldset>

        <fieldset aria-label="Intervalle de dates, prioritaire sur la fenêtre" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className={TITRE} title="Intervalle de dates : prioritaire sur la fenêtre relative">{nomDate}</span>
          <Champ label="du">
            <input type="date" value={etat.dateDebut} onChange={(e) => onChange({ dateDebut: e.target.value })}
              aria-label={`${nomDate} à partir du`} className={`${CHAMP} w-[9.5rem]`} />
          </Champ>
          <Champ label="au" titre="Une seule des deux dates suffit">
            <input type="date" min={etat.dateDebut || undefined} value={etat.dateFin} onChange={(e) => onChange({ dateFin: e.target.value })}
              aria-label={`${nomDate} jusqu'au`} className={`${CHAMP} w-[9.5rem]`} />
          </Champ>
          {dates && <button type="button" className={BOUTON_ICONE} title="Effacer les dates" aria-label="Effacer les dates"
            onClick={() => onChange({ dateDebut: '', dateFin: '' })}><X className="h-4 w-4" /></button>}
        </fieldset>
      </div>

      {dates && <p className="flex items-start gap-1.5 text-[12px] leading-snug text-accent-dark">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        <span>Les dates remplacent la fenêtre : la tolérance de retard est ignorée.{surPreparation && ' La date de préparation reste calculée avec le délai configuré du type.'}</span>
      </p>}
      {erreur && <p role="alert" className="flex items-center gap-1.5 text-[12.5px] font-medium text-danger">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />{erreur}
      </p>}
    </section>
  )
}
