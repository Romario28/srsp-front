import type { ReactNode } from 'react'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'violet'

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  neutral: 'bg-[#EAEBF0] text-[#4B4F5A]',
  accent: 'bg-accent-light text-accent-dark',
  violet: 'bg-violet-light text-violet',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  )
}

export function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    ACTIF: { tone: 'success', label: 'Actif' },
    SUSPENDU: { tone: 'warning', label: 'Suspendu' },
    DESACTIVE: { tone: 'danger', label: 'Désactivé' },
  }
  const cfg = map[statut] ?? { tone: 'neutral', label: statut }
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>
}

/** LECTURE vs LECTURE_ECRITURE — utilisé sur la page Délégations */
export function TypeAccesBadge({ typeAcces }: { typeAcces: string }) {
  return typeAcces === 'LECTURE_ECRITURE'
    ? <Badge tone="warning">Lecture/Écriture</Badge>
    : <Badge tone="neutral">Lecture seule</Badge>
}
