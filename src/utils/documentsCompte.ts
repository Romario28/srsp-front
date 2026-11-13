import type { jsPDF } from 'jspdf'
import { APP_NAME } from '@/config/app'
import {
  DESTINATAIRE_DEMANDE, ENTETE_ADMINISTRATION, FONCTIONS, LIBELLE_APPLICATION_LETTRE, LIEU_DOCUMENTS, LOGO_URL, TACHES,   // [MODIFIÉ] LIEU_DOCUMENTS remplace LIEU_DEMANDE et LIEU_LETTRE
  type CleFonction, type CleTache,
} from '@/config/documents'

export interface DonneesDocuments {
  matricule: string
  nom: string
  prenom: string
  cin: string
  contact: string
  email: string
  departement: string
  region: string
  fonction: CleFonction
  fonctionPrecision: string
  taches: CleTache[]
  tachesPrecision: string
}

type Logo = { data: string; format: 'PNG' | 'JPEG' } | null   // [NOUVEAU]

const MARGE = 20
const LARGEUR_PAGE = 210

async function nouveauDocument(): Promise<jsPDF> {
  const { jsPDF: JsPdf } = await import('jspdf')   // chargé à la demande : hors du paquet principal
  const doc = new JsPdf({ unit: 'mm', format: 'a4' })
  doc.setFont('times', 'normal')
  return doc
}

/** Le serveur de développement renvoie index.html (code 200) pour un fichier absent : on contrôle donc le type. */
async function chargerLogo(): Promise<Logo> {
  try {
    const reponse = await fetch(LOGO_URL)
    const type = reponse.headers.get('content-type') ?? ''
    if (!reponse.ok || !/^image\/(png|jpeg)/.test(type)) return null
    const format = type.startsWith('image/png') ? 'PNG' : 'JPEG'
    const blob = await reponse.blob()
    const data = await new Promise<string>((resolve, reject) => {
      const lecteur = new FileReader()
      lecteur.onload = () => resolve(String(lecteur.result))
      lecteur.onerror = () => reject(lecteur.error)
      lecteur.readAsDataURL(blob)
    })
    return { data, format }
  } catch {
    return null
  }
}

const dateDuJour = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const nomFichier = (prefixe: string, matricule: string) => `${prefixe}_${matricule.replace(/[^A-Za-z0-9]/g, '') || 'agent'}.pdf`

// « FALITIANA rakoto » : nom en majuscules, prénom tel que saisi, séparés par un simple espace
function identite(d: DonneesDocuments): string {
  return `${d.nom.toUpperCase()} ${d.prenom}`.trim()
}

function libelleFonction(d: DonneesDocuments): string {
  if (d.fonction === 'AUTRES') return d.fonctionPrecision.trim()
  return FONCTIONS.find((f) => f.cle === d.fonction)?.label ?? ''
}

function texteSouligne(doc: jsPDF, texte: string, x: number, y: number, options?: { align?: 'center' }) {
  doc.text(texte, x, y, options)
  const largeur = doc.getTextWidth(texte)
  const debut = options?.align === 'center' ? x - largeur / 2 : x
  doc.line(debut, y + 0.8, debut + largeur, y + 0.8)
}

function caseACocher(doc: jsPDF, x: number, y: number, cochee: boolean) {
  doc.setLineWidth(0.2)
  doc.rect(x, y - 3, 3.6, 3.6)
  if (cochee) {
    doc.setLineWidth(0.5)
    doc.line(x + 0.7, y - 2.3, x + 2.9, y - 0.1)
    doc.line(x + 2.9, y - 2.3, x + 0.7, y - 0.1)
    doc.setLineWidth(0.2)
  }
}

