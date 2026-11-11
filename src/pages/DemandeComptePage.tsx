import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/api/auth'
import { extractErrorMessage } from '@/api/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { APP_NAME, APP_NAME_LONG } from '@/config/app'
import { ROLE_LABELS } from '@/utils/roles'

const PROFILS = [
  { role: 'ROLE_AGENT', description: 'Consulter votre propre dossier de carrière et vos échéances (lecture seule).' },
  { role: 'ROLE_RH', description: 'Suivre les alertes, dossiers et échéances des agents de votre périmètre (ministère, SOA, localité).' },
  { role: 'ROLE_CHEF', description: 'Comme RH, et consulter les comptes RH et Agent de votre périmètre.' },
] as const

export function DemandeComptePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [matricule, setMatricule] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [profil, setProfil] = useState<string>('ROLE_AGENT')
  const [error, setError] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState<string | null>(null)

  if (!isLoading && isAuthenticated) return <Navigate to="/" replace />

  // Mêmes règles que le serveur (DemandeCompteRequest) : le serveur ne renvoie qu'un « Erreur de validation » générique
  const mdpCourt = password !== '' && password.length < 8
  const mdpDifferent = confirmation !== '' && confirmation !== password
  const valide = matricule.trim() !== '' && nom.trim() !== '' && prenom.trim() !== '' && email.trim() !== ''
    && password.length >= 8 && password.length <= 72 && confirmation === password

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valide) return
    setError(null)
    setEnvoi(true)
    try {
      const reponse = await authApi.demanderCompte({
        matricule: matricule.trim(), nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), password, profil,
      })
      setPassword('')
      setConfirmation('')
      setEnvoye(reponse.message)
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible d'enregistrer la demande"))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink"><ShieldCheck className="h-5 w-5 text-white" /></div>
            <span className="font-display text-[15px] font-semibold tracking-wide text-ink">{APP_NAME}</span>
          </div>
          <p className="mt-2.5 max-w-sm text-[12.5px] leading-snug text-[#6B7180]">{APP_NAME_LONG}</p>
        </div>

        {envoye ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-success/30 bg-success-light px-5 py-5">
            <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
            <h1 className="font-display text-[20px] font-semibold text-ink">Demande envoyée</h1>
            <p className="text-[13.5px] leading-relaxed text-[#4B4F5A]">{envoye}</p>
            <p className="text-[12.5px] text-[#6B7180]">Vous ne recevrez pas de message : réessayez de vous connecter plus tard.</p>
            <Link to="/login" className="mt-1"><Button icon={<ArrowLeft className="h-4 w-4" />}>Retour à la connexion</Button></Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-[22px] font-semibold text-ink">Demander un compte</h1>
            <p className="mt-1 text-[13.5px] text-[#6B7180]">
              Votre demande sera examinée par un administrateur ou un chef. Vous ne pourrez pas vous connecter tant qu'elle n'est pas approuvée.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {error && <ErrorBanner message={error} />}

              <Input label="Matricule (IM)" required value={matricule} onChange={(e) => setMatricule(e.target.value)} maxLength={20}
                hint="Votre numéro matricule d'agent, tel qu'il figure sur votre fiche." autoComplete="off" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" required value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={100} autoComplete="given-name" />
                <Input label="Nom" required value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100} autoComplete="family-name" />
              </div>
              <Input label="Adresse e-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150}
                placeholder="prenom.nom@entreprise.mg" autoComplete="email" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Mot de passe" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  maxLength={72} autoComplete="new-password" hint="8 caractères minimum"
                  error={mdpCourt ? 'Au moins 8 caractères.' : undefined} />
                <Input label="Confirmer le mot de passe" type="password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
                  maxLength={72} autoComplete="new-password" error={mdpDifferent ? 'Les deux mots de passe diffèrent.' : undefined} />
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-[13px] font-medium text-ink">Profil demandé <span className="text-danger">*</span></legend>
                <div role="radiogroup" aria-label="Profil demandé" className="flex flex-col gap-2">
                  {PROFILS.map(({ role, description }) => {
                    const actif = profil === role
                    return (
                      <button key={role} type="button" role="radio" aria-checked={actif} onClick={() => setProfil(role)}
                        className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                          actif ? 'border-accent bg-accent-light' : 'border-[#DADCE3] bg-white hover:border-accent'}`}>
                        <span className={`text-[13px] font-semibold ${actif ? 'text-accent-dark' : 'text-ink'}`}>{ROLE_LABELS[role]}</span>
                        <span className="text-[11.5px] leading-snug text-[#6B7180]">{description}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <Button type="submit" isLoading={envoi} disabled={!valide} className="mt-2 w-full">Envoyer la demande</Button>
            </form>

            <p className="mt-5 text-center text-[13px] text-[#6B7180]">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-accent hover:underline">Se connecter</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}