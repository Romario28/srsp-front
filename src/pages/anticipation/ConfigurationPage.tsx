import { useMemo, useState } from 'react'
import { Info, Pencil, RotateCcw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { anticipationConfigApi } from '@/api/anticipationConfig'
import { extractErrorMessage } from '@/api/client'
import { isAdmin } from '@/utils/roles'
import { TYPES_ECHEANCE, TYPE_LABELS, formatMois } from '@/utils/anticipation'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { ConfigurationFormModal } from './ConfigurationFormModal'
import type { ConfigurationDelaiDTO } from '@/types/configurationDelai'

const libelleRetard = (mois: number) => mois === 0 ? '0 mois (aucun retard)' : formatMois(mois)

export function ConfigurationPage() {
  const { user } = useAuth()
  const peutModifier = isAdmin(user?.roles)
  const { data, isLoading, error, reload } = useFetch(() => anticipationConfigApi.lister())
  const lignes = useMemo(() => [...(data ?? [])].sort((a, b) => TYPES_ECHEANCE.indexOf(a.type) - TYPES_ECHEANCE.indexOf(b.type)), [data])
  const [edition, setEdition] = useState<ConfigurationDelaiDTO | null>(null)
  const [aReinitialiser, setAReinitialiser] = useState<ConfigurationDelaiDTO | null>(null)
  const [erreurReinit, setErreurReinit] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const reinitialiser = async () => {
    if (!aReinitialiser) return
    setEnCours(true)
    setErreurReinit(null)
    try { await anticipationConfigApi.reinitialiser(aReinitialiser.type); setAReinitialiser(null); reload() }
    catch (err) { setErreurReinit(extractErrorMessage(err, 'Réinitialisation impossible')) }
    finally { setEnCours(false) }
  }

  return <div className="flex flex-col gap-5">
    <div><h1 className="font-display text-[20px] font-semibold text-ink">Configuration des fenêtres</h1><p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">Pour chaque type d'échéance : le délai de préparation (combien de mois avant l'échéance on peut commencer le dossier ; l'alerte apparaît à cette date) et la tolérance (combien de mois après l'échéance elle reste affichée). Date de préparation = échéance − délai de préparation, en mois calendaires.</p></div>
    <div className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark"><Info className="mt-0.5 h-4 w-4 flex-shrink-0" /><div className="flex flex-col gap-1.5">
      <p>Ces valeurs pré-remplissent les écrans de consultation (modifiables à chaque calcul) et décident, chaque nuit, quelles échéances génèrent une alerte.</p>
      <p>Une modification joue sur les prochaines recherches et sur le prochain passage de nuit, pas sur les alertes déjà créées : elles restent dans le fil jusqu'à leur acquittement.</p>
      <p>Un intervalle de dates saisi sur un écran de consultation ignore ces valeurs. Les anomalies n'ont pas de fenêtre : elles sont toujours signalées. La titularisation se calcule comme un avancement, mais sa fenêtre se règle séparément.</p>
    </div></div>
    {error && <ErrorBanner message={error} />}
    {isLoading && !data ? <Spinner label="Chargement de la configuration…" /> : data ? <div className={`overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
      <table className="w-full"><thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
        <th className="table-head-cell">Type</th><th className="table-head-cell">Préparation</th><th className="table-head-cell">Retard toléré</th><th className="table-head-cell">Par défaut</th><th className="table-head-cell">État</th>{peutModifier && <th className="table-head-cell text-right">Actions</th>}
      </tr></thead><tbody className="divide-y divide-[#EAEBF0]">{lignes.map((config) => <tr key={config.type} className="hover:bg-[#FAFAFB]">
        <td className="table-cell font-medium text-ink">{TYPE_LABELS[config.type]}</td>
        <td className={`table-cell ${config.prevenanceMois !== config.prevenanceMoisDefaut ? 'font-medium text-ink' : 'text-[#4B4F5A]'}`}>{formatMois(config.prevenanceMois)}</td>
        <td className={`table-cell ${config.retardMois !== config.retardMoisDefaut ? 'font-medium text-ink' : 'text-[#4B4F5A]'}`}>{libelleRetard(config.retardMois)}</td>
        <td className="table-cell text-[12.5px] text-[#6B7180]"><div>Préparation : {formatMois(config.prevenanceMoisDefaut)}</div><div>Retard : {libelleRetard(config.retardMoisDefaut)}</div></td>
        <td className="table-cell"><Badge tone={config.personnalise ? 'warning' : 'neutral'}>{config.personnalise ? 'Personnalisé' : 'Par défaut'}</Badge></td>
        {peutModifier && <td className="table-cell"><div className="flex justify-end gap-1">
          <button onClick={() => setEdition(config)} aria-label={`Modifier la fenêtre ${TYPE_LABELS[config.type]}`} className="rounded-md p-1.5 text-[#6B7180] hover:bg-accent-light hover:text-accent-dark"><Pencil className="h-4 w-4" /></button>
          {config.personnalise && <button onClick={() => { setErreurReinit(null); setAReinitialiser(config) }} aria-label={`Rétablir les valeurs par défaut pour ${TYPE_LABELS[config.type]}`} className="rounded-md p-1.5 text-[#6B7180] hover:bg-[#F0F1F4] hover:text-ink"><RotateCcw className="h-4 w-4" /></button>}
        </div></td>}
      </tr>)}</tbody></table>
    </div> : null}
    <p className="text-[12px] text-[#9CA0AC]">Les valeurs par défaut sont fixées côté serveur ; elles s'appliquent tant qu'aucune personnalisation n'existe.</p>
    <ConfigurationFormModal config={edition} onClose={() => setEdition(null)} onSaved={() => { setEdition(null); reload() }} />
    <ConfirmDialog isOpen={!!aReinitialiser} title="Rétablir les valeurs par défaut" message={erreurReinit ?? (aReinitialiser ? `Rétablir la fenêtre « ${TYPE_LABELS[aReinitialiser.type]} » : préparation ${formatMois(aReinitialiser.prevenanceMoisDefaut)}, retard ${libelleRetard(aReinitialiser.retardMoisDefaut)}. Les alertes déjà créées ne changent pas.` : '')} confirmLabel="Rétablir" danger={false} isLoading={enCours} onConfirm={reinitialiser} onCancel={() => setAReinitialiser(null)} />
  </div>
}
