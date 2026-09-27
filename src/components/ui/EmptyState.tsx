import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#DADCE3] bg-white py-14 text-center">
      <Icon className="h-8 w-8 text-[#B4B8C2]" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-[#6B7180]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
