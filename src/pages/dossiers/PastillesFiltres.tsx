import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CHAMPS_FILTRES, FILTRES_VIDES, avecFiltre, valeurAffichee } from '@/utils/filtresAgents'
import type { FiltresAgents } from '@/types/anticipation'

interface PastillesFiltresProps {
  valeur: FiltresAgents
  onChange: (valeur: FiltresAgents) => void
}

export function PastillesFiltres({ valeur, onChange }: PastillesFiltresProps) {
  const actifs = CHAMPS_FILTRES.filter((champ) => valeur[champ.cle])
  if (actifs.length === 0) return null
  return <div role="group" aria-label="Filtres actifs" className="flex flex-wrap items-center gap-2">
    {actifs.map((champ) => <button key={champ.cle} type="button" onClick={() => onChange(avecFiltre(valeur, champ.cle, ''))}
      aria-label={`Retirer le filtre ${champ.label}`}
      className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-[12px] font-medium text-accent-dark hover:bg-accent/10">
      {champ.label} : {valeurAffichee(champ.cle, valeur[champ.cle] as string)}<X className="h-3 w-3" />
    </button>)}
    <Button variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={() => onChange(FILTRES_VIDES)}>Tout réinitialiser</Button>
  </div>
}
