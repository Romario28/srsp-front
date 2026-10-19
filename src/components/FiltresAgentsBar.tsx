import { useId, useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useFetch } from '@/hooks/useFetch'
import { anticipationApi } from '@/api/anticipation'
import {
  CHAMPS_FILTRES, FILTRES_VIDES, avecFiltre, nbFiltres, optionsDe, texteOption, valeurAffichee, type CleFiltre,
} from '@/utils/filtresAgents'
import type { FiltresAgents, OptionFiltre } from '@/types/anticipation'

interface FiltresAgentsBarProps {
  valeur: FiltresAgents
  onChange: (valeur: FiltresAgents) => void
}

function Champ({ cle, label, valeur, options, attente, onChange }: {
  cle: CleFiltre
  label: string
  valeur: string | undefined
  options: OptionFiltre[]
  attente: boolean
  onChange: (valeur: string) => void
}) {
  const liste = valeur && !options.some((o) => o.code === valeur) ? [{ code: valeur, libelle: null }, ...options] : options
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[12px] font-medium text-[#6B7180]">{label}</span>
      <select value={valeur ?? ''} onChange={(e) => onChange(e.target.value)} disabled={attente}
        className="h-9 w-full min-w-0 rounded-lg border border-[#DADCE3] bg-white px-2.5 text-[13px] text-ink focus:border-accent disabled:bg-[#F4F5F7] disabled:text-[#9CA0AC]">
        <option value="">Tous</option>
        {liste.map((o) => <option key={o.code} value={o.code}>{texteOption(cle, o)}</option>)}
      </select>
    </label>
  )
}

/** Huit filtres partagés par la barre repliable et la modale Dossiers. */
export function ChampsFiltresAgents({ valeur, onChange, grille = 'grid-cols-2 md:grid-cols-4' }: FiltresAgentsBarProps & { grille?: string }) {
  const { data: options, isLoading, error, reload } = useFetch(() => anticipationApi.optionsFiltres())
  return (
    <div className="flex flex-col gap-3">
      {error && <div className="flex flex-col items-start gap-2"><ErrorBanner message={error} /><Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button></div>}
      <div className={`grid gap-3 ${grille}`}>
        {CHAMPS_FILTRES.map((champ) => <Champ key={champ.cle} cle={champ.cle} label={champ.label} valeur={valeur[champ.cle]}
          options={optionsDe(champ.cle, options)} attente={isLoading && champ.cle !== 'statutAgent'}
          onChange={(v) => onChange(avecFiltre(valeur, champ.cle, v))} />)}
      </div>
    </div>
  )
}

/** Filtres cumulables sur les agents. Repliée : filtres actifs visibles en pastilles retirables. */
export function FiltresAgentsBar({ valeur, onChange }: FiltresAgentsBarProps) {
  const idPanneau = useId()
  const [ouvert, setOuvert] = useState(false)
  const n = nbFiltres(valeur)
  const actifs = CHAMPS_FILTRES.filter((champ) => valeur[champ.cle])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" icon={<Filter className="h-3.5 w-3.5" />}
          onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-controls={idPanneau}>
          Filtres{n > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-4 text-white">{n}</span>}
        </Button>
        {!ouvert && actifs.map((champ) => <button key={champ.cle} type="button" onClick={() => onChange(avecFiltre(valeur, champ.cle, ''))}
          aria-label={`Retirer le filtre ${champ.label}`}
          className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-[12px] font-medium text-accent-dark hover:bg-accent/10">
          {champ.label} : {valeurAffichee(champ.cle, valeur[champ.cle] as string)}<X className="h-3 w-3" />
        </button>)}
        {n > 0 && <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => onChange(FILTRES_VIDES)}>Réinitialiser</Button>}
      </div>
      {ouvert && <div id={idPanneau} className="rounded-xl border border-[#E4E6EB] bg-white p-4">
        <ChampsFiltresAgents valeur={valeur} onChange={onChange} />
      </div>}
    </div>
  )
}
