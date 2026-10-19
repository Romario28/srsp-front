import { useState } from 'react'
import { Check, ChevronRight, Filter, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { MenuDeroulant } from '@/components/ui/MenuDeroulant'
import { useFetch } from '@/hooks/useFetch'
import { anticipationApi } from '@/api/anticipation'
import {
  CHAMPS_FILTRES, FILTRES_VIDES, avecFiltre, nbFiltres, optionsDe, texteOption, valeurAffichee, type CleFiltre,
} from '@/utils/filtresAgents'
import type { FiltresAgents, OptionFiltre, OptionsFiltres } from '@/types/anticipation'

interface MenuFiltresProps {
  valeur: FiltresAgents
  onChange: (valeur: FiltresAgents) => void
}

export function MenuFiltres({ valeur, onChange }: MenuFiltresProps) {
  // Chargement au montage de l'écran, pour que l'ouverture du menu soit immédiate.
  const options = useFetch(() => anticipationApi.optionsFiltres())
  const n = nbFiltres(valeur)
  return <MenuDeroulant icon={<Filter className="h-3.5 w-3.5" />}
    libelle={<>Filtrer{n > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-4 text-white">{n}</span>}</>}
    largeur="w-[28rem] max-w-[calc(100vw_-_2rem)]">
    {() => <Panneau valeur={valeur} onChange={onChange} options={options.data} isLoading={options.isLoading}
      error={options.error} onReessayer={options.reload} />}
  </MenuDeroulant>
}

interface PanneauProps extends MenuFiltresProps {
  options: OptionsFiltres | null
  isLoading: boolean
  error: string | null
  onReessayer: () => void
}

function Panneau({ valeur, onChange, options, isLoading, error, onReessayer }: PanneauProps) {
  const [courante, setCourante] = useState<CleFiltre>(() => (CHAMPS_FILTRES.find((c) => valeur[c.cle]) ?? CHAMPS_FILTRES[0]).cle)
  const champ = CHAMPS_FILTRES.find((c) => c.cle === courante) ?? CHAMPS_FILTRES[0]
  const choisie = valeur[courante]
  const n = nbFiltres(valeur)
  const connues = optionsDe(courante, options)
  const liste: OptionFiltre[] = choisie && !connues.some((o) => o.code === choisie) ? [{ code: choisie, libelle: null }, ...connues] : connues
  const dependDesListes = courante !== 'statutAgent'
  const enAttente = dependDesListes && options == null && isLoading

  return <div className="flex flex-col">
    <div className="grid grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <div role="group" aria-label="Catégories de filtres" className="flex flex-col gap-0.5 border-b border-[#EAEBF0] p-1.5 sm:border-b-0 sm:border-r">
        {CHAMPS_FILTRES.map((c) => {
          const v = valeur[c.cle]
          const estCourante = c.cle === courante
          return <button key={c.cle} type="button" aria-current={estCourante ? 'true' : undefined}
            onMouseEnter={() => setCourante(c.cle)} onClick={() => setCourante(c.cle)}
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors ${estCourante ? 'bg-[#F0F1F4] font-medium text-ink' : 'text-[#4B4F5A] hover:bg-[#F4F5F7]'}`}>
            <span className="flex-1 truncate">{c.label}</span>
            {v && <span className="max-w-[4.5rem] truncate rounded-full bg-accent-light px-1.5 text-[11px] font-medium text-accent-dark">{valeurAffichee(c.cle, v)}</span>}
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-[#9CA0AC]" />
          </button>
        })}
      </div>
      <div className="min-w-0 p-1.5">
        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7180]">
          {courante === 'statutAgent' ? "Statut de l'agent" : champ.label}
        </p>
        <div key={courante} className="max-h-64 overflow-y-auto">
          {enAttente ? <p className="flex items-center gap-2 px-2 py-2 text-[13px] text-[#6B7180]"><Loader2 className="h-4 w-4 animate-spin text-accent" />Chargement…</p>
            : dependDesListes && error ? <div className="flex flex-col items-start gap-2 p-2"><ErrorBanner message={error} /><Button variant="secondary" size="sm" onClick={onReessayer}>Réessayer</Button></div>
            : liste.length === 0 ? <p className="px-2 py-2 text-[13px] text-[#6B7180]">Aucune valeur disponible.</p>
            : liste.map((o) => {
              const actif = o.code === choisie
              const texte = texteOption(courante, o)
              return <button key={o.code} type="button" aria-pressed={actif}
                onClick={() => onChange(avecFiltre(valeur, courante, actif ? '' : o.code))}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${actif ? 'bg-accent-light font-medium text-accent-dark' : 'text-ink hover:bg-[#F4F5F7]'}`}>
                <Check aria-hidden="true" className={`h-3.5 w-3.5 flex-shrink-0 ${actif ? '' : 'invisible'}`} />
                <span className="min-w-0 truncate" title={texte}>{texte}</span>
              </button>
            })}
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between gap-2 border-t border-[#EAEBF0] px-3 py-2">
      <span className="text-[12px] text-[#6B7180]">{n === 0 ? 'Aucun filtre actif' : `${n} filtre${n > 1 ? 's' : ''} actif${n > 1 ? 's' : ''}`}</span>
      <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => onChange(FILTRES_VIDES)} disabled={n === 0}>Tout réinitialiser</Button>
    </div>
  </div>
}
