export type TypeAcces = 'LECTURE' | 'LECTURE_ECRITURE'

// Miroir de CreatePorteeDelegueeRequest.java
export interface CreatePorteeDelegueeRequest {
  idUtilisateur: number
  idDepartement: number
  typeAcces: TypeAcces
  dateDebut: string       // peut être future (planification)
  dateFin?: string | null // absent/null = permanente
}

// Miroir de PorteeDelegueeDTO.java
export interface PorteeDelegueeDTO {
  id: number
  idUtilisateur: number
  emailUtilisateur: string
  idDepartement: number
  nomDepartement: string
  typeAcces: TypeAcces
  dateDebut: string
  dateFin: string | null
  accordePar: string
  active: boolean
}
