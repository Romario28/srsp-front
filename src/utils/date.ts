export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function todayInputValue(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function enUtc(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function joursEntre(depuis: string, vers: string): number {
  return Math.round((enUtc(vers) - enUtc(depuis)) / 86400000)
}

export function joursRestantsDepuis(dateEcheance: string | null | undefined): number | null {
  if (!dateEcheance) return null
  const n = joursEntre(todayInputValue(), dateEcheance)
  return Number.isNaN(n) ? null : n
}

export function formatDureeMs(ms: number): string {
  const secondes = ms / 1000
  if (secondes < 1) return 'moins d’une seconde'
  if (secondes < 60) return `${secondes.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s`
  const minutes = Math.floor(secondes / 60)
  const reste = Math.floor(secondes % 60)
  return `${minutes} min ${String(reste).padStart(2, '0')} s`
}
