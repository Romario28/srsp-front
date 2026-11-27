import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Eye, EyeOff, Info, Lock, Mail, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { extractErrorCode, extractErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { APP_NAME, APP_NAME_LONG } from '@/config/app'
import { isAgent } from '@/utils/roles'

interface CompteDemo { email: string; password: string; label: string }
const DEMO_ACCOUNTS: readonly CompteDemo[] = [
    { email: 'admin@entreprise.mg', password: 'Admin123!', label: 'Administrateur' },
    { email: 'sophie.martin@entreprise.mg', password: 'Chef123!', label: 'Chef — ministère 05' },
    { email: 'hanta.rabe@entreprise.mg', password: 'Rh123!', label: 'RH — 05 + L01' },
    { email: 'jean.rakoto@entreprise.mg', password: 'Agent123!', label: 'Agent — lecture seule' },
]

const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true'

// [NOUVEAU] Photo de fond : placez le fichier dans public/. Absent ou illisible, le dégradé en dessous s'affiche.
const FOND = [
    'url(/login-fond.jpg)',
    'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.14), transparent 45%)',
    'linear-gradient(135deg, #161A2E 0%, #1F5875 55%, #2A6F97 100%)',
].join(', ')

// [NOUVEAU] logo et nom de l'application ; remplacez le bloc par une <img> pour un vrai logo
function Logo({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`flex flex-col items-center ${compact ? 'gap-2' : 'gap-4'}`}>
            <div className={`flex items-center justify-center rounded-2xl bg-accent ${compact ? 'h-11 w-11' : 'h-16 w-16'}`}>
                <ShieldCheck className={`text-white ${compact ? 'h-6 w-6' : 'h-9 w-9'}`} aria-hidden="true" />
            </div>
            <p className={`font-display font-semibold tracking-[0.18em] ${compact ? 'text-[20px] text-white' : 'text-[34px] text-ink'}`}>{APP_NAME}</p>
        </div>
    )
}

// [NOUVEAU] champ du formulaire, sur fond sombre : libellé clair, icône à gauche, action facultative à droite
function Champ({ id, label, icone: Icone, action, children }: {
    id: string; label: string; icone: LucideIcon; action?: ReactNode; children: ReactNode
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[12.5px] font-medium text-white/80">{label}</label>
            <div className="relative">
                <Icone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7180]" aria-hidden="true" />
                {children}
                {action}
            </div>
        </div>
    )
}
const CLASSE_CHAMP = 'h-10 w-full rounded-lg border border-transparent bg-white pl-9 text-sm text-ink placeholder:text-[#9CA0AC] focus:border-accent focus-visible:outline-white'

/**
 * [NOUVEAU] Bouton discret et menu des comptes de démonstration. S'ouvre vers le haut (reste dans la carte et à l'écran).
 * Se ferme au clic sur le bouton, à Échap, au clic à l'extérieur, ou quand le focus clavier part ailleurs.
 */
