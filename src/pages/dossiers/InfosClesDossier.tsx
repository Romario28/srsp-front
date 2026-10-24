import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, joursRestantsDepuis } from '@/utils/date'
import { changeDeGrade, libelleEcheance, toneDelai } from '@/utils/anticipation'
import { Age, AgeA } from '@/pages/anticipation/DatesCarriere'
import { BlocsSituation } from '@/pages/anticipation/SituationsGrade'
import type { CleFiche, EtatFiche } from '@/pages/anticipation/FicheAgent'
import type { AgentFiche, TypeAnticipation } from '@/types/anticipation'
import type { DossierDTO } from '@/types/dossier'

const GRILLE = 'grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-[13px]'

/** Intitulé de la date d'échéance par type. Pour les types qui changent de grade, elle figure dans « Nouvelle situation ». */
const LIBELLE_DATE: Partial<Record<TypeAnticipation, string>> = {
  DEPART_RETRAITE: 'Date de retraite',
  FIN_CONTRAT: 'Date de fin de contrat',
  INTEGRATION: "Date d'intégration",
}

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-[#6B7180]">{label}</dt><dd className="min-w-0 text-ink">{children}</dd></>
}

function Squelette() {
  return <span aria-hidden="true" className="inline-block h-3.5 w-24 animate-pulse rounded bg-[#EAEBF0] align-middle" />
}

/** Valeur issue de la fiche : squelette pendant le chargement, tiret si la fiche est indisponible. */
function ValeurFiche({ etat, children }: { etat: EtatFiche; children: (fiche: AgentFiche) => ReactNode }) {
  if (etat.fiche) return <>{children(etat.fiche)}</>
  if (etat.isLoading) return <Squelette />
  return <span className="text-[#9CA0AC]" title="Fiche indisponible">—</span>
}

/** Rouge pour un retard (avec le nombre de jours) ; neutre ou ambre pour un délai à venir. */
function DelaiDossier({ d }: { d: DossierDTO }) {
  if (d.enRetard) {
    const j = d.joursRetard ?? 0
    return <Badge tone="danger">{j} jour{j > 1 ? 's' : ''} de retard</Badge>
  }
  const jours = joursRestantsDepuis(d.dateEcheance)
  if (jours == null) return <>—</>
  return <Badge tone={toneDelai(jours)}>{libelleEcheance(jours)}</Badge>
}

export function InfosClesDossier({ dossier, etat }: { dossier: DossierDTO; etat: EtatFiche }) {
  const gradeType = changeDeGrade(dossier.type)
  const attente = dossier.statut === 'EN_ATTENTE_DE_TRAITEMENT'
  const fiche = etat.fiche
  return (
    <section className="flex flex-col gap-2.5">
      <h4 className="font-display text-[13px] font-semibold text-ink">Informations clés</h4>
      <dl className={GRILLE}>
        <Ligne label="Préparation dès le">{formatDate(dossier.datePreparation)}</Ligne>
        {!gradeType && (
          <Ligne label={LIBELLE_DATE[dossier.type] ?? 'Échéance'}>
            <span className={dossier.enRetard ? 'font-semibold text-danger' : ''}>{formatDate(dossier.dateEcheance)}</span>
          </Ligne>
        )}
        {attente
          ? <Ligne label="Délai"><DelaiDossier d={dossier} /></Ligne>
          : <Ligne label="Démarré le">{dossier.dateDemarrage ? formatDate(dossier.dateDemarrage) : <span className="text-[#9CA0AC]">Jamais démarré</span>}</Ligne>}

        {dossier.type === 'DEPART_RETRAITE' && <>
          <Ligne label="Date de naissance"><ValeurFiche etat={etat}>{(f) => formatDate(f.dateNaissance)}</ValeurFiche></Ligne>
          <Ligne label="Âge actuel"><ValeurFiche etat={etat}>{(f) => <Age naissance={f.dateNaissance} />}</ValeurFiche></Ligne>
          <Ligne label="Âge de départ"><ValeurFiche etat={etat}>{(f) => <AgeA naissance={f.dateNaissance} aLaDate={dossier.dateEcheance} />}</ValeurFiche></Ligne>
        </>}
        {(dossier.type === 'FIN_CONTRAT' || dossier.type === 'INTEGRATION') && (
          <Ligne label="Début de contrat"><ValeurFiche etat={etat}>{(f) => formatDate(f.dateDebutContrat)}</ValeurFiche></Ligne>
        )}
      </dl>

      {gradeType && (
        <BlocsSituation
          horizontal
          gradeActuel={dossier.gradeCode}
          dateEffetActuelle={fiche ? (fiche.avanceDate ?? fiche.dateDebutContrat) : null}
          gradeSuivant={fiche?.gradeSuivant ?? null}
          dateEffetNouvelle={dossier.dateEcheance}
        />
      )}

      {/* Rappel de règle sans répéter les dates : elles sont déjà affichées au-dessus */}
      {dossier.type === 'TITULARISATION' && (
        <p role="note" className="flex items-start gap-1.5 text-[12px] leading-snug text-[#6B7180]">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          Le dossier se prépare dès la date de préparation, mais ne se dépose qu'à partir de l'échéance.
        </p>
      )}
    </section>
  )
}

const memeDate = (a: string | null, b: string | null) => a != null && b != null && a.slice(0, 10) === b.slice(0, 10)

/** Champs de la fiche déjà affichés ailleurs dans la modale : ils ne sont pas répétés. */
export function dejaAffichesDossier(dossier: DossierDTO, fiche: AgentFiche): ReadonlySet<CleFiche> {
  const exclus = new Set<CleFiche>(['statut'])   // badge de l'en-tête
  switch (dossier.type) {
    case 'AVANCEMENT': case 'AVANCEMENT_CLASSE': case 'TITULARISATION':
      exclus.add('grade')                                                  // « Dernière situation »
      exclus.add(fiche.avanceDate != null ? 'avanceDate' : 'debutContrat') // sa date d'effet
      break
    case 'DEPART_RETRAITE':
      exclus.add('naissance')
      break
    case 'FIN_CONTRAT':
      exclus.add('debutContrat')
      if (memeDate(dossier.dateEcheance, fiche.dateFinContrat)) exclus.add('finContrat')
      break
    case 'INTEGRATION':
      exclus.add('debutContrat')
      if (fiche.integration.situation === 'CONCERNE') exclus.add('integrationEtat')
      if (memeDate(dossier.dateEcheance, fiche.integration.dateIntegration)) exclus.add('integrationDate')
      if (memeDate(dossier.datePreparation, fiche.integration.datePreparation)) exclus.add('integrationPreparation')
      break
  }
  return exclus
}
