import { useState, type FormEvent } from 'react'
import { RotateCcw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { anticipationConfigApi } from '@/api/anticipationConfig'
import { extractErrorMessage } from '@/api/client'
import { TYPE_LABELS, formatJoursEtMois } from '@/utils/anticipation'
import { decrireFenetre } from './filtres'
import type { ConfigurationDelaiDTO } from '@/types/configurationDelai'

const MAX_JOURS = 36500
function lireJours(saisie: string): number | null {
  const valeur = saisie.trim()
  if (!/^\d+$/.test(valeur)) return null
  const jours = Number(valeur)
  return jours <= MAX_JOURS ? jours : null
}
function erreurJours(saisie: string): string | undefined {
  const valeur = saisie.trim()
  if (valeur === '') return undefined
  if (!/^\d+$/.test(valeur)) return 'Nombre entier de jours, 0 ou plus.'
  if (Number(valeur) > MAX_JOURS) return `Maximum ${MAX_JOURS} jours.`
  return undefined
}

interface ConfigurationFormModalProps {
  config: ConfigurationDelaiDTO | null
  onClose: () => void
  onSaved: () => void
}

export function ConfigurationFormModal({ config, onClose, onSaved }: ConfigurationFormModalProps) {
  return <Modal isOpen={config != null} onClose={onClose} maxWidth="max-w-lg" title={config ? `Fenêtre · ${TYPE_LABELS[config.type]}` : ''}>
    {config && <Formulaire key={config.type} config={config} onClose={onClose} onSaved={onSaved} />}
  </Modal>
}

function Formulaire({ config, onClose, onSaved }: { config: ConfigurationDelaiDTO; onClose: () => void; onSaved: () => void }) {
  const [prevenance, setPrevenance] = useState(String(config.prevenanceJours))
  const [retard, setRetard] = useState(String(config.retardJours))
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const prev = lireJours(prevenance)
  const ret = lireJours(retard)
  const valide = prev != null && ret != null
  const inchange = prev === config.prevenanceJours && ret === config.retardJours
  const identiqueAuDefaut = prev === config.prevenanceJoursDefaut && ret === config.retardJoursDefaut
  const elargit = prev != null && ret != null && (prev > config.prevenanceJours || ret > config.retardJours)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (prev == null || ret == null || inchange) return
    setEnCours(true)
    setErreur(null)
    try {
      if (identiqueAuDefaut) await anticipationConfigApi.reinitialiser(config.type)
      else await anticipationConfigApi.definir(config.type, { prevenanceJours: prev, retardJours: ret })
      onSaved()
    } catch (err) {
      setErreur(extractErrorMessage(err, "Impossible d'enregistrer cette fenêtre"))
    } finally { setEnCours(false) }
  }

  return <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
    {erreur && <ErrorBanner message={erreur} />}
    <div className="grid grid-cols-2 gap-3">
      <Input label="Prévenance (jours avant)" type="number" min={0} max={MAX_JOURS} step={1} inputMode="numeric" required value={prevenance} onChange={(event) => setPrevenance(event.target.value)} error={erreurJours(prevenance)} hint={`${prev != null ? `${formatJoursEtMois(prev)} · ` : ''}défaut ${config.prevenanceJoursDefaut} j`} />
      <Input label="Retard (jours après)" type="number" min={0} max={MAX_JOURS} step={1} inputMode="numeric" required value={retard} onChange={(event) => setRetard(event.target.value)} error={erreurJours(retard)} hint={`${ret != null ? `${formatJoursEtMois(ret)} · ` : ''}défaut ${config.retardJoursDefaut} j`} />
    </div>
    <p className="text-[12.5px] text-[#6B7180]">Retard 0 : aucune échéance dépassée n'est affichée (celle du jour reste visible).</p>
    <Button type="button" variant="ghost" size="sm" className="self-start" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => { setPrevenance(String(config.prevenanceJoursDefaut)); setRetard(String(config.retardJoursDefaut)) }}>Valeurs par défaut ({config.prevenanceJoursDefaut} j / {config.retardJoursDefaut} j)</Button>
    {prev != null && ret != null && <div className="rounded-lg border border-[#E4E6EB] bg-[#FAFAFB] px-4 py-3 text-[12.5px] text-[#4B4F5A]">Seront affichées les échéances {decrireFenetre({ prevenanceJours: prev, retardJours: ret }, null)}.</div>}
    {elargit && <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[12.5px] text-warning">Fenêtre élargie : au prochain passage de nuit, chaque agent désormais inclus reçoit son alerte, d'un seul coup s'ils sont nombreux. Les alertes existantes ne changent pas.</div>}
    {identiqueAuDefaut && !inchange && <div className="rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[12.5px] text-accent-dark">Ces valeurs sont celles par défaut : la personnalisation sera retirée plutôt que remplacée par une copie.</div>}
    <div className="mt-2 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose} disabled={enCours}>Annuler</Button><Button type="submit" isLoading={enCours} disabled={!valide || inchange}>{identiqueAuDefaut ? 'Revenir au défaut' : 'Enregistrer'}</Button></div>
  </form>
}
