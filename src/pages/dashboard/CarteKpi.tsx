import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Info, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Infobulle } from '@/components/ui/Infobulle'
import { nombreFr } from '@/utils/dashboard'

export type TonCarte = 'neutre' | 'danger' | 'succes'
const TONS: Record<TonCarte, { carte: string; survol: string; valeur: string; icone: string }> = {
  neutre: { carte: 'border-[#E4E6EB] bg-white', survol: 'hover:border-accent', valeur: 'text-ink', icone: 'text-accent' },
  danger: { carte: 'border-danger/30 border-l-4 border-l-danger bg-danger-light', survol: 'hover:shadow-md', valeur: 'text-danger', icone: 'text-danger' },
  succes: { carte: 'border-success/30 bg-success-light', survol: 'hover:shadow-md', valeur: 'text-success', icone: 'text-success' },
}

interface CarteKpiProps {
  libelle: string; valeur: number | null; precision?: ReactNode; icone: LucideIcon; ton?: TonCarte; aide: string; to?: string
  chargement: boolean; erreur: string | null; onReessayer: () => void; pied?: ReactNode
}

export function CarteKpi({ libelle, valeur, precision, icone: Icone, ton = 'neutre', aide, to, chargement, erreur, onReessayer, pied }: CarteKpiProps) {
  const t = TONS[ton]
  const titre = <span className="text-[11.5px] font-semibold uppercase tracking-wide text-[#6B7180]">{libelle}</span>
  return <div className={`relative flex flex-col gap-3 rounded-xl border p-5 transition-shadow ${t.carte} ${to ? t.survol : ''}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2"><Icone className={`h-4 w-4 flex-shrink-0 ${t.icone}`} aria-hidden="true" />
        {to ? <Link to={to} className="min-w-0 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent">
          {titre}{valeur != null && <span className="sr-only"> : {nombreFr(valeur)}</span>}
        </Link> : titre}
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">{to && <ArrowUpRight className="h-4 w-4 text-[#9CA0AC]" aria-hidden="true" />}
        <Infobulle texte={aide} align="droite" etiquette={`Définition : ${libelle}`} className="z-10 hover:z-50 focus-within:z-50"><Info className="h-3.5 w-3.5 text-[#9CA0AC]" aria-hidden="true" /></Infobulle>
      </div>
    </div>
    <div className="min-h-[2.5rem]">
      {erreur ? <div className="flex flex-col items-start gap-1.5"><span className="text-[13px] text-[#6B7180]">Indisponible</span><Button variant="secondary" size="sm" onClick={onReessayer} className="relative z-10">Réessayer</Button></div>
        : chargement || valeur == null ? <span role="status" aria-label="Chargement" className="block h-9 w-24 animate-pulse rounded bg-[#EAEBF0]" />
        : <p className={`font-display text-[32px] font-semibold leading-none ${t.valeur}`}>{nombreFr(valeur)}{ton === 'succes' && <span aria-hidden="true" className="ml-1.5 text-[20px]">✓</span>}</p>}
    </div>
    {precision && !erreur && <p className="text-[12.5px] leading-snug text-[#6B7180]">{precision}</p>}
    {pied && !erreur && <div className="relative z-10 text-[12.5px]">{pied}</div>}
  </div>
}
