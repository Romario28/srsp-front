import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { importsApi } from '@/api/imports'
import { estErreurReseau, extractErrorMessage } from '@/api/client'
import { ETAPES, IMPORT_SPECS, REGLES_COMMUNES } from './importSpecs'
import { analyserRapport } from './rapport'
import { ImportCard } from './ImportCard'
import type { EtatImport, ImportKey } from '@/types/import'

export function ImportsPage() {
  const [ouvert, setOuvert] = useState<ImportKey | null>('grade')
  const [fichiers, setFichiers] = useState<Partial<Record<ImportKey, File | null>>>({})
  const [etats, setEtats] = useState<Partial<Record<ImportKey, EtatImport>>>({})
  const cleEnCours = IMPORT_SPECS.find((spec) => etats[spec.cle]?.phase === 'envoi')?.cle ?? null

  useEffect(() => {
    if (!cleEnCours) return
    const garde = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', garde)
    return () => window.removeEventListener('beforeunload', garde)
  }, [cleEnCours])

  const faits = useMemo(() => new Set(IMPORT_SPECS.filter((spec) => {
    const etat = etats[spec.cle]
    return etat?.phase === 'termine' && etat.rapport != null && !analyserRapport(etat.rapport, spec.cle).illisible
  }).map((spec) => spec.cle)), [etats])
  const majEtat = (cle: ImportKey, etat: EtatImport) => setEtats((current) => ({ ...current, [cle]: etat }))

  const importer = async (cle: ImportKey) => {
    const fichier = fichiers[cle]
    if (!fichier || cleEnCours) return
    const debut = Date.now()
    const base = { fichierNom: fichier.name, debut }
    majEtat(cle, { phase: 'envoi', ...base })
    try {
      const rapport = await importsApi.importer(cle, fichier)
      majEtat(cle, { phase: 'termine', ...base, dureeMs: Date.now() - debut, rapport })
      setFichiers((current) => ({ ...current, [cle]: null }))
    } catch (err) {
      majEtat(cle, { phase: 'echec', ...base, dureeMs: Date.now() - debut, erreur: extractErrorMessage(err, 'Import impossible'), erreurReseau: estErreurReseau(err) })
    }
  }

  return <div className="flex flex-col gap-6">
    <div><h1 className="font-display text-[20px] font-semibold text-ink">Imports de référentiels</h1><p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">Les agents suivis par l’anticipation ne se saisissent pas à l’écran : ils arrivent par import, et une donnée erronée se corrige par un nouvel import. L’ordre compte : référentiels, puis indices grade × corps, puis agents.</p></div>
    <div className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark"><Info className="mt-0.5 h-4 w-4 flex-shrink-0" /><ul className="list-disc space-y-1 pl-4">{REGLES_COMMUNES.map((regle) => <li key={regle}>{regle}</li>)}</ul></div>
    {ETAPES.map((etape) => <section key={etape.numero} className="flex flex-col gap-3">
      <div className="flex items-start gap-3"><span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">{etape.numero}</span><div><h2 className="font-display text-[15px] font-semibold text-ink">{etape.titre}</h2><p className="text-[12.5px] text-[#6B7180]">{etape.description}</p></div></div>
      <div className="flex flex-col gap-3">{IMPORT_SPECS.filter((spec) => spec.etape === etape.numero).map((spec) => <ImportCard
        key={spec.cle} spec={spec} ouvert={ouvert === spec.cle} onToggle={() => setOuvert((current) => current === spec.cle ? null : spec.cle)}
        fichier={fichiers[spec.cle] ?? null} onFichier={(fichier) => setFichiers((current) => ({ ...current, [spec.cle]: fichier }))}
        etat={etats[spec.cle]} occupe={cleEnCours != null} faits={faits} onImporter={() => importer(spec.cle)}
      />)}</div>
    </section>)}
  </div>
}
