import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge, StatutBadge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { useFetch } from '@/hooks/useFetch'
import { utilisateursApi } from '@/api/utilisateurs'
import { formatDateTime } from '@/utils/date'
import { roleLabel } from '@/utils/roles'
import { perimetreVide, type UtilisateurDetailDTO } from '@/types/utilisateur'
import { EncartAgentLie } from './EncartAgentLie'

const DIMENSIONS = [['Ministères', 'ministeres'], ['SOA', 'soas'], ['Localités (FIV)', 'fivs']] as const

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-[#6B7180]">{label}</dt><dd className="min-w-0 text-ink">{children}</dd></>
}

interface UtilisateurFicheModalProps {
  utilisateurId: number | null
  onClose: () => void
  onModifier: (utilisateur: UtilisateurDetailDTO) => void
}

export function UtilisateurFicheModal({ utilisateurId, onClose, onModifier }: UtilisateurFicheModalProps) {
  return (
    <Modal isOpen={utilisateurId != null} onClose={onClose} maxWidth="max-w-xl" dense title="Fiche du compte">
      {utilisateurId != null && <Contenu key={utilisateurId} id={utilisateurId} onClose={onClose} onModifier={onModifier} />}
    </Modal>
  )
}

function Contenu({ id, onClose, onModifier }: { id: number; onClose: () => void; onModifier: (u: UtilisateurDetailDTO) => void }) {
  const { data, isLoading, error, reload } = useFetch(() => utilisateursApi.getById(id), [id])

  if (error) return (
    <div className="flex flex-col gap-3">
      <ErrorBanner message={error} />
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={reload}>Réessayer</Button><Button variant="secondary" onClick={onClose}>Fermer</Button></div>
    </div>
  )
  if (isLoading && !data) return <Spinner label="Chargement du compte…" />
  if (!data) return null

  const nomComplet = [data.prenom, data.nom].filter(Boolean).join(' ')
  const admin = data.roles.includes('ROLE_ADMIN')
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-[17px] font-semibold text-ink">{nomComplet || data.email}</h3>
        <StatutBadge statut={data.statut} />
      </header>

      <section className="flex flex-col gap-2">
        <h4 className="font-display text-[13px] font-semibold text-ink">Compte</h4>
        <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-[13px]">
          {nomComplet && <Ligne label="E-mail">{data.email}</Ligne>}
          <Ligne label="Rôles"><span className="flex flex-wrap gap-1">{data.roles.map((r) => <Badge key={r} tone="accent">{roleLabel(r)}</Badge>)}</span></Ligne>
          <Ligne label="Créé le">{formatDateTime(data.dateCreation)}</Ligne>
          <Ligne label="Dernière connexion">{formatDateTime(data.dateDerniereConnexion)}</Ligne>
        </dl>
      </section>

      <section className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-3">
        <h4 className="font-display text-[13px] font-semibold text-ink">Périmètre</h4>
        {admin ? (
          <p className="text-[13px] text-[#4B4F5A]">Accès total (administrateur) : le périmètre est sans effet.</p>
        ) : (
          <>
            <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
              {DIMENSIONS.map(([label, cle]) => (
                <Ligne key={cle} label={label}>
                  {data.perimetre[cle].length === 0 ? <span className="text-[#9CA0AC]">Toutes</span>
                    : <span className="flex flex-wrap gap-1">{data.perimetre[cle].map((c) => <Badge key={c}><span className="font-mono">{c}</span></Badge>)}</span>}
                </Ligne>
              ))}
            </dl>
            {perimetreVide(data.perimetre) && (
              <p className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] text-warning">Aucune valeur : ce compte ne voit aucun agent.</p>
            )}
          </>
        )}
      </section>

      {data.agentLie && <EncartAgentLie agent={data.agentLie} />}

      <div className="flex items-center justify-between gap-2 border-t border-[#EAEBF0] pt-3">
        <Button variant="secondary" onClick={onClose}>Fermer</Button>
        <Button icon={<Pencil className="h-4 w-4" />} onClick={() => onModifier(data)}>Modifier</Button>
      </div>
    </div>
  )
}