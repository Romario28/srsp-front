import { Info } from 'lucide-react'
import type { AgentLieDTO } from '@/types/utilisateur'

const texte = (v: string | null | undefined) => v || '—'
const reference = (code: string | null, libelle: string | null) => (code ? (libelle ? `${code} — ${libelle}` : code) : '—')

/** Agent lié à un compte : lecture seule. Le lien est informatif, il n'ouvre aucun droit. */
export function EncartAgentLie({ agent }: { agent: AgentLieDTO }) {
  return (
    <section aria-label="Agent lié" className="flex flex-col gap-2 rounded-lg border border-[#E4E6EB] bg-[#FAFAFB] px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-display text-[13px] font-semibold text-ink">Agent lié</h4>
        <span className="font-mono text-[12px] text-[#6B7180]">Matricule {agent.matricule}</span>
      </div>
      {agent.trouve ? (
        <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
          <dt className="text-[#6B7180]">Nom</dt><dd className="min-w-0 text-ink">{texte(agent.nom)}</dd>
          <dt className="text-[#6B7180]">Prénom</dt><dd className="min-w-0 text-ink">{texte(agent.prenoms)}</dd>
          <dt className="text-[#6B7180]">Grade</dt><dd className="min-w-0 text-ink">{reference(agent.gradeCode, agent.gradeLibelle)}</dd>
          <dt className="text-[#6B7180]">Corps</dt>
          <dd className="min-w-0 text-ink">{reference(agent.corpsCode, agent.corpsLibelle)}{agent.categorieCode ? ` · cat. ${agent.categorieCode}` : ''}</dd>
        </dl>
      ) : (
        <p className="text-[13px] text-[#4B4F5A]">Aucun agent n'a ce matricule dans la base pour l'instant. Le lien est conservé : il s'affichera dès que l'agent sera importé.</p>
      )}
      <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-[#6B7180]">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        Lien informatif en lecture seule : il identifie la personne et n'ouvre aucun droit. Les droits viennent du périmètre.
      </p>
    </section>
  )
}