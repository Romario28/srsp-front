import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useFetch } from '@/hooks/useFetch'
import { anticipationApi } from '@/api/anticipation'
import { texteOption, type CleFiltre } from '@/utils/filtresAgents'
import type { OptionFiltre } from '@/types/anticipation'
import type { PerimetreDTO } from '@/types/utilisateur'

interface Axe {
  cle: keyof PerimetreDTO
  label: string
  options: 'ministeres' | 'soa' | 'fiv'   // clé dans OptionsFiltres
  filtre: CleFiltre
}
const AXES: readonly Axe[] = [
  { cle: 'ministeres', label: 'Ministères', options: 'ministeres', filtre: 'ministere' },
  { cle: 'soas', label: 'SOA', options: 'soa', filtre: 'soa' },
  { cle: 'fivs', label: 'Localités (FIV)', options: 'fiv', filtre: 'fiv' },
]

interface SelecteurPerimetreProps { valeur: PerimetreDTO; onChange: (valeur: PerimetreDTO) => void }

export function SelecteurPerimetre({ valeur, onChange }: SelecteurPerimetreProps) {
  const { data: options, isLoading, error, reload } = useFetch(() => anticipationApi.optionsFiltres())
  return (
    <div className="flex flex-col gap-3">
      {error && <div className="flex flex-col items-start gap-2"><ErrorBanner message={error} /><Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button></div>}
      {AXES.map((axe) => (
        <Bloc key={axe.cle} axe={axe} codes={valeur[axe.cle]} options={options?.[axe.options] ?? []} attente={isLoading && !options}
          onChange={(codes) => onChange({ ...valeur, [axe.cle]: codes })} />
      ))}
    </div>
  )
}

function Bloc({ axe, codes, options, attente, onChange }: {
  axe: Axe; codes: string[]; options: OptionFiltre[]; attente: boolean; onChange: (codes: string[]) => void
}) {
  const parCode = new Map(options.map((o) => [o.code, o]))
  const restantes = options.filter((o) => !codes.includes(o.code))
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink">{axe.label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {codes.length === 0 && <span className="text-[12.5px] text-[#9CA0AC]">Toutes (aucune restriction)</span>}
        {codes.map((code) => {
          const option = parCode.get(code)
          return (
            <span key={code} className="inline-flex items-center gap-1 rounded-full bg-accent-light py-0.5 pl-2.5 pr-1 text-[12px] font-medium text-accent-dark">
              {option ? texteOption(axe.filtre, option) : code}
              <button type="button" onClick={() => onChange(codes.filter((c) => c !== code))} aria-label={`Retirer ${code}`}
                className="rounded-full p-0.5 hover:bg-accent/10"><X className="h-3 w-3" /></button>
            </span>
          )
        })}
      </div>
      <select value="" disabled={attente || restantes.length === 0} aria-label={`Ajouter : ${axe.label}`}
        onChange={(e) => { if (e.target.value) onChange([...codes, e.target.value].sort()) }}
        className="h-9 rounded-lg border border-[#DADCE3] bg-white px-2.5 text-[13px] text-ink focus:border-accent disabled:bg-[#F4F5F7] disabled:text-[#9CA0AC]">
        <option value="">{attente ? 'Chargement…' : restantes.length === 0 ? 'Aucune autre valeur' : 'Ajouter…'}</option>
        {restantes.map((o) => <option key={o.code} value={o.code}>{texteOption(axe.filtre, o)}</option>)}
      </select>
    </div>
  )
}