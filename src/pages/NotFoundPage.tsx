import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <Compass className="h-9 w-9 text-[#B4B8C2]" />
      <h1 className="font-display text-[22px] font-semibold text-ink">Page introuvable</h1>
      <p className="max-w-sm text-[13.5px] text-[#6B7180]">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="mt-2"><Button>Retour au tableau de bord</Button></Link>
    </div>
  )
}
