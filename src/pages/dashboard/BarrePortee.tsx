import { MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { anticipationApi } from '@/api/anticipation'
import { CHAMPS_PORTEE } from '@/utils/dashboard'
import { FILTRES_VIDES, avecFiltre, nbFiltres, optionsDe, texteOption } from '@/utils/filtresAgents'
import type { FiltresAgents, OptionFiltre } from '@/types/anticipation'

interface BarrePorteeProps { valeur: FiltresAgents; onChange: (valeur: FiltresAgents) => void }

export function BarrePortee({ valeur, onChange }: BarrePorteeProps) {
  const { data: options, isLoading, error, reload } = useFetch(() => anticipationApi.optionsFiltres())
  const actifs = nbFiltres(valeur)
  return <div role="group" aria-label="Périmètre du tableau de bord" className="sticky top-0 z-20 flex flex-wrap items-end gap-x-4 gap-y-2 rounded-xl border border-[#E4E6EB] bg-white px-4 py-3 shadow-sm">
    <span className="flex items-center gap-1.5 self-end pb-2 text-[13px] font-semibold text-ink"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" />Périmètre</span>
    {CHAMPS_PORTEE.map(({ cle, label }) => {
      const choisie = valeur[cle]
      const connues = optionsDe(cle, options)
      const liste: OptionFiltre[] = choisie && !connues.some((o) => o.code === choisie) ? [{ code: choisie, libelle: null }, ...connues] : connues
      return <label key={cle} className="flex min-w-0 flex-col gap-1"><span className="text-[12px] font-medium text-[#6B7180]">{label}</span>
        <select value={choisie ?? ''} disabled={isLoading && !options} onChange={(e) => onChange(avecFiltre(valeur, cle, e.target.value))}
          className="h-9 w-56 max-w-full rounded-lg border border-[#DADCE3] bg-white px-2.5 text-[13px] text-ink focus:border-accent disabled:bg-[#F4F5F7] disabled:text-[#9CA0AC]">
          <option value="">Tous</option>{liste.map((o) => <option key={o.code} value={o.code}>{texteOption(cle, o)}</option>)}
        </select>
      </label>
    })}
    {actifs > 0 && <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => onChange(FILTRES_VIDES)}>Réinitialiser</Button>}
    {error && <div className="flex items-center gap-2 self-end pb-1 text-[12.5px] text-danger">Listes indisponibles<Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button></div>}
  </div>
}
