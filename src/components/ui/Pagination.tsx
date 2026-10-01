import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({ page, totalPages, totalElements, onPageChange, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between text-[13px] text-[#6B7180]">
      <span>Page {page + 1} sur {totalPages} · {totalElements} résultat{totalElements > 1 ? 's' : ''}</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" icon={<ChevronLeft className="h-4 w-4" />} disabled={disabled || page <= 0} onClick={() => onPageChange(page - 1)}>Précédent</Button>
        <Button variant="secondary" size="sm" disabled={disabled || page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>Suivant<ChevronRight className="h-4 w-4" /></Button>
      </div>
    </nav>
  )
}
