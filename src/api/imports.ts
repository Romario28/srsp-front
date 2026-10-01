import { apiClient } from './client'
import type { ImportKey, RapportImport } from '@/types/import'

export const importsApi = {
  importer: (cle: ImportKey, fichier: File) => {
    const form = new FormData()
    form.append('fichier', fichier)
    return apiClient.post<RapportImport>(`/imports/${cle}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((response) => response.data)
  },
}
