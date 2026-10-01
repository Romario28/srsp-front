import type { ImportKey } from '@/types/import'

export type Repere = 'cle' | 'calcul' | 'affichage'
export type Gravite = 'haute' | 'moyenne' | 'info'
export interface ColonneSpec { nom: string; detail?: string; repere?: Repere }
export interface ImportSpec {
  cle: ImportKey; etape: 1 | 2 | 3; titre: string; resume: string; lecture: 'position' | 'entetes'
  colonnes: ColonneSpec[]; regles: string[]; prerequis: ImportKey[]; prerequisFacultatifs?: ImportKey[]
  apresImport: string; signaleDoublons: boolean; signaleReferences: boolean
}

export const REGLES_COMMUNES = [
  'Fichier Excel (.xlsx ou .xls), 50 Mo maximum. Seule la première feuille est lue ; la première ligne contient les en-têtes.',
  'Un import crée ou met à jour chaque ligne selon sa clé ; il ne supprime jamais rien. Réimporter un fichier corrigé ne crée pas de doublons.',
  'Une ligne en erreur n’est pas enregistrée, les autres le sont. Le compte-rendu liste ces lignes.',
  'Codes à saisir en texte, zéros initiaux compris (« 00 », « 09 »). Les cellules à formule ne sont pas lues : utilisez des valeurs.',
]
export const ETAPES = [
  { numero: 1, titre: 'Référentiels', description: 'À importer en premier, dans l’ordre de votre choix.' },
  { numero: 2, titre: 'Indices grade × corps', description: 'Nécessite les grades et les corps. Porte la durée requise qui pilote les avancements et titularisations.' },
  { numero: 3, titre: 'Agents', description: 'À importer en dernier : chaque agent est rattaché aux références déjà présentes.' },
] as const

const SANS_INCIDENCE = 'Sans incidence sur les échéances. Pour rattacher des agents déjà importés aux nouveaux codes, réimportez le fichier agents.'
const REIMPORT_APRES_GRADE_CORPS = 'Sans effet immédiat sur les échéances. Les agents déjà importés ne sont pas rattachés automatiquement aux nouveaux codes : réimportez ensuite les indices grade × corps, puis le fichier agents.'
const NUIT = 'Les écrans de consultation (calcul à la demande) sont à jour immédiatement ; le fil d’alertes l’est à partir du prochain passage de nuit (03h00 par défaut).'

