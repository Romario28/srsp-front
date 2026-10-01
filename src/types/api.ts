// Le backend renvoie soit { error: "..." } soit { message: "...", code?: "..." }
// selon que l'exception vient d'un try/catch manuel ou de GlobalExceptionHandler.
export interface ApiErrorBody {
  error?: string
  message?: string
  code?: string
}

// AJOUTÉ — déplacé depuis types/employe.ts. Enveloppe Spring Data, partagée par
// employés, comptes utilisateurs et (lot 3) alertes.
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number   // page courante (0-indexée)
  size: number
  first: boolean
  last: boolean
}