import { apiClient } from './client'
import type { CreateEmployeRequest, EmployeResponse, Page, UpdateEmployeRequest } from '@/types/employe'

export const employesApi = {
  // GET /api/employes est paginé côté backend et déjà filtré par portée (chef/délégation/soi-même)
  getAll: (page = 0, size = 100) =>
    apiClient
      .get<Page<EmployeResponse>>('/employes', { params: { page, size, sort: 'nom' } })
      .then((r) => r.data),

  getById: (id: number) => apiClient.get<EmployeResponse>(`/employes/${id}`).then((r) => r.data),

  create: (payload: CreateEmployeRequest) =>
    apiClient.post<EmployeResponse>('/employes', payload).then((r) => r.data),

  update: (id: number, payload: UpdateEmployeRequest) =>
    apiClient.put<EmployeResponse>(`/employes/${id}`, payload).then((r) => r.data),

  remove: (id: number) => apiClient.delete<void>(`/employes/${id}`),
}