export const IMPORT_SPECS: ImportSpec[] = [
  { cle: 'grade', etape: 1, titre: 'Grades', resume: 'Liste des grades. Le grade de stagiaire (ST0E par défaut) donne son intitulé « titularisation » à l’échéance.', lecture: 'position', colonnes: [
    { nom: 'Colonne A', detail: 'Code du grade — 10 caractères max (ex. ST0E, 1A).', repere: 'cle' }, { nom: 'Colonne B', detail: 'Libellé — 100 caractères max.' },
  ], regles: ['Les codes sont comparés tels quels, casse comprise : « st0e » n’est pas « ST0E ».', 'Un code répété dans le fichier : la dernière ligne l’emporte (signalé dans le compte-rendu).'], prerequis: [], apresImport: REIMPORT_APRES_GRADE_CORPS, signaleDoublons: true, signaleReferences: false },
  { cle: 'corps', etape: 1, titre: 'Corps', resume: 'Corps de fonction, identifiés par le couple code + catégorie.', lecture: 'entetes', colonnes: [
    { nom: 'corps', detail: 'Code du corps — 10 caractères max.', repere: 'cle' }, { nom: 'categorie', detail: 'Catégorie — 10 caractères max. Un seul chiffre est complété d’un zéro (1 devient 01).', repere: 'cle' }, { nom: 'libelle', detail: 'Libellé — 150 caractères max.' },
  ], regles: ['Le même code de corps peut exister dans plusieurs catégories : c’est le couple qui est unique.', 'Une ligne sans code ou sans catégorie est ignorée, sans message.', 'Même notion, trois noms d’en-tête : « categorie » ici, « CATEGORIE_CODE » dans les indices, « CATEGORIE » dans les agents.'], prerequis: [], apresImport: REIMPORT_APRES_GRADE_CORPS, signaleDoublons: true, signaleReferences: false },
  { cle: 'sanction', etape: 1, titre: 'Situations administratives', resume: 'Codes de situation (sanction). « 00 » = en activité ; tout autre code = hors activité.', lecture: 'position', colonnes: [
    { nom: 'Colonne A', detail: 'Code — 5 caractères max. Un seul chiffre est complété d’un zéro (0 devient 00, 9 devient 09).', repere: 'cle' }, { nom: 'Colonne B', detail: 'Libellé — 100 caractères max.' },
  ], regles: ['« 00 » est le seul code « en activité ». Un agent avec un autre code disparaît des calculs et des alertes ; un agent sans code est réputé en activité.', 'Le fichier agents doit utiliser les mêmes codes. Un code absent de ce référentiel fait traiter l’agent comme actif.'], prerequis: [], apresImport: 'Un agent déjà importé dont la situation n’avait pas été reconnue reste « sans situation » (donc réputé en activité) tant que le fichier agents n’est pas réimporté.', signaleDoublons: false, signaleReferences: false },
  { cle: 'soa', etape: 1, titre: 'SOA', resume: 'Référentiel SOA, rattaché à l’agent à titre d’information.', lecture: 'position', colonnes: [{ nom: 'Colonne A', detail: 'Code — 20 caractères max.', repere: 'cle' }, { nom: 'Colonne B', detail: 'Libellé — 150 caractères max.' }], regles: ['Un code répété dans le fichier : la dernière ligne l’emporte (signalé).'], prerequis: [], apresImport: SANS_INCIDENCE, signaleDoublons: true, signaleReferences: false },
  { cle: 'localite', etape: 1, titre: 'Localités', resume: 'Localités (FIV), rattachées à l’agent à titre d’information.', lecture: 'position', colonnes: [{ nom: 'Colonne A', detail: 'NOM de la localité — 100 caractères max. Attention : le nom vient avant le code.' }, { nom: 'Colonne B', detail: 'CODE de la localité — 10 caractères max.', repere: 'cle' }], regles: ['Le fichier est dédoublonné sur le code : une localité répétée n’est enregistrée qu’une fois.', 'Quand un code est répété, la première ligne est conservée, sans signalement dans le compte-rendu.'], prerequis: [], apresImport: SANS_INCIDENCE, signaleDoublons: false, signaleReferences: false },
  { cle: 'ministere', etape: 1, titre: 'Ministères', resume: 'Ministères, rattachés à l’agent à titre d’information.', lecture: 'position', colonnes: [{ nom: 'Colonne A', detail: 'Code — 5 caractères max. Un seul chiffre est complété d’un zéro.', repere: 'cle' }, { nom: 'Colonne B', detail: 'Libellé — 150 caractères max.' }], regles: ['Le fichier agents doit utiliser les mêmes codes (colonne MIN_CODE).'], prerequis: [], apresImport: SANS_INCIDENCE, signaleDoublons: false, signaleReferences: false },
  { cle: 'hee', etape: 1, titre: 'HEE', resume: 'Référentiel HEE, rattaché à l’agent à titre d’information.', lecture: 'position', colonnes: [{ nom: 'Colonne A', detail: 'Code — 10 caractères max.', repere: 'cle' }, { nom: 'Colonne B', detail: 'Libellé — 150 caractères max.' }], regles: ['Un code répété dans le fichier : la dernière ligne l’emporte (signalé).'], prerequis: [], apresImport: SANS_INCIDENCE, signaleDoublons: true, signaleReferences: false },
  { cle: 'indice-grade-corps', etape: 2, titre: 'Indices grade × corps', resume: 'Indice et durée requise de chaque couple grade / corps : c’est la durée qui donne l’échéance d’avancement.', lecture: 'entetes', colonnes: [
    { nom: 'GRADE_CODE', detail: 'Doit exister dans les grades.', repere: 'cle' }, { nom: 'CORPS_CODE', detail: 'Doit exister dans les corps.', repere: 'cle' }, { nom: 'CATEGORIE_CODE', detail: 'Catégorie du corps. Un seul chiffre est complété d’un zéro.', repere: 'cle' }, { nom: 'INDICE', detail: 'Indice — 20 caractères max.' }, { nom: 'DUREE_REQUISE', detail: 'Facultative. Années, nombre entier. Échéance = dernier avancement + cette durée.', repere: 'calcul' },
  ], regles: ['Même table pour tous les statuts : les paliers ELD (grades « MJ… ») y ont leur durée comme les autres.', 'Un couple dont le grade ou le corps est absent des référentiels est ignoré et signalé.', 'Une durée vide ou illisible n’écrase jamais une durée déjà enregistrée ; sur une nouvelle ligne elle reste vide, et l’agent sortira en anomalie « Durée requise non renseignée ».', 'La colonne DUREE_REQUISE peut être absente du fichier : elle est alors ignorée.'], prerequis: ['grade', 'corps'], apresImport: NUIT, signaleDoublons: false, signaleReferences: true },
  { cle: 'agents', etape: 3, titre: 'Agents', resume: 'Les agents suivis par l’anticipation. Alimentés uniquement par import : une donnée erronée se corrige par un nouvel import.', lecture: 'entetes', colonnes: [
    { nom: 'AGENT_MATRICULE', detail: 'Clé — 6 caractères max. Ligne ignorée si vide.', repere: 'cle' }, { nom: 'AGENT_NOM' }, { nom: 'AGENT_PRENOMS' }, { nom: 'AGENT_DATE_NAIS', detail: 'Date de naissance : départ à la retraite.', repere: 'calcul' }, { nom: 'AGENT_CIN', detail: '20 caractères max.' }, { nom: 'AGENT_SEXE', detail: '1 caractère.' }, { nom: 'STATUT', detail: 'FONCTIONNAIRE, CONTRACTUEL ou ELD. Toute autre valeur donne « Non renseigné ».', repere: 'affichage' }, { nom: 'CORPS_CODE', repere: 'calcul' }, { nom: 'CATEGORIE', detail: 'Catégorie du corps. Un seul chiffre est complété d’un zéro.', repere: 'calcul' }, { nom: 'GRADE_CODE', repere: 'calcul' }, { nom: 'INDICE' }, { nom: 'SANCTION_CODE', detail: '« 00 » ou vide = en activité ; tout autre code = hors activité.', repere: 'calcul' }, { nom: 'AVANCE_DATE', detail: 'Date du dernier avancement : point de départ de l’échéance.', repere: 'calcul' }, { nom: 'POSTE_AGENT_DATE_DEBUT_CONTRAT', detail: 'Point de départ de repli quand AVANCE_DATE est vide.', repere: 'calcul' }, { nom: 'POSTE_AGENT_DATE_FIN_CONTRAT', detail: 'Fin de contrat. Vide = durée indéterminée : aucune échéance.', repere: 'calcul' }, { nom: 'POSTE_AGENT_NUMERO', detail: '7 caractères max.' }, { nom: 'HEE_CODE' }, { nom: 'HEE_CATEGORIE_CODE' }, { nom: 'SECTION_CODE' }, { nom: 'FIV_CODE', detail: 'Code localité.' }, { nom: 'SOA' }, { nom: 'REG_CODE' }, { nom: 'MIN_CODE', detail: 'Code ministère.' },
  ], regles: ['Les 23 colonnes doivent figurer dans le fichier (l’en-tête suffit). S’il en manque une, l’import est refusé en entier.', 'Une ligne = un agent, identifié par AGENT_MATRICULE. Réimporter met à jour l’agent existant ; aucun agent n’est supprimé.', 'Réimporter remplace toutes les valeurs de l’agent : une cellule vide efface la valeur précédente, dates comprises.', 'Dates : cellules au format date Excel, ou texte aaaa-mm-jj. Tout autre format est lu comme vide.', 'Une référence absente n’arrête pas l’import : le champ reste vide et le compte-rendu le signale.', 'Un matricule répété dans le fichier : la dernière ligne l’emporte (signalé).'], prerequis: ['grade', 'corps', 'sanction', 'indice-grade-corps'], prerequisFacultatifs: ['hee', 'localite', 'soa', 'ministere'], apresImport: NUIT, signaleDoublons: true, signaleReferences: true },
]