function ComptesDemo({ comptes, onChoisir }: { comptes: readonly CompteDemo[]; onChoisir: (compte: CompteDemo) => void }) {
    const [ouvert, setOuvert] = useState(false)
    const racine = useRef<HTMLDivElement>(null)
    const bouton = useRef<HTMLButtonElement>(null)
    const idPanneau = useId()

    useEffect(() => {
        if (!ouvert) return
        const surClic = (e: PointerEvent) => { if (!racine.current?.contains(e.target as Node)) setOuvert(false) }
        const surTouche = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            setOuvert(false)
            bouton.current?.focus()
        }
        document.addEventListener('pointerdown', surClic)
        document.addEventListener('keydown', surTouche)
        return () => {
            document.removeEventListener('pointerdown', surClic)
            document.removeEventListener('keydown', surTouche)
        }
    }, [ouvert])

    return (
        <div ref={racine} className="relative"
             onBlur={(e) => {
                 const vers = e.relatedTarget as Node | null
                 if (vers && !racine.current?.contains(vers)) setOuvert(false)
             }}>
            <button ref={bouton} type="button" aria-expanded={ouvert} aria-controls={ouvert ? idPanneau : undefined}
                    onClick={() => setOuvert((o) => !o)}
                    className="inline-flex items-center gap-1 text-[12px] text-white/55 transition-colors hover:text-white focus-visible:outline-white">
                Voir les comptes de démonstration
                <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${ouvert ? 'rotate-180' : ''}`} />
            </button>
            {ouvert && (
                <div id={idPanneau} className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-xl border border-[#E4E6EB] bg-white p-1.5 shadow-lg">
                    <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7180]">Choisir un profil : le formulaire se pré-remplit</p>
                    {comptes.map((compte) => (
                        <button key={compte.email} type="button"
                                onClick={() => { onChoisir(compte); setOuvert(false); bouton.current?.focus() }}
                                className="flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[#F4F5F7]">
                            <span className="text-[13px] font-semibold text-ink">{compte.label}</span>
                            <span className="truncate font-mono text-[11.5px] text-[#6B7180]">{compte.email}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function LoginPage() {
    const { login, isAuthenticated, isLoading, user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [voirMotDePasse, setVoirMotDePasse] = useState(false)   // [NOUVEAU]
    const [error, setError] = useState<string | null>(null)
    const [attente, setAttente] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isLoading && isAuthenticated) {
        const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
        return <Navigate to={isAgent(user?.roles) ? '/mon-espace' : from} replace />
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)
        setAttente(null)
        setIsSubmitting(true)
        try {
            await login({ email, password })
            navigate('/', { replace: true })
        } catch (err) {
            if (extractErrorCode(err) === 'COMPTE_EN_ATTENTE') {
                setAttente(extractErrorMessage(err, "Votre demande de compte est en cours d'examen."))
            } else {
                setError(extractErrorMessage(err, 'Email ou mot de passe incorrect'))
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const fillDemo = (acc: CompteDemo) => {
        setEmail(acc.email)
        setPassword(acc.password)
        setError(null)
        setAttente(null)
    }

    return (
        // [MODIFIÉ] fond plein écran : photo (ou dégradé), voile sombre, puis la carte centrale
        <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
            <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: FOND }} />
            <div aria-hidden="true" className="absolute inset-0 bg-ink/50" />

            <main className="relative grid w-full max-w-3xl shadow-2xl md:min-h-[26rem] md:grid-cols-2">
                {/* Gauche : logo et nom de l'application (masqué sur mobile, où le logo est repris en haut du formulaire) */}
                <section className="hidden flex-col items-center justify-between rounded-l-2xl bg-white px-8 py-10 md:flex">
                    <span aria-hidden="true" />
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Logo />
                        <p className="max-w-[17rem] text-[12px] leading-snug text-[#6B7180]">{APP_NAME_LONG}</p>
                    </div>
                    {/*<p className="text-[11px] text-[#9CA0AC]">© {new Date().getFullYear()} Entreprise — Usage interne</p>/*/}
                    <p className="text-[11px] text-[#9CA0AC]"> </p>
                </section>

                {/* Droite : formulaire */}
                <section className="flex flex-col rounded-2xl bg-ink px-7 py-8 text-white md:rounded-l-none md:rounded-r-2xl">
                    <div className="mb-5 md:hidden"><Logo compact /></div>

                    <h1 className="font-display text-[22px] font-semibold">Connexion</h1>
                    <p className="mt-1 text-[13px] text-white/60">Connectez-vous à votre compte.</p>

                    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
                        {error && <ErrorBanner message={error} />}
                        {attente && (
                            <div role="status" className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark">
                                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                <span>{attente}</span>
                            </div>
                        )}

                        <Champ id="connexion-email" label="Adresse e-mail" icone={Mail}>
                            <input id="connexion-email" type="email" autoComplete="username" required value={email}
                                   onChange={(e) => setEmail(e.target.value)} placeholder="nom@gmail.com"
                                   className={`${CLASSE_CHAMP} pr-3`} />
                        </Champ>

                        <Champ id="connexion-mdp" label="Mot de passe" icone={Lock}
                               action={
                                   <button type="button" onClick={() => setVoirMotDePasse((v) => !v)} aria-pressed={voirMotDePasse}
                                           aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                           className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#6B7180] hover:text-ink">
                                       {voirMotDePasse ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                                   </button>
                               }>
                            <input id="connexion-mdp" type={voirMotDePasse ? 'text' : 'password'} autoComplete="current-password" required value={password}
                                   onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                                   className={`${CLASSE_CHAMP} pr-10`} />
                        </Champ>

                        <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
                            Se connecter{!isSubmitting && <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </form>

                    {/* conservé : lien de demande de compte, sous le bouton */}
                    <p className="mt-4 text-center text-[13px] text-white/65">
                        Pas encore de compte ?{' '}
                        <Link to="/demande-compte" className="font-medium text-white underline-offset-2 hover:underline focus-visible:outline-white">Demander un compte</Link>
                    </p>

                    {/* [MODIFIÉ] la liste n'est plus affichée : un petit bouton ouvre un menu (même drapeau qu'avant) */}
                    {SHOW_DEMO_ACCOUNTS && (
                        <div className="mt-auto pt-6">
                            <ComptesDemo comptes={DEMO_ACCOUNTS} onChoisir={fillDemo} />
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

/*
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight, Info } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { extractErrorCode, extractErrorMessage } from '@/api/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { APP_NAME, APP_NAME_LONG } from '@/config/app'
import { isAgent } from '@/utils/roles'

const DEMO_ACCOUNTS = [
  { email: 'admin@entreprise.mg', password: 'Admin123!', label: 'Administrateur' },
  { email: 'sophie.martin@entreprise.mg', password: 'Chef123!', label: 'Chef — ministère 05' },
  { email: 'hanta.rabe@entreprise.mg', password: 'Rh123!', label: 'RH — 05 + L01' },
  { email: 'jean.rakoto@entreprise.mg', password: 'Agent123!', label: 'Agent — lecture seule' },
]

const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true'

export function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attente, setAttente] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/'
    return <Navigate to={isAgent(user?.roles) ? '/mon-espace' : from} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setAttente(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      if (extractErrorCode(err) === 'COMPTE_EN_ATTENTE') {
        setAttente(extractErrorMessage(err, "Votre demande de compte est en cours d'examen."))
      } else {
        setError(extractErrorMessage(err, 'Email ou mot de passe incorrect'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError(null)
    setAttente(null)
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between bg-ink p-10 text-white lg:flex">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-[15px] font-semibold tracking-wide">{APP_NAME}</span>
          </div>
          <p className="mt-3 max-w-xs text-[12.5px] leading-snug text-white/60">{APP_NAME_LONG}</p>
        </div>

        <div className="max-w-sm">
          <h1 className="font-display text-[28px] font-semibold leading-[1.25]">
            Anticipation des carrières et gestion des accès.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/60">
            Un périmètre précis par ministère, SOA et localité pour chaque gestionnaire, et un accès complet pour les administrateurs.
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
              <span className="font-display text-[15px] font-semibold tracking-wide text-ink">{APP_NAME}</span>
            </div>
            <p className="mt-2.5 max-w-xs text-[12.5px] leading-snug text-[#6B7180]">{APP_NAME_LONG}</p>
          </div>

          <h2 className="font-display text-[22px] font-semibold text-ink">Connexion</h2>
          <p className="mt-1 text-[13.5px] text-[#6B7180]">Accédez à votre espace de gestion.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {error && <ErrorBanner message={error} />}
            {attente && (
              <div role="status" className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{attente}</span>
              </div>
            )}
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

          <p className="mt-5 text-center text-[13px] text-[#6B7180]">
            Pas encore de compte ?{' '}
            <Link to="/demande-compte" className="font-medium text-accent hover:underline">Demander un compte</Link>
          </p>

          {SHOW_DEMO_ACCOUNTS && <div className="mt-8 rounded-xl border border-[#E4E6EB] bg-white p-4">
            <p className="text-[12px] font-medium text-ink">Comptes de démonstration</p>
            <p className="mt-0.5 text-[11.5px] text-[#6B7180]">
              Cliquez pour pré-remplir.
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
}*/
