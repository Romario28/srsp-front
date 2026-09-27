// Le backend renvoie soit { error: "..." } soit { message: "...", code?: "..." }
// selon que l'exception vient d'un try/catch manuel ou de GlobalExceptionHandler.
export interface ApiErrorBody {
  error?: string
  message?: string
  code?: string
}
