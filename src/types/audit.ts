export interface AuditDTO {
  id: number
  email: string | null
  action: string
  dateAction: string
  details: string | null
  adresseIp: string | null
}
