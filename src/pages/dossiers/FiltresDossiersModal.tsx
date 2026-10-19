import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ChampsFiltresAgents } from '@/components/FiltresAgentsBar'
import { FILTRES_VIDES, cleFiltres, nbFiltres } from '@/utils/filtresAgents'
import type { FiltresAgents } from '@/types/anticipation'

interface FiltresDossiersModalProps {
  valeur: FiltresAgents
  onAppliquer: (valeur: FiltresAgents) => void
  onClose: () => void
}

export function FiltresDossiersModal({ valeur, onAppliquer, onClose }: FiltresDossiersModalProps) {
  const [brouillon, setBrouillon] = useState<FiltresAgents>(valeur)
  const modifie = cleFiltres(brouillon) !== cleFiltres(valeur)
  const pied = <div className="flex items-center justify-between gap-2">
    <Button variant="ghost" onClick={() => setBrouillon(FILTRES_VIDES)} disabled={nbFiltres(brouillon) === 0}>Réinitialiser</Button>
    <div className="flex gap-2"><Button variant="secondary" onClick={onClose}>Annuler</Button>
      <Button onClick={() => onAppliquer(brouillon)} disabled={!modifie}>Appliquer</Button></div>
  </div>

  return <Modal isOpen onClose={onClose} title="Filtrer les dossiers" maxWidth="max-w-2xl" footer={pied}>
    <div className="flex flex-col gap-4">
      <p className="text-[12.5px] text-[#6B7180]">
        Ces filtres portent sur l'agent (le « Statut » est celui de l'agent : Fonctionnaire, Contractuel ou ELD, pas celui du dossier).
        Ils se cumulent et s'appliquent à tous les onglets. Un agent dont la valeur est absente n'apparaît pas quand le filtre correspondant est posé.
      </p>
      <ChampsFiltresAgents valeur={brouillon} onChange={setBrouillon} grille="grid-cols-1 sm:grid-cols-2" />
    </div>
  </Modal>
}
