import { ChevronLeft, ChevronRight } from 'lucide-react'
import { numerosAffiches } from '@/utils/pagination'
import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
  disabled?: boolean
  /** Numéros cliquables et barre toujours visible dès qu'il y a un résultat. */
  avecNumeros?: boolean
}

export function Pagination({ page, totalPages, totalElements, onPageChange, disabled = false, avecNumeros = false }: PaginationProps) {
  if (avecNumeros ? totalElements === 0 : totalPages <= 1) return null
  const pages = Math.max(totalPages, 1)
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#6B7180]">
      <span>Page {page + 1} sur {pages} · {totalElements} résultat{totalElements > 1 ? 's' : ''}</span>
      <div className={`flex items-center ${avecNumeros ? 'gap-1.5' : 'gap-2'}`}>
        <Button variant="secondary" size="sm" icon={<ChevronLeft className="h-4 w-4" />} disabled={disabled || page <= 0} onClick={() => onPageChange(page - 1)}>Précédent</Button>
        {avecNumeros && numerosAffiches(page, pages).map((p, i) => p === null
          ? <span key={`ellipse-${i}`} aria-hidden="true" className="px-1 text-[#9CA0AC]">…</span>
          : <button key={p} type="button" disabled={disabled} aria-label={`Page ${p + 1}`} aria-current={p === page ? 'page' : undefined}
              onClick={() => { if (p !== page) onPageChange(p) }}
              className={`h-8 min-w-8 rounded-lg px-2 text-[13px] font-medium tabular-nums transition-colors disabled:cursor-not-allowed ${
                p === page ? 'bg-accent text-white' : 'border border-[#DADCE3] bg-white text-ink hover:bg-[#F0F1F4] disabled:opacity-50'}`}>
              {p + 1}
            </button>)}
        <Button variant="secondary" size="sm" disabled={disabled || page >= pages - 1} onClick={() => onPageChange(page + 1)}>Suivant<ChevronRight className="h-4 w-4" /></Button>
      </div>
    </nav>
  )
}
