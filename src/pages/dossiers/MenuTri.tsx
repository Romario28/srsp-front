import { ArrowUpDown, Check } from 'lucide-react'
import { MenuDeroulant } from '@/components/ui/MenuDeroulant'
import { LIBELLE_ORDRE, type Ordre } from '@/utils/dossiers'

const OPTIONS: Ordre[] = ['INVERSE', 'DEFAUT']

interface MenuTriProps {
  aide: Record<Ordre, string> | undefined
  ordre: Ordre
  onChoisir: (ordre: Ordre) => void
}

export function MenuTri({ aide, ordre, onChoisir }: MenuTriProps) {
  return <MenuDeroulant icon={<ArrowUpDown className="h-3.5 w-3.5" />}
    libelle={aide ? `Trier : ${LIBELLE_ORDRE[ordre]}` : 'Trier'} disabled={!aide}
    title={aide ? undefined : 'Ordre fixe pour cet onglet : rien à trier'} largeur="w-80">
    {(fermer) => aide ? <div role="radiogroup" aria-label="Ordre d'affichage" className="flex flex-col gap-0.5 p-1.5">
      {OPTIONS.map((o) => {
        const choisi = o === ordre
        return <button key={o} type="button" role="radio" aria-checked={choisi}
          onClick={() => { fermer(); if (o !== ordre) onChoisir(o) }}
          className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${choisi ? 'bg-accent-light' : 'hover:bg-[#F4F5F7]'}`}>
          <Check aria-hidden="true" className={`mt-0.5 h-4 w-4 flex-shrink-0 ${choisi ? 'text-accent-dark' : 'invisible'}`} />
          <span className="min-w-0"><span className="block text-[13px] font-semibold text-ink">{LIBELLE_ORDRE[o]}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[#6B7180]">{aide[o]}</span></span>
        </button>
      })}
    </div> : null}
  </MenuDeroulant>
}
