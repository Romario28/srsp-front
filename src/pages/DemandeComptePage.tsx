import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'   // [NOUVEAU] avant tout retour anticipé
import { authApi } from '@/api/auth'
import { departementsApi } from '@/api/departements'   // [NOUVEAU]
import { extractErrorMessage } from '@/api/client'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'   // [NOUVEAU]
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { APP_NAME, APP_NAME_LONG } from '@/config/app'
import { FONCTIONS, TACHES, type CleFonction, type CleTache } from '@/config/documents'   // [NOUVEAU]
import { genererDemandeLogin, genererLettreEngagement, type DonneesDocuments } from '@/utils/documentsCompte'   // [NOUVEAU]
import { ROLE_LABELS } from '@/utils/roles'

const PROFILS = [
  { role: 'ROLE_AGENT', description: 'Consulter votre propre dossier de carrière et vos échéances (lecture seule).' },
  { role: 'ROLE_RH', description: 'Suivre les alertes, dossiers et échéances des agents de votre périmètre (ministère, SOA, localité).' },
  { role: 'ROLE_CHEF', description: 'Comme RH, et consulter les comptes RH et Agent de votre périmètre.' },
] as const

interface Envoi { message: string; donnees: DonneesDocuments }   // [NOUVEAU]

export function DemandeComptePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const departements = useFetch(() => departementsApi.listePublique())   // [NOUVEAU] avant tout retour anticipé
  const [matricule, setMatricule] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [profil, setProfil] = useState<string>('ROLE_AGENT')
  // [NOUVEAU] département (envoyé) ; le reste ne sert qu'aux documents PDF et n'est ni envoyé ni conservé
  const [departementId, setDepartementId] = useState('')
  const [cin, setCin] = useState('')
  const [contact, setContact] = useState('')
  const [region, setRegion] = useState('')
  const [fonction, setFonction] = useState<CleFonction | ''>('')
  const [fonctionPrecision, setFonctionPrecision] = useState('')
  const [taches, setTaches] = useState<CleTache[]>([])
  const [tachesPrecision, setTachesPrecision] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState<Envoi | null>(null)   // [MODIFIÉ] était : string | null
  const [pdfEnCours, setPdfEnCours] = useState<'demande' | 'lettre' | null>(null)   // [NOUVEAU]
  const [pdfErreur, setPdfErreur] = useState<string | null>(null)   // [NOUVEAU]

  if (!isLoading && isAuthenticated) return <Navigate to="/" replace />

  const liste = departements.data ?? []
  // Mêmes règles que le serveur (DemandeCompteRequest) : le serveur ne renvoie qu'un « Erreur de validation » générique
  const mdpCourt = password !== '' && password.length < 8
  const mdpDifferent = confirmation !== '' && confirmation !== password
  const fonctionOk = fonction !== '' && (fonction !== 'AUTRES' || fonctionPrecision.trim() !== '')   // [NOUVEAU]
  const tachesOk = taches.length > 0 && (!taches.includes('AUTRES') || tachesPrecision.trim() !== '')   // [NOUVEAU]
  const valide = matricule.trim() !== '' && nom.trim() !== '' && prenom.trim() !== '' && email.trim() !== ''
    && password.length >= 8 && password.length <= 72 && confirmation === password
    && departementId !== '' && cin.trim() !== '' && contact.trim() !== '' && region.trim() !== '' && fonctionOk && tachesOk   // [MODIFIÉ]

  const basculerTache = (cle: CleTache) =>
    setTaches((courantes) => (courantes.includes(cle) ? courantes.filter((c) => c !== cle) : [...courantes, cle]))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const choisi = liste.find((d) => String(d.id) === departementId)
    if (!valide || !fonction || !choisi) return
    setError(null)
    setEnvoi(true)
    try {
      const reponse = await authApi.demanderCompte({
        matricule: matricule.trim(), nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), password, profil,
        departementId: choisi.id,   // [NOUVEAU] seul champ « document » envoyé au serveur
      })
      // [NOUVEAU] instantané pour les PDF : le mot de passe n'y figure jamais
      const donnees: DonneesDocuments = {
        matricule: matricule.trim(), nom: nom.trim(), prenom: prenom.trim(), cin: cin.trim(), contact: contact.trim(),
        email: email.trim(), departement: choisi.libelle, region: region.trim(),
        fonction, fonctionPrecision: fonctionPrecision.trim(), taches, tachesPrecision: tachesPrecision.trim(),
      }
      setPassword('')
      setConfirmation('')
      setEnvoye({ message: reponse.message, donnees })
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible d'enregistrer la demande"))
    } finally {
      setEnvoi(false)
    }
  }

  // [NOUVEAU]
  const telecharger = async (quel: 'demande' | 'lettre') => {
    if (!envoye) return
    setPdfEnCours(quel)
    setPdfErreur(null)
    try {
      await (quel === 'demande' ? genererDemandeLogin(envoye.donnees) : genererLettreEngagement(envoye.donnees))
    } catch (err) {
      console.error(err)
      setPdfErreur('Impossible de générer le document. Réessayez.')
    } finally {
      setPdfEnCours(null)
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
            <p className="text-[13.5px] leading-relaxed text-[#4B4F5A]">{envoye.message}</p>

            {/* [NOUVEAU] documents à imprimer */}
            <section className="flex w-full flex-col gap-2 rounded-lg border border-[#E4E6EB] bg-white px-4 py-3">
              <h2 className="font-display text-[13.5px] font-semibold text-ink">Documents à imprimer et à signer</h2>
              <p className="text-[12.5px] leading-snug text-[#6B7180]">
                La demande de login et la lettre d'engagement sont préremplies avec vos informations. Elles comportent des zones de signature.
                Elles ne sont pas conservées : téléchargez-les maintenant, car fermer ou actualiser cette page les efface.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={<FileText className="h-3.5 w-3.5" />} isLoading={pdfEnCours === 'demande'}
                  disabled={pdfEnCours !== null} onClick={() => void telecharger('demande')}>Demande de login (PDF)</Button>
                <Button size="sm" variant="secondary" icon={<FileText className="h-3.5 w-3.5" />} isLoading={pdfEnCours === 'lettre'}
                  disabled={pdfEnCours !== null} onClick={() => void telecharger('lettre')}>Lettre d'engagement (PDF)</Button>
              </div>
              {pdfErreur && <p role="alert" className="text-[12.5px] text-danger">{pdfErreur}</p>}
            </section>

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

              {/* [NOUVEAU] département : seul champ « document » envoyé au serveur */}
              <div className="flex flex-col gap-1.5">
                <Select label="Département" required value={departementId} onChange={(e) => setDepartementId(e.target.value)}
                  disabled={departements.isLoading && !departements.data}>
                  <option value="">{departements.isLoading && !departements.data ? 'Chargement…' : 'Choisir votre département…'}</option>
                  {liste.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
                </Select>
                {departements.error && (
                  <div className="flex flex-col items-start gap-2">
                    <ErrorBanner message={departements.error} />
                    <Button type="button" variant="secondary" size="sm" onClick={departements.reload}>Réessayer</Button>
                  </div>
                )}
                {!departements.isLoading && !departements.error && liste.length === 0 && (
                  <p className="text-[12px] text-warning">Aucun département n'est encore défini : contactez un administrateur.</p>
                )}
              </div>

              <fieldset className="flex flex-col gap-3 rounded-xl border border-[#E4E6EB] bg-white px-4 py-4">
                <legend className="px-1 font-display text-[13px] font-semibold text-ink">Informations pour vos documents</legend>
                <p className="text-[12px] leading-snug text-[#6B7180]">
                  Ces informations servent uniquement à préremplir la demande de login et la lettre d'engagement. Elles ne sont ni envoyées au serveur ni conservées.
                  Elles ne donnent aucun droit dans l'application.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="CIN" required value={cin} onChange={(e) => setCin(e.target.value)} maxLength={20} autoComplete="off" />
                  <Input label="Contact" required value={contact} onChange={(e) => setContact(e.target.value)} maxLength={30}
                    placeholder="034 00 000 00" autoComplete="tel" />
                </div>
                <Input label="Région" required value={region} onChange={(e) => setRegion(e.target.value)} maxLength={100} placeholder="Haute Matsiatra" />

                <div role="radiogroup" aria-label="Fonction" className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-ink">Fonction <span className="text-danger">*</span></span>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {FONCTIONS.map((f) => (
                      <label key={f.cle} className="flex items-center gap-2 text-[13px] text-ink">
                        <input type="radio" name="fonction" checked={fonction === f.cle} onChange={() => setFonction(f.cle)} className="h-4 w-4 accent-accent" />
                        {f.label}
                      </label>
                    ))}
                  </div>
                  {fonction === 'AUTRES' && (
                    <Input label="Précisez la fonction" required value={fonctionPrecision} onChange={(e) => setFonctionPrecision(e.target.value)} maxLength={100} />
                  )}
                </div>

                <div role="group" aria-label="Tâches" className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-ink">Tâches <span className="text-danger">*</span></span>
                  {TACHES.map((t) => (
                    <label key={t.cle} className="flex items-start gap-2 text-[13px] text-ink">
                      <input type="checkbox" checked={taches.includes(t.cle)} onChange={() => basculerTache(t.cle)} className="mt-0.5 h-4 w-4 accent-accent" />
                      <span>{t.label}{t.detail && <span className="block text-[11.5px] leading-snug text-[#6B7180]">{t.detail}</span>}</span>
                    </label>
                  ))}
                  {taches.includes('AUTRES') && (
                    <Input label="Précisez les autres tâches" required value={tachesPrecision} onChange={(e) => setTachesPrecision(e.target.value)} maxLength={150} />
                  )}
                </div>
              </fieldset>

              {/* [MODIFIÉ] liste déroulante à la place des cartes cliquables */}
              <div className="flex flex-col gap-1.5">
                <Select label="Profil demandé" required value={profil} onChange={(e) => setProfil(e.target.value)}>
                  {PROFILS.map(({ role }) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                </Select>
                <p className="text-[12px] leading-snug text-[#6B7180]">
                  {PROFILS.find((p) => p.role === profil)?.description}
                </p>
              </div>

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
