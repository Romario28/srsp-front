import { apiClient } from './client'
import type { AuditDTO } from '@/types/audit'

export const auditApi = {
  getAll: () => apiClient.get<AuditDTO[]>('/audit').then((r) => r.data),
}
