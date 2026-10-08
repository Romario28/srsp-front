import type { CasGradeSuivant } from '@/types/anticipation'

interface GradeSuivantProps {
  cas: CasGradeSuivant | null | undefined
  grade: string | null | undefined
}

export function GradeSuivant({ cas, grade }: GradeSuivantProps) {
  if (cas === 'AMBIGU') return <span>Ambigu{grade ? ` : ${grade}` : ''}</span>
  if (cas === 'DERNIER_GRADE') return <span>Dernier grade</span>
  if (cas === 'INDETERMINE') return <span>Indéterminé</span>
  return <span>{grade || '—'}</span>
}
