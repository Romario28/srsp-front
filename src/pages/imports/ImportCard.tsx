import { useEffect, useState } from 'react'
import { ChevronRight, Loader2, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FileDropzone } from '@/components/ui/FileDropzone'
import { formatDureeMs } from '@/utils/date'
import { analyserRapport } from './rapport'
import { RapportImportView } from './RapportImportView'
import { titreImport, type ImportSpec, type Repere } from './importSpecs'
import type { EtatImport, ImportKey } from '@/types/import'

const REPERES: Record<Repere, { label: string; tone: 'accent' | 'neutral' }> = {
  cle: { label: 'Clé', tone: 'neutral' }, calcul: { label: 'Pilote les échéances', tone: 'accent' }, affichage: { label: 'Classement à l’écran', tone: 'neutral' },
}
function Chrono({ depuis }: { depuis: number }) {
  const [, setTick] = useState(0)
  useEffect(() => { const interval = window.setInterval(() => setTick((tick) => tick + 1), 1000); return () => window.clearInterval(interval) }, [])
  return <span className="font-medium tabular-nums">{formatDureeMs(Date.now() - depuis)}</span>
}
function BadgeEtat({ etat, cle }: { etat: EtatImport | undefined; cle: ImportKey }) {
  if (!etat) return null
  if (etat.phase === 'envoi') return <Badge tone="accent">En cours…</Badge>
  if (etat.phase === 'echec') return <Badge tone="danger">Échec</Badge>
  const verdict = etat.rapport ? analyserRapport(etat.rapport, cle).verdict : 'ok'
  if (verdict === 'echec') return <Badge tone="danger">Fichier illisible</Badge>
  return verdict === 'ok' ? <Badge tone="success">Importé</Badge> : <Badge tone="warning">Importé — à vérifier</Badge>
}
function ListePrerequis({ titre, cles, faits }: { titre: string; cles: ImportKey[]; faits: ReadonlySet<ImportKey> }) {
  return <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]"><span className="font-medium text-ink">{titre}</span>{cles.map((cle) => <Badge key={cle} tone={faits.has(cle) ? 'success' : 'neutral'}>{titreImport(cle)}{faits.has(cle) ? ' ✓' : ''}</Badge>)}</div>
}
interface ImportCardProps {
  spec: ImportSpec; ouvert: boolean; onToggle: () => void; fichier: File | null; onFichier: (fichier: File | null) => void
  etat: EtatImport | undefined; occupe: boolean; faits: ReadonlySet<ImportKey>; onImporter: () => void
}

export function ImportCard({ spec, ouvert, onToggle, fichier, onFichier, etat, occupe, faits, onImporter }: ImportCardProps) {
  const enCours = etat?.phase === 'envoi'
  const idCorps = `import-${spec.cle}`
  return <div className="rounded-xl border border-[#E4E6EB] bg-white">
    <button type="button" onClick={onToggle} aria-expanded={ouvert} aria-controls={idCorps} className="flex w-full items-center gap-3 px-5 py-4 text-left">
      <ChevronRight className={`h-4 w-4 flex-shrink-0 text-[#9CA0AC] transition-transform ${ouvert ? 'rotate-90' : ''}`} /><div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-ink">{spec.titre}</p><p className={`text-[12.5px] text-[#6B7180] ${ouvert ? '' : 'truncate'}`}>{spec.resume}</p></div><BadgeEtat etat={etat} cle={spec.cle} />
    </button>
    {ouvert && <div id={idCorps} className="flex flex-col gap-5 border-t border-[#EAEBF0] px-5 py-5">
      <div><h3 className="text-[13px] font-semibold text-ink">Format attendu</h3><p className="mt-0.5 text-[12.5px] text-[#6B7180]">{spec.lecture === 'position' ? 'Colonnes lues par position : les en-têtes de la première ligne sont ignorés, seul l’ordre compte.' : 'Colonnes repérées par le nom de leur en-tête (casse indifférente). L’ordre n’a pas d’importance et les colonnes en plus sont ignorées.'}</p>
        <ul className="mt-3 grid gap-x-6 gap-y-2.5 md:grid-cols-2">{spec.colonnes.map((colonne) => <li key={colonne.nom} className="flex min-w-0 flex-col gap-0.5 text-[12.5px]"><div className="flex flex-wrap items-center gap-1.5"><span className="font-mono text-[12px] font-medium text-ink">{colonne.nom}</span>{colonne.repere && <Badge tone={REPERES[colonne.repere].tone}>{REPERES[colonne.repere].label}</Badge>}</div>{colonne.detail && <span className="text-[#6B7180]">{colonne.detail}</span>}</li>)}</ul>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-[#4B4F5A]">{spec.regles.map((regle) => <li key={regle}>{regle}</li>)}</ul>
      {spec.prerequis.length > 0 && <div className="flex flex-col gap-2"><ListePrerequis titre="À importer avant :" cles={spec.prerequis} faits={faits} />{spec.prerequisFacultatifs && <ListePrerequis titre="Facultatifs (sans incidence sur les échéances) :" cles={spec.prerequisFacultatifs} faits={faits} />}<p className="text-[11.5px] text-[#9CA0AC]">✓ = importé pendant cette session. L’écran ne sait pas ce qui a été importé auparavant.</p></div>}
      <div className="flex flex-col gap-3"><FileDropzone file={fichier} onChange={onFichier} maxSizeMo={50} disabled={occupe} hint="Excel (.xlsx, .xls) · 50 Mo maximum" /><div className="flex justify-end"><Button icon={<Upload className="h-4 w-4" />} onClick={onImporter} disabled={!fichier || occupe} isLoading={enCours}>Lancer l’import</Button></div></div>
      {etat?.phase === 'envoi' && <div className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark"><Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 animate-spin" /><span>Import de « {etat.fichierNom} » en cours — <Chrono depuis={etat.debut} />. Il n’y a pas de progression : une seule requête traite tout le fichier. Gardez cette page ouverte : si vous la quittez, l’import va au bout côté serveur mais ce compte-rendu est perdu.</span></div>}
      {etat?.phase === 'echec' && <div className="flex flex-col gap-2"><ErrorBanner message={etat.erreur ?? 'Import impossible'} /><p className="text-[12.5px] text-[#6B7180]">{etat.erreurReseau ? 'La connexion a été interrompue : l’import a peut-être abouti côté serveur. Relancer est sans danger (mise à jour par clé), mais vérifiez d’abord les écrans concernés.' : 'Rien n’a été enregistré : l’import est annulé en entier. Corrigez le fichier, puis relancez.'}</p></div>}
      {etat?.phase === 'termine' && etat.rapport && <RapportImportView rapport={etat.rapport} spec={spec} fichierNom={etat.fichierNom} dureeMs={etat.dureeMs ?? 0} />}
    </div>}
  </div>
}
