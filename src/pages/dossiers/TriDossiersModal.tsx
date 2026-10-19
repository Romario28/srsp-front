import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { LIBELLE_ORDRE, type Ordre } from '@/utils/dossiers'

const OPTIONS: Ordre[] = ['INVERSE', 'DEFAUT']

interface TriDossiersModalProps {
  aide: Record<Ordre, string>
  ordre: Ordre
  onChoisir: (ordre: Ordre) => void
  onClose: () => void
}

export function TriDossiersModal({ aide, ordre, onChoisir, onClose }: TriDossiersModalProps) {
  return <Modal isOpen onClose={onClose} title="Trier les dossiers" maxWidth="max-w-md">
    <div role="radiogroup" aria-label="Ordre d'affichage" className="flex flex-col gap-2">
      {OPTIONS.map((o) => {
        const choisi = o === ordre
        return <button key={o} type="button" role="radio" aria-checked={choisi} onClick={() => onChoisir(o)}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${choisi ? 'border-accent bg-accent-light' : 'border-[#DADCE3] bg-white hover:border-accent'}`}>
          <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${choisi ? 'border-accent bg-accent text-white' : 'border-[#B4B8C2]'}`}>
            {choisi && <Check className="h-3 w-3" />}
          </span>
          <span className="min-w-0"><span className="block text-[13.5px] font-semibold text-ink">{LIBELLE_ORDRE[o]}</span>
            <span className="mt-0.5 block text-[12.5px] text-[#6B7180]">{aide[o]}</span></span>
        </button>
      })}
    </div>
  </Modal>
}
