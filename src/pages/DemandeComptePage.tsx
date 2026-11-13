import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { authApi } from '@/api/auth'
import { departementsApi } from '@/api/departements'
import { extractErrorMessage } from '@/api/client'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { APP_NAME, APP_NAME_LONG } from '@/config/app'
import { FONCTIONS, TACHES, type CleFonction, type CleTache } from '@/config/documents'
import { genererDocuments, type DonneesDocuments } from '@/utils/documentsCompte'
import { ROLE_LABELS } from '@/utils/roles'

const PROFILS = [
  { role: 'ROLE_AGENT', description: 'Consulter votre propre dossier de carrière et vos échéances (lecture seule).' },
  { role: 'ROLE_RH', description: 'Suivre les alertes, dossiers et échéances des agents de votre périmètre (ministère, SOA, localité).' },
  { role: 'ROLE_CHEF', description: 'Comme RH, et consulter les comptes RH et Agent de votre périmètre.' },
] as const

// champs obligatoires, dans l'ordre du formulaire : libellé affiché dans l'aide, identifiant pour y placer le curseur
type Cle = 'matricule' | 'prenom' | 'nom' | 'email' | 'password' | 'confirmation' | 'departement'
  | 'cin' | 'contact' | 'region' | 'fonction' | 'fonctionPrecision' | 'taches' | 'tachesPrecision'
const CHAMPS: readonly { cle: Cle; label: string; id: string }[] = [
  { cle: 'matricule', label: 'Matricule', id: 'champ-matricule' },
  { cle: 'cin', label: 'CIN', id: 'champ-cin' },
  { cle: 'prenom', label: 'Prénom', id: 'champ-prenom' },
  { cle: 'nom', label: 'Nom', id: 'champ-nom' },
  { cle: 'email', label: 'Adresse e-mail', id: 'champ-email' },
  { cle: 'contact', label: 'Contact', id: 'champ-contact' },
  { cle: 'password', label: 'Mot de passe (8 caractères minimum)', id: 'champ-password' },
  { cle: 'confirmation', label: 'Confirmation du mot de passe', id: 'champ-confirmation' },
  { cle: 'departement', label: 'Département', id: 'champ-departement' },
  { cle: 'region', label: 'Région', id: 'champ-region' },
  { cle: 'fonction', label: 'Fonction', id: 'champ-fonction' },
  { cle: 'fonctionPrecision', label: 'Précision de la fonction', id: 'champ-fonctionPrecision' },
  { cle: 'taches', label: 'Tâches', id: 'champ-taches' },
  { cle: 'tachesPrecision', label: 'Précision des autres tâches', id: 'champ-tachesPrecision' },
]   // [MODIFIÉ] ordre aligné sur la nouvelle disposition (CIN et Contact rejoignent l'identité)

/** Place le curseur sur le champ ; pour un groupe (fonction, tâches), sur son premier choix. */
function focaliser(id: string) {
  const element = document.getElementById(id)
  const cible = element?.matches('input, select, textarea') ? element : element?.querySelector<HTMLElement>('input, select')
  cible?.focus()
}

