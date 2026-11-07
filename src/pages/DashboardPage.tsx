import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roles'
import { Badge } from '@/components/ui/Badge'
import { TableauDeBordAdmin } from './dashboard/TableauDeBordAdmin'

export function DashboardPage() {
  const { user } = useAuth()
  return isAdmin(user?.roles) ? <TableauDeBordAdmin /> : <MonCompte />
}

/** Écran des comptes non-ADMIN : leur périmètre, seule source de leurs droits. */
function MonCompte() {
  const { user } = useAuth()
  if (!user) return null
  const p = user.perimetre
  const axes: [string, string[]][] = [['Ministères', p.ministeres], ['SOA', p.soas], ['Localités (FIV)', p.fivs]]
  const aucun = axes.every(([, codes]) => codes.length === 0)
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-ink">Bonjour {user.nomComplet.split(' ')[0]}</h1>
        {user.matriculeAgent && <p className="mt-1 text-[13px] text-[#6B7180]">Matricule {user.matriculeAgent}</p>}
      </div>
      <section className="flex max-w-xl flex-col gap-3 rounded-xl border border-[#E4E6EB] bg-white p-5">
        <h2 className="font-display text-[15px] font-semibold text-ink">Votre périmètre</h2>
        {aucun ? (
          <p className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[13px] text-warning">
            Aucune valeur : votre compte ne donne accès à aucun agent pour l'instant. Contactez un administrateur.
          </p>
        ) : (
          <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
            {axes.map(([label, codes]) => (
              <div key={label} className="contents">
                <dt className="text-[#6B7180]">{label}</dt>
                <dd>{codes.length === 0 ? <span className="text-[#9CA0AC]">Toutes</span>
                  : <span className="flex flex-wrap gap-1">{codes.map((c) => <Badge key={c}><span className="font-mono">{c}</span></Badge>)}</span>}</dd>
              </div>
            ))}
          </dl>
        )}
        {/* [TEMPORAIRE] à retirer quand les écrans d'anticipation s'ouvriront aux gestionnaires */}
        <p className="text-[12px] text-[#9CA0AC]">Les écrans d'anticipation ne sont pas encore ouverts à votre compte.</p>
      </section>
    </div>
  )
}