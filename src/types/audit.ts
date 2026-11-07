export interface AuditDTO {
  id: number
  email: string | null
  acteur: string          // [NOUVEAU] « Prénom Nom (matricule …) » si lié à un agent, sinon l'e-mail ; « Système » sans compte
  action: string
  dateAction: string
  details: string | null
  adresseIp: string | null
}