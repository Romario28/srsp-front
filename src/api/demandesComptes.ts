import { apiClient, tokenStorage } from './client'
import type { PerimetreDTO } from '@/types/utilisateur'
import type { DemandeCompteDTO } from '@/types/demandeCompte'

export const demandesComptesApi = {
  lister: () => apiClient.get<DemandeCompteDTO[]>('/demandes-comptes').then((r) => r.data),
  compteur: () => apiClient.get<number>('/demandes-comptes/compteur').then((r) => r.data),
  approuver: (id: number, perimetre?: PerimetreDTO) =>
    apiClient.post(`/demandes-comptes/${id}/approbation`, { perimetre }).then((r) => r.data),
  refuser: (id: number, motif: string) =>
    apiClient.post(`/demandes-comptes/${id}/refus`, { motif }).then((r) => r.data),

  /**
   * Écoute le flux d'événements du serveur (SSE) jusqu'à sa fin ou son annulation.
   * EventSource ne sait pas envoyer l'en-tête Authorization : on lit donc le flux avec fetch.
   * Événements reçus : « pret » (flux ouvert) et « changement » (les demandes ont changé). Les commentaires (battement) sont ignorés.
   * Renvoie « refuse » si le serveur refuse l'accès (jeton absent, expiré ou profil sans droit), « termine » si le flux se ferme.
   */
  ecouter: async (signal: AbortSignal, surEvenement: (nom: string) => void): Promise<'termine' | 'refuse'> => {
    const reponse = await fetch(`${apiClient.defaults.baseURL ?? ''}/demandes-comptes/flux`, {
      headers: { Authorization: `Bearer ${tokenStorage.get() ?? ''}`, Accept: 'text/event-stream' },
      signal,
    })
    if (reponse.status === 401 || reponse.status === 403) return 'refuse'
    if (!reponse.ok || !reponse.body) throw new Error(`Flux indisponible (${reponse.status})`)

    const lecteur = reponse.body.getReader()
    const decodeur = new TextDecoder()
    let tampon = ''
    let nom: string | null = null
    for (;;) {
      const { done, value } = await lecteur.read()
      if (done) return 'termine'
      tampon += decodeur.decode(value, { stream: true })
      let fin = tampon.indexOf('\n')
      while (fin >= 0) {
        const ligne = tampon.slice(0, fin).replace(/\r$/, '')
        tampon = tampon.slice(fin + 1)
        if (ligne === '') { if (nom) surEvenement(nom); nom = null }   // ligne vide : l'événement est complet
        else if (ligne.startsWith('event:')) nom = ligne.slice(6).trim()
        fin = tampon.indexOf('\n')
      }
    }
  },
}
