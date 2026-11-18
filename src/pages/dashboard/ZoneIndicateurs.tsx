// SUPPRIMÉ : import { Link } from 'react-router-dom'
// SUPPRIMÉ : import { AlertTriangle, Bell, CalendarClock, CheckCircle2, Users } from 'lucide-react'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, Users } from 'lucide-react'   // MODIFIÉ : Bell → ClipboardList
import { formatDate } from '@/utils/date'
import { nombreFr, pluriel } from '@/utils/dashboard'
import { lienAvecPortee, nbFiltres } from '@/utils/filtresAgents'
import { CarteKpi } from './CarteKpi'
import type { FiltresAgents } from '@/types/anticipation'
// SUPPRIMÉ : import type { CompteursAlertes, EcheancesAVenirDTO, EffectifsDTO, EtatChargement, Urgences } from '@/types/dashboard'
import type { EcheancesAVenirDTO, EffectifsDTO, EtatChargement, Urgences } from '@/types/dashboard'   // MODIFIÉ
import type { SyntheseDossiers } from '@/types/dossier'

// SUPPRIMÉ : const LIEN = 'font-medium text-accent hover:underline'   (servait au lien « dont N anomalies »)
interface ZoneIndicateursProps {
  effectifs: EtatChargement<EffectifsDTO>; synthese: EtatChargement<SyntheseDossiers>; urgences: EtatChargement<Urgences>
  // SUPPRIMÉ : alertes: EtatChargement<CompteursAlertes>;
  echeances: EtatChargement<EcheancesAVenirDTO>; portee: FiltresAgents
}

// MODIFIÉ : le paramètre « alertes » est retiré
export function ZoneIndicateurs({ effectifs, synthese, urgences, echeances, portee }: ZoneIndicateursProps) {
  const e = effectifs.data; const s = synthese.data; const ech = echeances.data
  // SUPPRIMÉ : const a = alertes.data
  const lien = (chemin: string, extra?: Record<string, string>) => lienAvecPortee(chemin, portee, extra)
  const restreint = nbFiltres(portee) > 0
  const retards = s?.enRetard ?? null
  const plusAncien = urgences.data?.mode === 'RETARD' ? urgences.data.page.content[0]?.joursRetard ?? null : null
  return <section aria-label="Indicateurs" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
    <CarteKpi libelle="Effectif total" icone={Users} valeur={e?.total ?? null}
      aide="Agents en activité (situation administrative « 00 » ou non renseignée). F : fonctionnaires, C : contractuels."
      precision={e ? <>agents en activité{restreint && ' du périmètre'}<br />F {nombreFr(e.fonctionnaires)} · C {nombreFr(e.contractuels)} · ELD {nombreFr(e.eld)}{e.statutNonRenseigne > 0 && <> · {nombreFr(e.statutNonRenseigne)} sans statut</>}</> : undefined}
      chargement={effectifs.isLoading && !e} erreur={effectifs.error} onReessayer={effectifs.reload} />
    <CarteKpi libelle="Dossiers en retard" icone={retards === 0 ? CheckCircle2 : AlertTriangle}
      ton={retards === 0 ? 'succes' : (retards ?? 0) > 0 ? 'danger' : 'neutre'} valeur={retards}
      aide="Échéance dépassée et dossier non démarré" precision={retards === 0 ? 'Aucun retard' : plusAncien != null ? `le plus ancien : ${pluriel(plusAncien, 'jour', 'jours')}` : undefined}
      to={lien('/anticipation/dossiers', { vue: 'EN_RETARD' })}
      chargement={synthese.isLoading && !s} erreur={synthese.error} onReessayer={synthese.reload} />
    {/* SUPPRIMÉ : carte « Alertes nouvelles » (icône Bell, valeur a?.nouvelles, lien /anticipation/alertes, pied « dont N anomalies »,
        chargement={alertes.isLoading && !a} erreur={alertes.error} onReessayer={alertes.reload}) */}
    {/* AJOUTÉ */}
    <CarteKpi libelle="Dossiers à traiter" icone={ClipboardList} valeur={s?.aTraiter ?? null}
      aide="Dossiers dont la préparation est atteinte, non démarrés, et dont l'échéance n'est pas dépassée."
      precision={s ? 'à démarrer' : undefined} to={lien('/anticipation/dossiers', { vue: 'A_TRAITER' })}
      chargement={synthese.isLoading && !s} erreur={synthese.error} onReessayer={synthese.reload} />
    <CarteKpi libelle="Échéances à venir" icone={CalendarClock} valeur={ech?.total ?? null}
      aide={ech ? `Toutes catégories, selon la date d'échéance, du ${formatDate(ech.du)} au ${formatDate(ech.au)}. Le calendrier affiche le mois civil : ses totaux diffèrent.` : "Toutes catégories, selon la date d'échéance."}
      precision={ech ? `dans les ${ech.jours} prochains jours` : undefined} to={lien('/anticipation/calendrier', { critere: 'ECHEANCE' })}
      chargement={echeances.isLoading && !ech} erreur={echeances.error} onReessayer={echeances.reload} />
  </section>
}
