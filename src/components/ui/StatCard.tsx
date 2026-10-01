import { Link } from 'react-router-dom'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  sub?: string
  to: string
}

export function StatCard({ icon: Icon, label, value, sub, to }: StatCardProps) {
  return (
    <Link to={to} className="group flex flex-col gap-3 rounded-xl border border-[#E4E6EB] bg-white p-5 transition-colors hover:border-accent">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent-dark">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-[#C4C7D0] transition-colors group-hover:text-accent" />
      </div>
      <div>
        <p className="font-display text-[24px] font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1.5 text-[13px] text-[#6B7180]">{label}</p>
        {sub && <p className="text-[11.5px] text-[#9CA0AC]">{sub}</p>}
      </div>
    </Link>
  )
}
