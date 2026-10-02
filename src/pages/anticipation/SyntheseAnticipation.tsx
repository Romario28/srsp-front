import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, BadgeCheck, CalendarClock, Hourglass, RefreshCw, TrendingUp, type LucideIcon } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { useAlertesNouvelles } from '@/hooks/useAlertesNouvelles'
import { alertesApi } from '@/api/alertes'
import { anticipationApi } from '@/api/anticipation'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { StatCard } from '@/components/ui/StatCard'
import { EtatBaseVide } from './GardeBaseAgents'
import type { TypeAnticipation } from '@/types/anticipation'

const CARTES: { type: TypeAnticipation; label: string; icon: LucideIcon }[] = [
  { type: 'DEPART_RETRAITE', label: 'Départs à la retraite', icon: Hourglass },
  { type: 'AVANCEMENT', label: 'Avancements', icon: TrendingUp },
  { type: 'TITULARISATION', label: 'Titularisations', icon: BadgeCheck },
  { type: 'FIN_CONTRAT', label: 'Fins de contrat', icon: CalendarClock },
  { type: 'ANOMALIE', label: 'Anomalies', icon: AlertTriangle },
]
type Compteurs = Record<TypeAnticipation, number>

async function compterNouvellesParType(): Promise<Compteurs> {
  const nombres = await Promise.all(CARTES.map((carte) => alertesApi.compter({ statut: 'NOUVELLE', type: carte.type })))
  return Object.fromEntries(CARTES.map((carte, index) => [carte.type, nombres[index]])) as Compteurs
}

function CartesSynthese() {
  const { refresh: rafraichirBadge } = useAlertesNouvelles()
  const { data, isLoading, error, reload } = useFetch(compterNouvellesParType)
  useEffect(() => { rafraichirBadge() }, [rafraichirBadge])

  const misAJourA = useMemo(() => data ? new Date() : null, [data])
  const total = data ? Object.values(data).reduce((somme, nombre) => somme + nombre, 0) : null
  const actualiser = () => { reload(); rafraichirBadge() }

  return <section className="flex flex-col gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3"><div>
      <h2 className="font-display text-[14.5px] font-semibold text-ink">Anticipation RH</h2>
      <p className="mt-0.5 text-[13px] text-[#6B7180]">{total == null ? 'Chargement…' : total === 0 ? 'Aucune alerte nouvelle.' : `${total} alerte${total > 1 ? 's' : ''} nouvelle${total > 1 ? 's' : ''} à traiter.`}</p>
    </div><div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>Actualiser</Button>
      <Link to="/anticipation/alertes" className="flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">Voir le fil d'alertes <ArrowUpRight className="h-3.5 w-3.5" /></Link>
    </div></div>
    {error && <ErrorBanner message={error} />}
    <div className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-5 ${isLoading && data ? 'opacity-60' : ''}`}>
      {CARTES.map((carte) => {
        const nombre = data ? data[carte.type] : null
        return <StatCard key={carte.type} icon={carte.icon} label={carte.label} value={nombre ?? '—'} sub={nombre == null ? undefined : nombre > 1 ? 'alertes nouvelles' : 'alerte nouvelle'} to={`/anticipation/alertes?type=${carte.type}`} />
      })}
    </div>
    <p className="text-[12px] text-[#9CA0AC]">Comptes issus du calcul de nuit (03h00 par défaut), pas d'un calcul en direct : ils ne bougent pas pendant la journée, même après un import ou un changement de fenêtre. Seules les alertes « nouvelles » sont comptées : une alerte ouverte n'est plus comptée. Pour l'état à l'instant, lancez un calcul depuis les écrans de consultation.{misAJourA && ` Actualisé à ${misAJourA.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`}</p>
  </section>
}

/** Vérifie qu'il existe des agents avant de demander les cinq compteurs d'alertes. */
export function SyntheseAnticipation() {
  const { data, isLoading } = useFetch(() => anticipationApi.etatBase())
  if (isLoading && !data) return null
  if (data?.nbAgents === 0) {
    return <section className="flex flex-col gap-3"><h2 className="font-display text-[14.5px] font-semibold text-ink">Anticipation RH</h2><EtatBaseVide /></section>
  }
  return <CartesSynthese />
}
