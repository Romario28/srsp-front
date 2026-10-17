import axios from 'axios'
import { apiClient } from './client'
import type { ApiErrorBody } from '@/types/api'

export type EcranExport = 'calendrier' | 'retraite' | 'avancement' | 'titularisation' | 'fin-contrat' | 'integration' | 'anomalies' | 'alertes'

function nomDepuisEntete(entete: unknown): string | null {
  if (typeof entete !== 'string') return null
  const trouve = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(entete)
  if (!trouve) return null
  try { return decodeURIComponent(trouve[1]) } catch { return trouve[1] }
}

async function erreurLisible(err: unknown): Promise<unknown> {
  if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
    try {
      const corps = JSON.parse(await err.response.data.text()) as ApiErrorBody
      return new Error(corps.error ?? corps.message ?? 'Export impossible')
    } catch { /* corps illisible : garder l'erreur d'origine */ }
  }
  return err
}

function enregistrer(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function exporter(ecran: EcranExport, params: object, signal?: AbortSignal): Promise<string> {
  try {
    const reponse = await apiClient.get<Blob>(`/exports/${ecran}`, { params, responseType: 'blob', signal })
    const nom = nomDepuisEntete(reponse.headers['content-disposition']) ?? `${ecran}.xlsx`
    enregistrer(reponse.data, nom)
    return nom
  } catch (err) {
    throw await erreurLisible(err)
  }
}
