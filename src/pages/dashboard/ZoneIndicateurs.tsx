import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, Users } from 'lucide-react'
import { formatDate } from '@/utils/date'
import { nombreFr, pluriel } from '@/utils/dashboard'
import { CarteKpi } from './CarteKpi'
import type { CompteursAlertes, EcheancesAVenirDTO, EffectifsDTO, EtatChargement, Urgences } from '@/types/dashboard'
import type { SyntheseDossiers } from '@/types/dossier'

const LIEN = 'font-medium text-accent hover:underline'
interface ZoneIndicateursProps {
  effectifs: EtatChargement<EffectifsDTO>; synthese: EtatChargement<SyntheseDossiers>; urgences: EtatChargement<Urgences>
  alertes: EtatChargement<CompteursAlertes>; echeances: EtatChargement<EcheancesAVenirDTO>
}

export function ZoneIndicateurs({ effectifs, synthese, urgences, alertes, echeances }: ZoneIndicateursProps) {
  const e = effectifs.data; const s = synthese.data; const a = alertes.data; const ech = echeances.data
  const retards = s?.enRetard ?? null
  const plusAncien = urgences.data?.mode === 'RETARD' ? urgences.data.page.content[0]?.joursRetard ?? null : null
  return <section aria-label="Indicateurs" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <CarteKpi libelle="Effectif total" icone={Users} valeur={e?.total ?? null}
      aide="Agents en activité (situation administrative « 00 » ou non renseignée). F : fonctionnaires, C : contractuels."
      precision={e ? <>agents en activité<br />F {nombreFr(e.fonctionnaires)} · C {nombreFr(e.contractuels)} · ELD {nombreFr(e.eld)}{e.statutNonRenseigne > 0 && <> · {nombreFr(e.statutNonRenseigne)} sans statut</>}</> : undefined}
      chargement={effectifs.isLoading && !e} erreur={effectifs.error} onReessayer={effectifs.reload} />
    <CarteKpi libelle="Dossiers en retard" icone={retards === 0 ? CheckCircle2 : AlertTriangle}
      ton={retards === 0 ? 'succes' : (retards ?? 0) > 0 ? 'danger' : 'neutre'} valeur={retards}
      aide="Échéance dépassée et dossier non démarré" precision={retards === 0 ? 'Aucun retard' : plusAncien != null ? `le plus ancien : ${pluriel(plusAncien, 'jour', 'jours')}` : undefined}
      to="/anticipation/dossiers?vue=EN_RETARD" pied={s?.aRelancer ? <Link to="/anticipation/dossiers?vue=EN_COURS" className={LIEN}>{pluriel(s.aRelancer, 'dossier', 'dossiers')} en cours à relancer</Link> : undefined}
      chargement={synthese.isLoading && !s} erreur={synthese.error} onReessayer={synthese.reload} />
    <CarteKpi libelle="Alertes nouvelles" icone={Bell} valeur={a?.nouvelles ?? null}
      aide="Alertes du calcul de nuit qui n'ont pas encore été ouvertes" to="/anticipation/alertes"
      pied={a ? a.anomalies > 0 ? <Link to="/anticipation/alertes?type=ANOMALIE" className={LIEN}>dont {pluriel(a.anomalies, 'anomalie', 'anomalies')}</Link> : <span className="text-[#6B7180]">dont 0 anomalie</span> : undefined}
      chargement={alertes.isLoading && !a} erreur={alertes.error} onReessayer={alertes.reload} />
    <CarteKpi libelle="Échéances à venir" icone={CalendarClock} valeur={ech?.total ?? null}
      aide={ech ? `Toutes catégories, selon la date d'échéance, du ${formatDate(ech.du)} au ${formatDate(ech.au)}. Le calendrier affiche le mois civil : ses totaux diffèrent.` : "Toutes catégories, selon la date d'échéance."}
      precision={ech ? `dans les ${ech.jours} prochains jours` : undefined} to="/anticipation/calendrier?critere=ECHEANCE"
      chargement={echeances.isLoading && !ech} erreur={echeances.error} onReessayer={echeances.reload} />
  </section>
}
