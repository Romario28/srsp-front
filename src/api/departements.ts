import { apiClient } from './client'
import type { DepartementDTO } from '@/types/departement'

export const departementsApi = {
  /** Public : alimente la liste déroulante de la demande de compte. */
  listePublique: () => apiClient.get<DepartementDTO[]>('/auth/departements').then((r) => r.data),
  /** Administration (ADMIN). */
  lister: () => apiClient.get<DepartementDTO[]>('/departements').then((r) => r.data),
  creer: (libelle: string) => apiClient.post<DepartementDTO>('/departements', { libelle }).then((r) => r.data),
  modifier: (id: number, libelle: string) => apiClient.put<DepartementDTO>(`/departements/${id}`, { libelle }).then((r) => r.data),
  supprimer: (id: number) => apiClient.delete<void>(`/departements/${id}`),
}
