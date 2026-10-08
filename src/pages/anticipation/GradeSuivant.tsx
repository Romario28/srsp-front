import type { GradeSuivantDTO } from '@/types/anticipation'

interface GradeSuivantProps {
  gradeSuivant: GradeSuivantDTO | null | undefined
}

export function GradeSuivant({ gradeSuivant }: GradeSuivantProps) {
  if (gradeSuivant == null) return <span>—</span>
  const codes = gradeSuivant.codes ?? []
  switch (gradeSuivant.cas) {
    case 'AMBIGU': return <span>Ambigu{codes.length > 0 ? ` : ${codes.join(', ')}` : ''}</span>
    case 'DERNIER_GRADE': return <span>Dernier grade</span>
    case 'INDETERMINE': return <span>Indéterminé</span>
    default: return <span>{codes[0] ?? '—'}</span>
  }
}
