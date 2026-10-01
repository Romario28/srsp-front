import { useCallback, useEffect, useRef, useState } from 'react'
import { extractErrorMessage } from '@/api/client'

interface UseActionResult<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult | undefined>
  cancel: () => void
  reset: () => void
  data: TResult | null
  isLoading: boolean
  error: string | null
}

export function useAction<TArgs extends unknown[], TResult>(
  action: (signal: AbortSignal, ...args: TArgs) => Promise<TResult>,
  fallbackMessage = 'Opération impossible',
): UseActionResult<TArgs, TResult> {
  const [data, setData] = useState<TResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const actionRef = useRef(action)
  useEffect(() => { actionRef.current = action })

  const run = useCallback(async (...args: TArgs): Promise<TResult | undefined> => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError(null)
    try {
      const result = await actionRef.current(controller.signal, ...args)
      if (controller.signal.aborted) return undefined
      setData(result)
      return result
    } catch (err) {
      if (controller.signal.aborted) return undefined
      setData(null)
      setError(extractErrorMessage(err, fallbackMessage))
      return undefined
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setIsLoading(false)
      }
    }
  }, [fallbackMessage])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setIsLoading(false)
  }, [])

  const reset = useCallback(() => {
    cancel()
    setData(null)
    setError(null)
  }, [cancel])

  useEffect(() => () => {
    const controller = controllerRef.current
    controllerRef.current = null
    controller?.abort()
  }, [])

  return { run, cancel, reset, data, isLoading, error }
}
