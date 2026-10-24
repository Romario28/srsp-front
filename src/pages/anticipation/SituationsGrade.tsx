import type { ReactNode } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { formatDate } from '@/utils/date'
import type { GradeSuivantDTO } from '@/types/anticipation'
import { GradeSuivant } from './GradeSuivant'

type DateOptionnelle = string | null | undefined

export function CelluleDerniereSituation({ grade, dateEffet }: { grade: string | null | undefined; dateEffet: DateOptionnelle }) {
  return <div className="flex flex-col gap-0.5">
    <span className="font-mono text-[13px] font-semibold text-ink">{grade || '—'}</span>
    <span className="whitespace-nowrap text-[12px] text-[#6B7180]">Effet : {formatDate(dateEffet)}</span>
  </div>
}

export function CelluleNouvelleSituation({ gradeSuivant, dateEffet }: { gradeSuivant: GradeSuivantDTO | null | undefined; dateEffet: DateOptionnelle }) {
  return <div className="flex flex-col gap-0.5">
    <GradeSuivant gradeSuivant={gradeSuivant} />
    <span className="whitespace-nowrap text-[12px] text-[#6B7180]">Effet : {formatDate(dateEffet)}</span>
  </div>
}

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-[#6B7180]">{label}</dt><dd className="min-w-0 text-ink">{children}</dd></>
}

function Bloc({ titre, accent = false, compact = false, children }: { titre: string; accent?: boolean; compact?: boolean; children: ReactNode }) {
  return <section className={`rounded-lg border ${compact ? 'px-3 py-2' : 'px-4 py-3'} ${accent ? 'border-accent/30 bg-accent-light' : 'border-[#E4E6EB] bg-[#FAFAFB]'}`}>
    <h3 className={`text-[11px] font-semibold uppercase tracking-wide ${accent ? 'text-accent-dark' : 'text-[#6B7180]'}`}>{titre}</h3>
    <dl className={`grid gap-x-3 gap-y-1.5 text-[13px] ${compact ? 'mt-1.5 grid-cols-[auto_minmax(0,1fr)]' : 'mt-2 grid-cols-[110px_minmax(0,1fr)]'}`}>{children}</dl>
  </section>
}

export function BlocsSituation({ gradeActuel, dateEffetActuelle, gradeSuivant, dateEffetNouvelle, horizontal = false }: {
  gradeActuel: string | null | undefined
  dateEffetActuelle: DateOptionnelle
  gradeSuivant: GradeSuivantDTO | null | undefined
  dateEffetNouvelle: DateOptionnelle
  horizontal?: boolean
}) {
  const lignesActuelle = <>
    <Ligne label="Grade"><span className="font-mono text-[13px] font-semibold">{gradeActuel || '—'}</span></Ligne>
    <Ligne label="Date d'effet">{formatDate(dateEffetActuelle)}</Ligne>
  </>
  const lignesNouvelle = <>
    <Ligne label="Grade"><GradeSuivant gradeSuivant={gradeSuivant} /></Ligne>
    <Ligne label="Date d'effet">{formatDate(dateEffetNouvelle)}</Ligne>
  </>
  if (horizontal) return <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
    <Bloc compact titre="Dernière situation">{lignesActuelle}</Bloc>
    <ArrowRight className="h-4 w-4 self-center text-[#9CA0AC]" aria-hidden="true" />
    <Bloc compact accent titre="Nouvelle situation">{lignesNouvelle}</Bloc>
  </div>
  return <div className="flex flex-col gap-1">
    <Bloc titre="Dernière situation">{lignesActuelle}</Bloc>
    <ArrowDown className="mx-auto h-4 w-4 text-[#9CA0AC]" aria-hidden="true" />
    <Bloc titre="Nouvelle situation" accent>{lignesNouvelle}</Bloc>
  </div>
}
