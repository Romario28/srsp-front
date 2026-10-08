import { ageEn, formatDate, todayInputValue } from '@/utils/date'

const ans = (n: number) => `${n} an${n > 1 ? 's' : ''}`

/** Âge aujourd'hui, en années révolues. */
export function Age({ naissance }: { naissance: string | null | undefined }) {
  const age = ageEn(naissance, todayInputValue())
  return <>{age == null ? '—' : ans(age)}</>
}

/** Date de retraite et âge atteint à cette échéance. */
export function DateRetraite({ dateEcheance, naissance }: {
  dateEcheance: string | null | undefined
  naissance: string | null | undefined
}) {
  const age = ageEn(naissance, dateEcheance)
  return <div className="flex flex-col gap-0.5">
    <span className="whitespace-nowrap">{formatDate(dateEcheance)}</span>
    {age != null && <span className="text-[12px] text-[#6B7180]">à {ans(age)}</span>}
  </div>
}
