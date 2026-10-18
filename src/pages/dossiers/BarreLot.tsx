import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { todayInputValue } from '@/utils/date'
import { ETAPES } from '@/utils/dossiers'
import type { EtapeDossier } from '@/types/dossier'

interface BarreLotProps {
  nb: number
  occupe: boolean
  onAppliquer: (etape: EtapeDossier, date: string, ecraser: boolean) => void
  onVider: () => void
}

/** Barre fixée en bas tant qu'une sélection existe. */
export function BarreLot({ nb, occupe, onAppliquer, onVider }: BarreLotProps) {
  const [etape, setEtape] = useState<EtapeDossier>('CHEF_AVANT_FOP')
  const [date, setDate] = useState(todayInputValue())
  const [ecraser, setEcraser] = useState(false)
  const champ = 'h-9 rounded-lg border border-[#DADCE3] bg-white px-2.5 text-[13px] text-ink focus:border-accent'
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-end gap-x-4 gap-y-3 rounded-xl border border-accent/40 bg-white px-4 py-3 shadow-lg">
      <p className="self-center text-[13px] font-semibold text-ink">{nb} dossier{nb > 1 ? 's' : ''} sélectionné{nb > 1 ? 's' : ''}</p>
      <label className="flex flex-col gap-1"><span className="text-[12px] font-medium text-[#6B7180]">Étape</span>
        <select value={etape} onChange={(e) => setEtape(e.target.value as EtapeDossier)} className={champ}>
          {ETAPES.map((x) => <option key={x.cle} value={x.cle}>{x.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1"><span className="text-[12px] font-medium text-[#6B7180]">Date</span>
        <input type="date" value={date} max={todayInputValue()} onChange={(e) => setDate(e.target.value)} className={champ} />
      </label>
      <label className="flex items-center gap-1.5 self-center text-[12.5px] text-[#4B4F5A]">
        <input type="checkbox" checked={ecraser} onChange={(e) => setEcraser(e.target.checked)} className="h-4 w-4 accent-accent" />
        Remplacer les dates déjà saisies
      </label>
      <div className="ml-auto flex gap-2">
        <Button variant="ghost" onClick={onVider} disabled={occupe}>Désélectionner</Button>
        <Button onClick={() => onAppliquer(etape, date, ecraser)} isLoading={occupe} disabled={!date}>Appliquer</Button>
      </div>
    </div>
  )
}