export function titreImport(cle: ImportKey): string { return IMPORT_SPECS.find((spec) => spec.cle === cle)?.titre ?? cle }
export interface DescriptionReference { label: string; gravite: Gravite; consequence: string }
const INFO = 'Le champ est laissé vide sur la fiche de l’agent. Sans incidence sur les échéances.'
const REFERENCES_AGENTS: Partial<Record<string, DescriptionReference>> = {
  sanction_code: { label: 'Situation administrative', gravite: 'haute', consequence: 'L’agent est créé sans situation : il est réputé EN ACTIVITÉ. Si ce code correspond à une sortie, il sera suivi à tort : retraite, avancement, alertes. Vérifiez les codes texte (« 09 » et non 9) et le référentiel des situations.' },
  'corps_code+categorie': { label: 'Corps + catégorie', gravite: 'moyenne', consequence: 'L’agent est créé sans corps : anomalie « Corps manquant », aucun avancement ni titularisation calculé. Retraite et fin de contrat restent calculées. Exemples au format code|catégorie.' },
  grade_code: { label: 'Grade', gravite: 'moyenne', consequence: 'L’agent est créé sans grade : anomalie « Grade manquant », aucun avancement ni titularisation calculé. Retraite et fin de contrat restent calculées.' },
  hee_code: { label: 'HEE', gravite: 'info', consequence: INFO }, fiv_code: { label: 'Localité (FIV)', gravite: 'info', consequence: INFO }, soa: { label: 'SOA', gravite: 'info', consequence: INFO }, min_code: { label: 'Ministère', gravite: 'info', consequence: INFO },
}
const REFERENCES_INDICES: Partial<Record<string, DescriptionReference>> = {
  grade_code: { label: 'Grade', gravite: 'moyenne', consequence: 'Ligne ignorée : ce couple n’aura pas de durée requise. Les agents concernés sortiront en anomalie « Durée requise non renseignée ». Importez le grade, puis réimportez ce fichier.' },
  'corps_code+categorie': { label: 'Corps + catégorie', gravite: 'moyenne', consequence: 'Ligne ignorée : ce couple n’aura pas de durée requise. Les agents concernés sortiront en anomalie « Durée requise non renseignée ». Importez le corps, puis réimportez ce fichier. Exemples au format code|catégorie.' },
}
export function decrireReference(cle: ImportKey, champ: string): DescriptionReference {
  const table = cle === 'agents' ? REFERENCES_AGENTS : cle === 'indice-grade-corps' ? REFERENCES_INDICES : undefined
  return table?.[champ] ?? { label: champ, gravite: 'info', consequence: 'Valeur non rattachée à un référentiel.' }
}
export const CONSEQUENCE_DOUBLONS = 'La même clé apparaît plusieurs fois dans le fichier : la dernière ligne l’emporte, les précédentes sont écrasées. Chaque occurrence en plus est généralement comptée comme une mise à jour. Vérifiez qu’il ne s’agit pas d’une erreur de saisie.'
