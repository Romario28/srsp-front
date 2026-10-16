import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAction } from '@/hooks/useAction'
import { exporter, type EcranExport } from '@/api/exports'

interface BoutonExportProps {
  ecran: EcranExport
  params: object
  disabled?: boolean
  title?: string
}

export function BoutonExport({ ecran, params, disabled, title }: BoutonExportProps) {
  const envoi = useAction<[], string>((signal) => exporter(ecran, params, signal), 'Export impossible')
  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />}
        onClick={() => void envoi.run()} isLoading={envoi.isLoading} disabled={disabled}
        title={title ?? 'Exporter au format Excel'}>
        Exporter
      </Button>
      {envoi.error && <span role="alert" className="max-w-xs text-right text-[12px] text-danger">{envoi.error}</span>}
    </div>
  )
}
