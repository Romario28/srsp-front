import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ForbiddenPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <ShieldAlert className="h-9 w-9 text-danger" />
      <h1 className="font-display text-[22px] font-semibold text-ink">Accès refusé</h1>
      <p className="max-w-sm text-[13.5px] text-[#6B7180]">
        Votre rôle ne permet pas d'accéder à cette page.
      </p>
      <Link to="/" className="mt-2"><Button>Retour au tableau de bord</Button></Link>
    </div>
  )
}
