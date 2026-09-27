import { AlertTriangle } from 'lucide-react'
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-light px-4 py-3 text-[13px] text-danger">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
