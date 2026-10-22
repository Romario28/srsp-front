import { Link, useNavigate } from 'react-router-dom'
import { Infobulle } from '@/components/ui/Infobulle'
import { BlocDashboard, VoirEnTableau } from './BlocDashboard'
import { ETATS_GRAPHE, nombreFr, pluriel, pourcent } from '@/utils/dashboard'
import type { EtatChargement } from '@/types/dashboard'
import type { SyntheseDossiers, VueDossier } from '@/types/dossier'

const RAYON = 46
const EPAISSEUR = 18
const CIRCONFERENCE = 2 * Math.PI * RAYON
const lien = (vue: VueDossier) => `/anticipation/dossiers?vue=${vue}`

export function GraphiqueDossiers({ etat, className }: { etat: EtatChargement<SyntheseDossiers>; className?: string }) {
  const navigate = useNavigate()
  const s = etat.data
  const total = s ? ETATS_GRAPHE.reduce((sum, e) => sum + s[e.cle], 0) : 0
  let decalage = 0
  const segments = s ? ETATS_GRAPHE.map((e) => {
    const nb = s[e.cle]
    const longueur = total > 0 ? nb / total * CIRCONFERENCE : 0
    const segment = { ...e, nb, longueur, decalage }
    decalage += longueur
    return segment
  }) : []
  return <BlocDashboard titre="État des dossiers" className={className}
    aide="Tous les dossiers suivis. « En attente » est scindé : « En retard » (échéance dépassée) et « À traiter »."
    chargement={etat.isLoading && !s} erreur={etat.error} onReessayer={etat.reload}>
    {s && <>
      <div className="flex flex-col items-center gap-4 md:flex-row xl:flex-col xl:items-stretch">
        <svg viewBox="0 0 120 120" role="img" aria-label={`${nombreFr(total)} dossiers`} className="mx-auto h-36 w-36 flex-shrink-0 md:mx-0 xl:mx-auto">
          <circle cx="60" cy="60" r={RAYON} fill="none" stroke="#EAEBF0" strokeWidth={EPAISSEUR} />
          <g transform="rotate(-90 60 60)">{segments.filter((x) => x.nb > 0).map((x) =>
            <circle key={x.cle} cx="60" cy="60" r={RAYON} fill="none" stroke={x.couleur} strokeWidth={EPAISSEUR}
              strokeDasharray={`${x.longueur} ${CIRCONFERENCE - x.longueur}`} strokeDashoffset={-x.decalage}
              className="cursor-pointer" onClick={() => navigate(lien(x.vue))}>
              <title>{`${x.label} · ${pluriel(x.nb, 'dossier', 'dossiers')} · ${pourcent(x.nb, total)} %`}</title>
            </circle>)}</g>
          <text x="60" y="59" textAnchor="middle" className="fill-ink font-display text-[22px] font-semibold">{nombreFr(total)}</text>
          <text x="60" y="75" textAnchor="middle" className="fill-[#6B7180] text-[10px]">dossiers</text>
        </svg>
        <ul className="flex min-w-0 flex-1 flex-col gap-0.5">{segments.map((x) => {
          const Icone = x.icone
          return <li key={x.cle}><Infobulle focusable={false} align="droite" className="block" texte={`${x.label} · ${pluriel(x.nb, 'dossier', 'dossiers')} · ${pourcent(x.nb, total)} % — ${x.aide}`}>
            <Link to={lien(x.vue)} className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] hover:bg-[#F4F5F7]">
              <Icone className="h-3.5 w-3.5 flex-shrink-0" style={{ color: x.couleur }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[#4B4F5A]">{x.label}</span>
              <span className={`font-semibold tabular-nums ${x.cle === 'enRetard' && x.nb > 0 ? 'text-danger' : 'text-ink'}`}>{nombreFr(x.nb)}</span>
              <span className="w-9 text-right text-[12px] tabular-nums text-[#9CA0AC]">{pourcent(x.nb, total)} %</span>
            </Link>
          </Infobulle></li>
        })}</ul>
      </div>
      {total === 0 && <p className="text-[12.5px] text-[#6B7180]">Aucun dossier pour le moment.</p>}
      <VoirEnTableau colonnes={['État', 'Dossiers', 'Part']} lignes={segments.map((x) => [x.label, x.nb, `${pourcent(x.nb, total)} %`])} />
    </>}
  </BlocDashboard>
}
