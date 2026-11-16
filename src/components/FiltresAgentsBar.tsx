import { MenuFiltres } from '@/pages/dossiers/MenuFiltres'          // [NOUVEAU]
import { PastillesFiltres } from '@/pages/dossiers/PastillesFiltres' // [NOUVEAU]
import type { FiltresAgents } from '@/types/anticipation'

interface FiltresAgentsBarProps {
  valeur: FiltresAgents
  onChange: (valeur: FiltresAgents) => void
}

/**
 * [MODIFIÉ] Filtres cumulables sur les agents : même menu que l'écran Dossiers.
 * Le bouton ouvre un panneau flottant (il n'agrandit pas la page) ; les filtres actifs restent visibles en pastilles.
 */
export function FiltresAgentsBar({ valeur, onChange }: FiltresAgentsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MenuFiltres libelle="Filtres" valeur={valeur} onChange={onChange} />
      <PastillesFiltres valeur={valeur} onChange={onChange} />
    </div>
  )
}