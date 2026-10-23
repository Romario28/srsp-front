import { useMemo, useState } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { BlocDashboard, VoirEnTableau } from './BlocDashboard'
import { Barres, type ColonneBarre } from './Barres'
import { COULEURS_SEXE, LIBELLES_SEXE, SEXES, agregerAges, categoriesDisponibles, libelleTranche, libelleTrancheLong, nombreFr, pluriel, positionAgeLegal, pourcent, valeurSexe, type BarreAge, type FiltreSexe } from '@/utils/dashboard'
import type { EffectifsDTO, EtatChargement } from '@/types/dashboard'

const OPTIONS_SEXE: { value: FiltreSexe; label: string }[] = [{ value: 'TOUS', label: 'Tous' }, { value: 'M', label: 'Hommes' }, { value: 'F', label: 'Femmes' }]
const TOUTES = '*'

export function GraphiqueAges({ etat, className }: { etat: EtatChargement<EffectifsDTO>; className?: string }) {
  const [sexe, setSexe] = useState<FiltreSexe>('TOUS'); const [categorie, setCategorie] = useState(TOUTES)
  const ages = etat.data?.ages ?? null
  const categories = useMemo(() => ages ? categoriesDisponibles(ages.lignes) : [], [ages])
  const categorieActive = categorie === TOUTES || categories.includes(categorie) ? categorie : TOUTES
  const barres = useMemo(() => ages ? agregerAges(ages.lignes, sexe, categorieActive === TOUTES ? null : categorieActive, ages.bornes) : [], [ages, sexe, categorieActive])
  const affiches = barres.reduce((s, b) => s + b.total, 0)
  const sexesAffiches = SEXES.filter((s) => s !== '?' || barres.some((b) => b.inconnu > 0))
  const detail = (b: BarreAge) => sexe === 'TOUS' ? sexesAffiches.map((s) => `${LIBELLES_SEXE[s]} ${nombreFr(valeurSexe(b, s))}`).join(' · ') + ' · ' : ''
  const colonnes: ColonneBarre[] = ages ? barres.map((b) => ({
    cle: String(b.tranche), segments: SEXES.map((s) => ({ valeur: valeurSexe(b, s), couleur: COULEURS_SEXE[s] })), compte: b.total,
    etiquette: libelleTranche(b.tranche, ages.bornes),
    infobulle: `${libelleTrancheLong(b.tranche, ages.bornes)} · ${detail(b)}${pluriel(b.total, 'agent', 'agents')} (${pourcent(b.total, affiches)} %)`,
  })) : []
  const filtres = <div className="flex flex-wrap items-center gap-2">
    <SegmentedControl options={OPTIONS_SEXE} value={sexe} onChange={setSexe} ariaLabel="Filtrer par sexe" />
    <select value={categorieActive} onChange={(e) => setCategorie(e.target.value)} aria-label="Filtrer par catégorie" className="h-9 rounded-lg border border-[#DADCE3] bg-white px-3 text-[13px] text-ink focus:border-accent">
      <option value={TOUTES}>Toutes catégories</option>{categories.map((c) => <option key={c} value={c}>{c === '' ? 'Sans corps' : `Catégorie ${c}`}</option>)}
    </select>
  </div>
  return <BlocDashboard titre="Répartition des âges" actions={filtres} className={className}
    aide="Agents en activité, âge en années révolues à la date du jour. Les agents sans date de naissance ne sont pas comptés."
    chargement={etat.isLoading && !etat.data} erreur={etat.error} onReessayer={etat.reload}>
    {ages && <>
      <Barres colonnes={colonnes} repere={positionAgeLegal(ages.ageLegal, ages.bornes)} ariaLabel={`Répartition des âges : ${pluriel(affiches, 'agent', 'agents')} dans la sélection`} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6B7180]">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-3 border-l-2 border-dashed border-[#6B7180]/60" />âge légal : {ages.ageLegal} ans</span>
        {sexe === 'TOUS' && sexesAffiches.map((s) => <span key={s} className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COULEURS_SEXE[s] }} />{LIBELLES_SEXE[s]}</span>)}
      </div>
      <p className="text-[12px] text-[#6B7180]">{pluriel(affiches, 'agent', 'agents')} dans la sélection{ages.sansDateNaissance > 0 && ` · ${nombreFr(ages.sansDateNaissance)} sans date de naissance (non comptés)`}</p>
      <VoirEnTableau colonnes={['Tranche', 'Hommes', 'Femmes', 'Non renseigné', 'Total']} lignes={barres.map((b) => [libelleTrancheLong(b.tranche, ages.bornes), b.M, b.F, b.inconnu, b.total])} />
    </>}
  </BlocDashboard>
}