/** [MODIFIÉ] logo déjà chargé, lieu commun aux deux documents. Renvoie l'ordonnée où poursuivre. */
function enTete(doc: jsPDF, logo: Logo, avecDestinataire: boolean): number {
  let y = 18
  if (logo) {
    const props = doc.getImageProperties(logo.data)
    const largeur = 40
    const hauteur = (largeur * props.height) / props.width
    doc.addImage(logo.data, logo.format, (LARGEUR_PAGE - largeur) / 2, 10, largeur, hauteur)
    y = 10 + hauteur + 8
  }

  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  let yGauche = y
  for (const ligne of ENTETE_ADMINISTRATION) {
    for (const morceau of doc.splitTextToSize(ligne, 85) as string[]) {
      doc.text(morceau, 62.5, yGauche, { align: 'center' })
      yGauche += 4.5
    }
  }

  doc.setFontSize(10)
  doc.text(`${LIEU_DOCUMENTS}, le ${dateDuJour()}`, 125, y)
  let yDroite = y
  if (avecDestinataire) {
    doc.setFontSize(9)
    doc.text('A', 157, y + 12, { align: 'center' })
    yDroite = y + 18
    for (const morceau of doc.splitTextToSize(DESTINATAIRE_DEMANDE, 65) as string[]) {
      doc.text(morceau, 157, yDroite, { align: 'center' })
      yDroite += 4.5
    }
  }
  return Math.max(yGauche, yDroite) + 8
}

function ligneChamp(doc: jsPDF, label: string, valeur: string, y: number, xValeur = 62) {
  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  texteSouligne(doc, label, MARGE, y)
  doc.text(valeur, xValeur, y)
}

// ── Page : demande de création ou de modification de login ──────────────────
// [MODIFIÉ] dessine sur le document reçu, sans le créer ni l'enregistrer

function dessinerDemandeLogin(doc: jsPDF, logo: Logo, d: DonneesDocuments) {
  doc.setFont('times', 'normal')
  doc.setLineWidth(0.2)
  let y = enTete(doc, logo, true)

  doc.setFontSize(11)
  texteSouligne(doc, `Demande de création ou de modification de login ${APP_NAME}`, LARGEUR_PAGE / 2, y, { align: 'center' })
  y += 10

  ligneChamp(doc, 'IM :', d.matricule, y); y += 8
  ligneChamp(doc, 'NOM(S) :', identite(d), y); y += 8
  ligneChamp(doc, 'CIN :', d.cin, y); y += 8
  ligneChamp(doc, 'CONTACT :', d.contact, y); y += 8
  ligneChamp(doc, 'EMAIL :', d.email, y); y += 8
  ligneChamp(doc, 'DEPARTEMENT :', '', y)
  const lignesDepartement = doc.splitTextToSize(d.departement, 190 - 62) as string[]
  doc.text(lignesDepartement, 62, y)
  y += 8 + (lignesDepartement.length - 1) * 4.5
  ligneChamp(doc, 'RÉGION :', d.region, y); y += 6

  // Tableau Fonction / Tâches
  const x0 = MARGE
  const largeur = 170
  const xSeparation = x0 + 70
  const hauteurEntete = 7
  const hauteurCorps = 76
  doc.setLineWidth(0.2)
  doc.rect(x0, y, largeur, hauteurEntete + hauteurCorps)
  doc.line(xSeparation, y, xSeparation, y + hauteurEntete + hauteurCorps)
  doc.line(x0, y + hauteurEntete, x0 + largeur, y + hauteurEntete)
  doc.setFontSize(9)
  doc.text('Fonction', x0 + 35, y + 4.8, { align: 'center' })
  doc.text('Tâches', xSeparation + 50, y + 4.8, { align: 'center' })

  doc.setFontSize(10)
  FONCTIONS.forEach((f, i) => {
    const yy = y + hauteurEntete + 9 + i * 10
    caseACocher(doc, x0 + 4, yy, d.fonction === f.cle)
    doc.text(f.label, x0 + 10, yy)
    if (f.cle === 'AUTRES' && d.fonction === 'AUTRES' && d.fonctionPrecision.trim()) {
      doc.setFontSize(8)
      doc.text(doc.splitTextToSize(d.fonctionPrecision.trim(), 55) as string[], x0 + 10, yy + 4.5)
      doc.setFontSize(10)
    }
  })

  TACHES.forEach((t, i) => {
    const yy = y + hauteurEntete + 9 + i * 14
    caseACocher(doc, xSeparation + 4, yy, d.taches.includes(t.cle))
    if (t.cle === 'AUTRES') {
      doc.setFontSize(9)
      const complement = d.taches.includes('AUTRES') && d.tachesPrecision.trim() ? ` ${d.tachesPrecision.trim()}` : ''
      doc.text(doc.splitTextToSize(`Autres :${complement}`, 85) as string[], xSeparation + 10, yy)
    } else {
      doc.setFontSize(9)
      doc.text(t.label, xSeparation + 10, yy)
      doc.setFontSize(8)
      doc.text(doc.splitTextToSize(t.detail ?? '', 85) as string[], xSeparation + 10, yy + 4)
    }
  })

  // Zone de signature
  const ySignature = y + hauteurEntete + hauteurCorps + 6
  doc.setFontSize(10)
  doc.rect(MARGE, ySignature, 70, 28)
  doc.text(doc.splitTextToSize('Signature du Supérieur Hiérarchique', 66) as string[], MARGE + 2, ySignature + 5)
}

