import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { extractErrorMessage } from '@/api/client'

// Comptes seedés par DataInitializer — un par scénario de visibilité du cahier des charges.
const DEMO_ACCOUNTS = [
  { email: 'admin@entreprise.mg', password: 'Admin123!', label: 'ADMIN — tout voir' },
  { email: 'sophie.martin@entreprise.mg', password: 'Chef123!', label: 'Chef (Direction Finances)' },
  { email: 'fidy.rakoto@entreprise.mg', password: 'Employe123!', label: 'Employé — lui-même' },
  { email: 'voahangy.rasoamanana@entreprise.mg', password: 'Delegue123!', label: '« RH central » (délégation racine)' },
  { email: 'hanta.rabe@entreprise.mg', password: 'Delegue123!', label: '« RH local » (délégation DFI)' },
]

const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Email ou mot de passe incorrect'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError(null)
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between bg-ink p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-[15px] font-semibold">Gestion RH & Organigramme</span>
        </div>

        <div className="max-w-sm">
          <h1 className="font-display text-[28px] font-semibold leading-[1.25]">
            Un organigramme réel, une visibilité qui suit la hiérarchie.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/60">
            Chaque chef voit son sous-arbre. Les délégations couvrent l'intérim, l'audit,
            et l'autorité RH — centrale ou locale — sans rôle dédié à retenir.
          </p>
        </div>

        <p className="text-[12px] text-white/35">© {new Date().getFullYear()} Entreprise — Usage interne</p>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-[15px] font-semibold text-ink">Gestion RH & Organigramme</span>
            </div>
          </div>

          <h2 className="font-display text-[22px] font-semibold text-ink">Connexion</h2>
          <p className="mt-1 text-[13.5px] text-[#6B7180]">Accédez à votre espace de gestion.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && <ErrorBanner message={error} />}
            <Input
              label="Adresse e-mail" type="email" autoComplete="username" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@entreprise.mg"
            />
            <Input
              label="Mot de passe" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              Se connecter{!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {SHOW_DEMO_ACCOUNTS && <div className="mt-8 rounded-xl border border-[#E4E6EB] bg-white p-4">
            <p className="text-[12px] font-medium text-ink">Comptes de démonstration</p>
            <p className="mt-0.5 text-[11.5px] text-[#6B7180]">
              Un par scénario de visibilité — cliquez pour pré-remplir.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email} type="button" onClick={() => fillDemo(acc)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#E4E6EB] px-3 py-2 text-left text-[12.5px] hover:border-accent hover:bg-accent-light"
                >
                  <span className="truncate font-mono text-[#4B4F5A]">{acc.email}</span>
                  <span className="flex-shrink-0 text-[11px] font-medium text-accent-dark">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>}
        </div>
      </div>
    </div>
  )
}
