import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { BlocDashboard, VoirEnTableau } from './BlocDashboard'
import { Barres, type ColonneBarre } from './Barres'
import { moisCourt, moisLong, nombreFr, pluriel } from '@/utils/dashboard'
import { lienAvecPortee } from '@/utils/filtresAgents'
import type { FiltresAgents } from '@/types/anticipation'
import type { EffectifsDTO, EtatChargement } from '@/types/dashboard'

type Mode = 'MOIS' | 'ANNEES'
const OPTIONS: { value: Mode; label: string }[] = [{ value: 'MOIS', label: '12 mois' }, { value: 'ANNEES', label: '5 ans' }]
const COULEUR = '#2A6F97'

export function GraphiqueRetraites({ etat, portee, className }: { etat: EtatChargement<EffectifsDTO>; portee: FiltresAgents; className?: string }) {
  const [mode, setMode] = useState<Mode>('MOIS')
  const r = etat.data?.retraites ?? null
  const periodes = r ? mode === 'MOIS' ? r.mois : r.annees : []
  const total = periodes.reduce((s, p) => s + p.nombre, 0)
  const debutAnnee = r?.depuis.slice(0, 4)
  const premiereAnneePartielle = r != null && r.depuis.slice(5, 7) !== '01'
  let cumul = 0
  const lignesTableau: (string | number)[][] = []
  const colonnes: ColonneBarre[] = periodes.map((p, i) => {
    cumul += p.nombre
    const partielle = mode === 'ANNEES' && p.cle === debutAnnee && premiereAnneePartielle
    const titreLong = mode === 'MOIS' ? moisLong(p.cle) : p.cle
    lignesTableau.push([titreLong, p.nombre, cumul])
    return { cle: p.cle, segments: [{ valeur: p.nombre, couleur: COULEUR }], compte: p.nombre,
      etiquette: mode === 'MOIS' ? moisCourt(p.cle) + (i === 0 || p.cle.endsWith('-01') ? ` ${p.cle.slice(2, 4)}` : '') : p.cle,
      infobulle: `${titreLong} · ${pluriel(p.nombre, 'départ', 'départs')} · cumul ${nombreFr(cumul)}${partielle && r ? ` · année partielle (à partir de ${moisLong(r.depuis.slice(0, 7)).toLowerCase()})` : ''}` }
  })
  const actions = <SegmentedControl options={OPTIONS} value={mode} onChange={setMode} ariaLabel="Période de la projection" />
  return <BlocDashboard titre="Départs à la retraite" actions={actions} className={className}
    aide="Agents en activité, selon leur date de départ à la retraite (naissance + âge légal). Un départ est une date, pas une urgence."
    chargement={etat.isLoading && !etat.data} erreur={etat.error} onReessayer={etat.reload}>
    {r && <>
      <Barres colonnes={colonnes} ariaLabel={`Départs à la retraite : ${pluriel(total, 'départ', 'départs')} sur la période`} />
      <div className="flex flex-col gap-1 text-[12px] text-[#6B7180]"><p>Cumul sur la période : <span className="font-semibold text-ink">{nombreFr(total)}</span></p>
        {r.dejaAtteint > 0 && <p>Date de retraite déjà passée : {pluriel(r.dejaAtteint, 'agent', 'agents')} (hors graphique)</p>}</div>
      <Link to={lienAvecPortee('/anticipation/retraite', portee)} className="text-[12.5px] font-medium text-accent hover:underline">Voir les départs à la retraite →</Link>
      <VoirEnTableau colonnes={['Période', 'Départs', 'Cumul']} lignes={lignesTableau} />
    </>}
  </BlocDashboard>
}