// ── Page : lettre d'engagement ──────────────────────────────────────────────

function dessinerLettreEngagement(doc: jsPDF, logo: Logo, d: DonneesDocuments) {
  doc.setFont('times', 'normal')
  doc.setLineWidth(0.2)
  let y = enTete(doc, logo, false)

  doc.setFontSize(12)
  texteSouligne(doc, "LETTRE D'ENGAGEMENT", LARGEUR_PAGE / 2, y + 4, { align: 'center' })
  y += 20

  const nomComplet = identite(d)
  doc.setFont('times', 'normal')
  doc.text('Je soussigné(e) ', MARGE + 5, y)
  const decalage = doc.getTextWidth('Je soussigné(e) ')
  doc.setFont('times', 'bold')
  doc.text(nomComplet, MARGE + 5 + decalage, y)
  doc.setFont('times', 'normal')
  y += 9

  const corps = `IM ${d.matricule}, agissant en qualité de ${libelleFonction(d)}, au sein du ${d.departement}, `
    + `m'engage à utiliser l'application ${LIBELLE_APPLICATION_LETTRE} (${APP_NAME}) en veillant à son usage personnel `
    + 'à des fins strictement professionnelles avec la préservation de la confidentialité de l\'information qui en découle '
    + 'et à éviter toute utilisation abusive.'
  const lignes = doc.splitTextToSize(corps, LARGEUR_PAGE - 2 * MARGE) as string[]
  doc.text(lignes, MARGE, y, { lineHeightFactor: 1.6 })
  y += lignes.length * 7.5 + 4

  const suite = "En cas de violation de cet engagement, je suis conscient de la possibilité de poursuite disciplinaire y afférente."
  const lignesSuite = doc.splitTextToSize(suite, LARGEUR_PAGE - 2 * MARGE) as string[]
  doc.text(lignesSuite, MARGE, y, { lineHeightFactor: 1.6 })
  y += lignesSuite.length * 7.5 + 14

  doc.text('Le responsable hiérarchique', MARGE, y)
  doc.text("L'intéressé(e)", LARGEUR_PAGE - MARGE - 10, y, { align: 'right' })
}

// ── Fichier unique ──────────────────────────────────────────────────────────

/** [NOUVEAU] remplace genererDemandeLogin et genererLettreEngagement : un seul PDF, demande en page 1, lettre en page 2. */
export async function genererDocuments(d: DonneesDocuments): Promise<void> {
  const [doc, logo] = await Promise.all([nouveauDocument(), chargerLogo()])
  dessinerDemandeLogin(doc, logo, d)
  doc.addPage()
  dessinerLettreEngagement(doc, logo, d)
  doc.save(nomFichier('documents-compte', d.matricule))
}
