import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { nombreFr } from '@/utils/dashboard'

interface BlocDashboardProps {
  titre: string
  actions?: ReactNode
  aide: string
  chargement: boolean
  erreur: string | null
  onReessayer: () => void
  className?: string
  children: ReactNode
}

export function BlocDashboard({ titre, actions, aide, chargement, erreur, onReessayer, className = '', children }: BlocDashboardProps) {
  return <section className={`flex min-w-0 flex-col gap-4 rounded-xl border border-[#E4E6EB] bg-white p-5 ${className}`}>
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="font-display text-[15px] font-semibold text-ink">{titre}</h2><p className="mt-1 text-[12px] text-[#6B7180]">{aide}</p></div>
      {actions}
    </header>
    {erreur ? <div className="flex flex-col items-start gap-2"><ErrorBanner message={erreur} /><Button variant="secondary" size="sm" onClick={onReessayer}>Réessayer</Button></div>
      : chargement ? <Spinner label={`Chargement : ${titre.toLowerCase()}…`} /> : children}
  </section>
}

/** Alternative accessible d'un graphique : les mêmes valeurs, en tableau repliable. */
export function VoirEnTableau({ colonnes, lignes }: { colonnes: string[]; lignes: (string | number)[][] }) {
  return <details className="text-[12.5px]">
    <summary className="cursor-pointer text-accent hover:underline">Voir en tableau</summary>
    <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-[#E4E6EB]"><table className="w-full">
      <thead className="bg-[#FAFAFB]"><tr>{colonnes.map((c) => <th key={c} className="table-head-cell">{c}</th>)}</tr></thead>
      <tbody className="divide-y divide-[#EAEBF0]">{lignes.map((ligne, i) => <tr key={i}>{ligne.map((v, j) => <td key={j} className={`table-cell ${j > 0 ? 'tabular-nums' : ''}`}>{typeof v === 'number' ? nombreFr(v) : v}</td>)}</tr>)}</tbody>
    </table></div>
  </details>
}
