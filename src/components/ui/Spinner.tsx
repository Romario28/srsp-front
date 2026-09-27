import { Loader2 } from 'lucide-react'
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-[#6B7180]">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