// [NOUVEAU] bloc visuel : titre, courte aide, contenu
function Bloc({ titre, aide, children }: { titre: string; aide?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-xl border border-[#E4E6EB] bg-white px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 className="font-display text-[13.5px] font-semibold text-ink">{titre}</h2>
        {aide && <p className="text-[11.5px] leading-snug text-[#6B7180]">{aide}</p>}
      </div>
      {children}
    </section>
  )
}

// [NOUVEAU] deux champs côte à côte dès la petite largeur, empilés sur mobile
const PAIRE = 'grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2'

interface Envoi { message: string; donnees: DonneesDocuments }

export function DemandeComptePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const departements = useFetch(() => departementsApi.listePublique())
  const [matricule, setMatricule] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [profil, setProfil] = useState<string>('ROLE_AGENT')
  // département (envoyé) ; le reste ne sert qu'aux documents PDF et n'est ni envoyé ni conservé
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
  const [envoye, setEnvoye] = useState<Envoi | null>(null)
  const [pdfEnCours, setPdfEnCours] = useState(false)
  const [pdfErreur, setPdfErreur] = useState<string | null>(null)
  // un champ n'est signalé en rouge qu'une fois quitté, ou quand l'utilisateur demande à tout repérer
  const [touches, setTouches] = useState<ReadonlySet<Cle>>(new Set())
  const [reperer, setReperer] = useState(false)

  if (!isLoading && isAuthenticated) return <Navigate to="/" replace />

  const liste = departements.data ?? []
  // Mêmes règles que le serveur (DemandeCompteRequest) : le serveur ne renvoie qu'un « Erreur de validation » générique
  const mdpCourt = password !== '' && password.length < 8
  const mdpDifferent = confirmation !== '' && confirmation !== password

  const defauts: Record<Cle, boolean> = {
    matricule: matricule.trim() === '',
    prenom: prenom.trim() === '',
    nom: nom.trim() === '',
    email: email.trim() === '',
    password: password.length < 8 || password.length > 72,
    confirmation: confirmation === '' || confirmation !== password,
    departement: departementId === '',
    cin: cin.trim() === '',
    contact: contact.trim() === '',
    region: region.trim() === '',
    fonction: fonction === '',
    fonctionPrecision: fonction === 'AUTRES' && fonctionPrecision.trim() === '',
    taches: taches.length === 0,
    tachesPrecision: taches.includes('AUTRES') && tachesPrecision.trim() === '',
  }
  const manquants = CHAMPS.filter((c) => defauts[c.cle])
  const valide = manquants.length === 0

  const toucher = (cle: Cle) => setTouches((courants) => (courants.has(cle) ? courants : new Set(courants).add(cle)))
  const afficher = (cle: Cle) => defauts[cle] && (reperer || touches.has(cle))
  const erreurChamp = (cle: Cle, message = 'Champ obligatoire.') => (afficher(cle) ? message : undefined)
  const repererLesChamps = () => {
    setReperer(true)
    if (manquants.length > 0) focaliser(manquants[0].id)
  }

  const basculerTache = (cle: CleTache) => {
    toucher('taches')
    setTaches((courantes) => (courantes.includes(cle) ? courantes.filter((c) => c !== cle) : [...courantes, cle]))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const choisi = liste.find((d) => String(d.id) === departementId)
    if (!valide || fonction === '' || !choisi) return
    setError(null)
    setEnvoi(true)
    try {
      const reponse = await authApi.demanderCompte({
        matricule: matricule.trim(), nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), password, profil,
        departementId: choisi.id,   // seul champ « document » envoyé au serveur
      })
      // instantané pour les PDF : le mot de passe n'y figure jamais
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

  // [MODIFIÉ] un seul fichier
  const telecharger = async () => {
    if (!envoye) return
    setPdfEnCours(true)
    setPdfErreur(null)
    try {
      await genererDocuments(envoye.donnees)
    } catch (err) {
      console.error(err)
      setPdfErreur('Impossible de générer le document. Réessayez.')
    } finally {
      setPdfEnCours(false)
    }
  }

  // [MODIFIÉ] page alignée en haut (pas centrée verticalement), marges réduites, largeur selon l'écran affiché
  return (
    <div className="flex min-h-screen items-start justify-center bg-canvas px-4 py-5">
      <div className={`w-full ${envoye ? 'max-w-lg' : 'max-w-3xl'}`}>
        {envoye ? (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink"><ShieldCheck className="h-5 w-5 text-white" /></div>
                <span className="font-display text-[15px] font-semibold tracking-wide text-ink">{APP_NAME}</span>
              </div>
              <p className="mt-2.5 max-w-sm text-[12.5px] leading-snug text-[#6B7180]">{APP_NAME_LONG}</p>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-xl border border-success/30 bg-success-light px-5 py-5">
              <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
              <h1 className="font-display text-[20px] font-semibold text-ink">Demande envoyée</h1>
              <p className="text-[13.5px] leading-relaxed text-[#4B4F5A]">{envoye.message}</p>

              <section className="flex w-full flex-col gap-2 rounded-lg border border-[#E4E6EB] bg-white px-4 py-3">
                <h2 className="font-display text-[13.5px] font-semibold text-ink">Documents à imprimer et à signer</h2>
                <p className="text-[12.5px] leading-snug text-[#6B7180]">
                  Un seul fichier PDF réunit la demande de login (page 1) et la lettre d'engagement (page 2), préremplies avec vos informations.
                  Elles comportent des zones de signature. Elles ne sont pas conservées : téléchargez-les maintenant, car fermer ou actualiser cette page les efface.
                </p>
                <div>
                  <Button size="sm" icon={<FileText className="h-3.5 w-3.5" />} isLoading={pdfEnCours}
                    onClick={() => void telecharger()}>Télécharger les documents (PDF)</Button>
                </div>
                {pdfErreur && <p role="alert" className="text-[12.5px] text-danger">{pdfErreur}</p>}
              </section>

              <p className="text-[12.5px] text-[#6B7180]">Vous ne recevrez pas de message : réessayez de vous connecter plus tard.</p>
              <Link to="/login" className="mt-1"><Button icon={<ArrowLeft className="h-4 w-4" />}>Retour à la connexion</Button></Link>
            </div>
          </>
        ) : (
          <>
            {/* [MODIFIÉ] en-tête sur une seule ligne : logo, nom, titre ; l'intitulé long n'apparaît plus ici */}
            <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1" title={APP_NAME_LONG}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink"><ShieldCheck className="h-4.5 w-4.5 text-white" /></div>
              <span className="font-display text-[14px] font-semibold tracking-wide text-ink">{APP_NAME}</span>
              <h1 className="font-display text-[19px] font-semibold text-ink sm:ml-3">Demander un compte</h1>
            </header>
            <p className="mb-3 text-[12.5px] leading-snug text-[#6B7180]">
              Votre demande sera examinée par un administrateur ou un chef. Vous ne pourrez pas vous connecter tant qu'elle n'est pas approuvée.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && <ErrorBanner message={error} />}

              <Bloc titre="Identité" aide="Matricule (IM) : votre numéro d'agent, tel qu'il figure sur votre fiche.">
                <div className={PAIRE}>
                  <Input id="champ-matricule" label="Matricule (IM)" required value={matricule} onChange={(e) => setMatricule(e.target.value)} maxLength={20}
                    onBlur={() => toucher('matricule')} error={erreurChamp('matricule')} autoComplete="off" />
                  <Input id="champ-cin" label="CIN" required value={cin} onChange={(e) => setCin(e.target.value)} maxLength={20}
                    onBlur={() => toucher('cin')} error={erreurChamp('cin')} autoComplete="off" />
                </div>
                <div className={PAIRE}>
                  <Input id="champ-prenom" label="Prénom" required value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={100}
                    onBlur={() => toucher('prenom')} error={erreurChamp('prenom')} autoComplete="given-name" />
                  <Input id="champ-nom" label="Nom" required value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100}
                    onBlur={() => toucher('nom')} error={erreurChamp('nom')} autoComplete="family-name" />
                </div>
                <div className={PAIRE}>
                  <Input id="champ-email" label="Adresse e-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150}
                    onBlur={() => toucher('email')} error={erreurChamp('email')}
                    placeholder="prenom.nom@entreprise.mg" autoComplete="email" />
                  <Input id="champ-contact" label="Contact" required value={contact} onChange={(e) => setContact(e.target.value)} maxLength={30}
                    onBlur={() => toucher('contact')} error={erreurChamp('contact')}
                    placeholder="034 00 000 00" autoComplete="tel" />
                </div>
              </Bloc>

              {/* [MODIFIÉ] ligne 1 : mots de passe ; ligne 2 : profil et département côte à côte */}
              <Bloc titre="Compte et sécurité" aide="Mot de passe : 8 caractères minimum. Le département est transmis avec la demande ; il n'accorde aucun droit.">
                <div className={PAIRE}>
                  <Input id="champ-password" label="Mot de passe" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => toucher('password')} maxLength={72} autoComplete="new-password"
                    error={mdpCourt ? 'Au moins 8 caractères.' : erreurChamp('password')} />
                  <Input id="champ-confirmation" label="Confirmer le mot de passe" type="password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
                    onBlur={() => toucher('confirmation')} maxLength={72} autoComplete="new-password"
                    error={mdpDifferent ? 'Les deux mots de passe diffèrent.' : erreurChamp('confirmation')} />
                </div>
                <div className={`${PAIRE} sm:items-start`}>
                  <Select label="Profil demandé" required value={profil} onChange={(e) => setProfil(e.target.value)}>
                    {PROFILS.map(({ role }) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                  </Select>
                  {/* [DÉPLACÉ] était dans « Informations professionnelles » ; title : libellé complet au survol, car la liste est étroite */}
                  <Select id="champ-departement" label="Département" required value={departementId} onChange={(e) => setDepartementId(e.target.value)}
                    onBlur={() => toucher('departement')} error={erreurChamp('departement', 'Choisissez un département.')}
                    title={liste.find((d) => String(d.id) === departementId)?.libelle}
                    disabled={departements.isLoading && !departements.data}>
                    <option value="">{departements.isLoading && !departements.data ? 'Chargement…' : 'Choisir votre département…'}</option>
                    {liste.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
                  </Select>
                </div>
                <p className="text-[11.5px] leading-snug text-[#6B7180]">
                  {PROFILS.find((p) => p.role === profil)?.description}
                </p>
                {departements.error && (
                  <div className="flex flex-col items-start gap-2">
                    <ErrorBanner message={departements.error} />
                    <Button type="button" variant="secondary" size="sm" onClick={departements.reload}>Réessayer</Button>
                  </div>
                )}
                {!departements.isLoading && !departements.error && liste.length === 0 && (
                  <p className="text-[12px] text-warning">Aucun département n'est encore défini : contactez un administrateur.</p>
                )}
              </Bloc>

              {/* [MODIFIÉ] le département n'est plus ici : Région et Fonction à gauche, Tâches à droite */}
              <Bloc titre="Informations professionnelles"
                aide="Ces informations servent uniquement à préremplir vos documents : elles ne sont ni envoyées ni conservées, et n'accordent aucun droit.">
                <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 md:grid-cols-2">
                  <div className="flex flex-col gap-2.5">
                    <Input id="champ-region" label="Région" required value={region} onChange={(e) => setRegion(e.target.value)} maxLength={100}
                      onBlur={() => toucher('region')} error={erreurChamp('region')} placeholder="Haute Matsiatra" />

                    <div className="flex flex-col gap-1.5">
                      <div id="champ-fonction" role="radiogroup" aria-label="Fonction" aria-invalid={afficher('fonction')}
                        className={`flex flex-col gap-1 rounded-lg border p-1.5 ${afficher('fonction') ? 'border-danger bg-danger-light/40' : 'border-transparent'}`}>
                        <span className="text-[13px] font-medium text-ink">Fonction <span className="text-danger">*</span></span>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          {FONCTIONS.map((f) => (
                            <label key={f.cle} className="flex items-center gap-2 text-[13px] text-ink">
                              <input type="radio" name="fonction" checked={fonction === f.cle} onChange={() => setFonction(f.cle)} className="h-4 w-4 accent-accent" />
                              {f.label}
                            </label>
                          ))}
                        </div>
                        {afficher('fonction') && <p role="alert" className="text-[12px] text-danger">Choisissez une fonction.</p>}
                      </div>
                      {fonction === 'AUTRES' && (
                        <Input id="champ-fonctionPrecision" label="Précisez la fonction" required value={fonctionPrecision}
                          onChange={(e) => setFonctionPrecision(e.target.value)} maxLength={100}
                          onBlur={() => toucher('fonctionPrecision')} error={erreurChamp('fonctionPrecision')} />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div id="champ-taches" role="group" aria-label="Tâches" aria-invalid={afficher('taches')}
                      className={`flex flex-col gap-1 rounded-lg border p-1.5 ${afficher('taches') ? 'border-danger bg-danger-light/40' : 'border-transparent'}`}>
                      <span className="text-[13px] font-medium text-ink">Tâches <span className="text-danger">*</span></span>
                      {TACHES.map((t) => (
                        <label key={t.cle} className="flex items-start gap-2 text-[13px] text-ink">
                          <input type="checkbox" checked={taches.includes(t.cle)} onChange={() => basculerTache(t.cle)} className="mt-0.5 h-4 w-4 accent-accent" />
                          <span>{t.label}{t.detail && <span className="block text-[11px] leading-snug text-[#6B7180]">{t.detail}</span>}</span>
                        </label>
                      ))}
                      {afficher('taches') && <p role="alert" className="text-[12px] text-danger">Cochez au moins une tâche.</p>}
                    </div>
                    {taches.includes('AUTRES') && (
                      <Input id="champ-tachesPrecision" label="Précisez les autres tâches" required value={tachesPrecision}
                        onChange={(e) => setTachesPrecision(e.target.value)} maxLength={150}
                        onBlur={() => toucher('tachesPrecision')} error={erreurChamp('tachesPrecision')} />
                    )}
                  </div>
                </div>
              </Bloc>

              {/* [MODIFIÉ] bouton et aide sur une même zone, sans marge supplémentaire */}
              <div className="flex flex-col gap-1.5">
                <Button type="submit" isLoading={envoi} disabled={!valide} className="w-full">Envoyer la demande</Button>
                {!valide && (
                  <div className="flex flex-col gap-1 text-[12px] leading-snug text-[#6B7180]">
                    <p>
                      Veuillez remplir tous les champs obligatoires (<span className="font-semibold text-danger">*</span>) pour envoyer votre demande.{' '}
                      <span className="font-medium text-ink">Il reste à compléter :</span> {manquants.map((c) => c.label).join(', ')}.
                    </p>
                    {!reperer && (
                      <button type="button" onClick={repererLesChamps} className="self-start font-medium text-accent hover:underline">
                        Repérer les champs dans le formulaire
                      </button>
                    )}
                  </div>
                )}
              </div>
            </form>

            <p className="mt-3 text-center text-[13px] text-[#6B7180]">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-accent hover:underline">Se connecter</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}