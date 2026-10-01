import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Copy, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDureeMs } from '@/utils/date'
import { analyserRapport } from './rapport'
import { CONSEQUENCE_DOUBLONS, type Gravite, type ImportSpec } from './importSpecs'
import type { RapportImport } from '@/types/import'

const MAX_ERREURS_VISIBLES = 20
const MAX_DOUBLONS_VISIBLES = 10
const BANDEAUX = {
  ok: { Icone: CheckCircle2, classes: 'border-success/30 bg-success-light text-success', titre: 'Import terminé sans réserve' },
  reserves: { Icone: AlertTriangle, classes: 'border-warning/30 bg-warning-light text-warning', titre: 'Import terminé — points à vérifier' },
  echec: { Icone: XCircle, classes: 'border-danger/30 bg-danger-light text-danger', titre: 'Fichier illisible — rien n’a été importé' },
} as const
const GRAVITES: Record<Gravite, { tone: 'danger' | 'warning' | 'neutral'; label: string }> = {
  haute: { tone: 'danger', label: 'Risque de calcul erroné' }, moyenne: { tone: 'warning', label: 'Génère des anomalies' }, info: { tone: 'neutral', label: 'Sans incidence sur les échéances' },
}
function Chiffre({ label, valeur, sub, tone = 'neutral' }: { label: string; valeur: number; sub?: string; tone?: 'neutral' | 'warning' | 'danger' }) {
  const couleur = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-ink'
  return <div className="rounded-lg border border-[#E4E6EB] bg-white px-4 py-3"><p className={`font-display text-[20px] font-semibold leading-none ${couleur}`}>{valeur.toLocaleString('fr-FR')}</p><p className="mt-1.5 text-[12.5px] text-[#6B7180]">{label}</p>{sub && <p className="text-[11.5px] text-[#9CA0AC]">{sub}</p>}</div>
}
function Section({ titre, aide, action, children }: { titre: string; aide?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="flex flex-col gap-2.5 rounded-xl border border-[#E4E6EB] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-display text-[13.5px] font-semibold text-ink">{titre}</h4>{aide && <p className="mt-0.5 text-[12.5px] text-[#6B7180]">{aide}</p>}</div>{action}</div>{children}</section>
}

export function RapportImportView({ rapport, spec, fichierNom, dureeMs }: { rapport: RapportImport; spec: ImportSpec; fichierNom: string; dureeMs: number }) {
  const analyse = analyserRapport(rapport, spec.cle)
  const bandeau = BANDEAUX[analyse.verdict]
  const [toutesLesErreurs, setToutesLesErreurs] = useState(false)
  const [copie, setCopie] = useState(false)
  const erreursVisibles = toutesLesErreurs ? analyse.erreurs : analyse.erreurs.slice(0, MAX_ERREURS_VISIBLES)
  const copierErreurs = async () => {
    try { await navigator.clipboard.writeText(analyse.erreurs.join('\n')); setCopie(true); window.setTimeout(() => setCopie(false), 2000) }
    catch { /* Presse-papiers indisponible dans les contextes non sécurisés. */ }
  }
  const lienAnomalies = spec.cle === 'agents' || spec.cle === 'indice-grade-corps'

  return <div className="flex flex-col gap-3">
    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[13px] ${bandeau.classes}`}><bandeau.Icone className="mt-0.5 h-4 w-4 flex-shrink-0" /><div><p className="font-semibold">{bandeau.titre}</p><p>« {fichierNom} » · {formatDureeMs(dureeMs)}</p>{analyse.illisible && <p>{analyse.erreurs[0]}</p>}{analyse.vide && !analyse.illisible && <p>Aucune ligne n’a été traitée : vérifiez que la première feuille contient des données et que la colonne clé est renseignée.</p>}</div></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"><Chiffre label="Lignes traitées" valeur={rapport.lus} sub="créées + mises à jour" /><Chiffre label="Créées" valeur={rapport.crees} /><Chiffre label="Mises à jour" valeur={rapport.misAJour} /><Chiffre label="Erreurs" valeur={analyse.erreurs.length} tone={analyse.erreurs.length ? 'danger' : 'neutral'} />{spec.signaleReferences && <Chiffre label="Références inconnues" valeur={analyse.nbReferences} tone={analyse.nbReferences ? 'warning' : 'neutral'} />}{spec.signaleDoublons && <Chiffre label="Clés en double" valeur={analyse.doublons.length} tone={analyse.doublons.length ? 'warning' : 'neutral'} />}</div>
    {analyse.references.length > 0 && <Section titre="Références inconnues" aide="Le code est présent dans le fichier mais absent du référentiel. Les plus graves sont en tête."><div className="flex flex-col divide-y divide-[#EAEBF0]">{analyse.references.map((reference) => <div key={reference.champ} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center gap-2"><span className="text-[13px] font-semibold text-ink">{reference.label}</span><Badge tone={GRAVITES[reference.gravite].tone}>{GRAVITES[reference.gravite].label}</Badge><span className="text-[12.5px] text-[#6B7180]">{reference.nb.toLocaleString('fr-FR')} ligne{reference.nb > 1 ? 's' : ''}</span></div><p className="text-[12.5px] text-[#4B4F5A]">{reference.consequence}</p>{reference.exemples.length > 0 && <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B7180]">Exemples :{reference.exemples.map((exemple) => <code key={exemple} className="rounded bg-[#F0F1F4] px-1.5 py-0.5 font-mono text-[11.5px] text-ink">{exemple}</code>)}{reference.nb > reference.exemples.length && <span>(5 valeurs distinctes au plus)</span>}</p>}</div>)}</div></Section>}
    {analyse.doublons.length > 0 && <Section titre="Clés en double dans le fichier" aide={CONSEQUENCE_DOUBLONS}><table className="w-full max-w-md"><thead className="border-b border-[#EAEBF0]"><tr><th className="table-head-cell">Clé</th><th className="table-head-cell text-right">Occurrences</th></tr></thead><tbody className="divide-y divide-[#EAEBF0]">{analyse.doublons.slice(0, MAX_DOUBLONS_VISIBLES).map(([cle, nombre]) => <tr key={cle}><td className="table-cell font-mono text-[12.5px] text-ink">{cle}</td><td className="table-cell text-right text-[#4B4F5A]">{nombre}</td></tr>)}</tbody></table>{analyse.doublons.length > MAX_DOUBLONS_VISIBLES && <p className="text-[12px] text-[#9CA0AC]">… et {analyse.doublons.length - MAX_DOUBLONS_VISIBLES} autre(s) clé(s) en double.</p>}</Section>}
    {analyse.erreurs.length > 0 && !analyse.illisible && <Section titre={`Erreurs par ligne (${analyse.erreurs.length.toLocaleString('fr-FR')})`} aide="Ces lignes n’ont pas été enregistrées ; les autres l’ont été. Corrigez-les dans le fichier et réimportez-le." action={<Button variant="secondary" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={copierErreurs}>{copie ? 'Copié' : 'Copier'}</Button>}><ul className="max-h-72 overflow-auto rounded-lg border border-[#EAEBF0] bg-[#FAFAFB] p-3">{erreursVisibles.map((erreur, index) => <li key={index} className="py-0.5 font-mono text-[12px] text-[#4B4F5A]">{erreur}</li>)}</ul>{analyse.erreurs.length > MAX_ERREURS_VISIBLES && <button type="button" onClick={() => setToutesLesErreurs((value) => !value)} className="self-start text-[12.5px] font-medium text-accent hover:underline">{toutesLesErreurs ? 'Réduire' : `Afficher les ${analyse.erreurs.length - MAX_ERREURS_VISIBLES} autres`}</button>}</Section>}
    {!analyse.illisible && <Section titre="Après cet import"><p className="text-[12.5px] text-[#4B4F5A]">{spec.apresImport}</p>{lienAnomalies && <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]"><Link to="/anticipation/anomalies" className="font-medium text-accent hover:underline">Voir les anomalies</Link><Link to="/anticipation/alertes" className="font-medium text-accent hover:underline">Voir le fil d’alertes</Link></p>}</Section>}
  </div>
}
