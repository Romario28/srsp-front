import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
  /** Pied fixe sous la zone défilante, pour garder les actions visibles. */
  footer?: ReactNode
  /** Mise en page dense : en-tête et marges réduits, hauteur portée à 90 % de l'écran. */
  dense?: boolean
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md', footer, dense = false }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // hauteur de la zone défilante (l'en-tête et le pied en sont déduits en mode dense)
  const hauteur = dense
    ? (footer ? 'max-h-[calc(90vh_-_7.5rem)]' : 'max-h-[calc(90vh_-_3rem)]')
    : (footer ? 'max-h-[65vh]' : 'max-h-[75vh]')

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className={`relative z-10 w-full ${maxWidth} rounded-2xl bg-white shadow-xl`}
      >
        <div className={`flex items-center justify-between border-b border-[#EAEBF0] px-5 ${dense ? 'py-2.5' : 'py-4'}`}>
          <h2 id="modal-title" className="font-display text-[15px] font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-md p-1 text-[#6B7180] hover:bg-[#F0F1F4] hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={`${hauteur} overflow-y-auto px-5 ${dense ? 'py-3' : 'py-5'}`}>{children}</div>
        {footer && <div className={`border-t border-[#EAEBF0] px-5 ${dense ? 'py-2.5' : 'py-3.5'}`}>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
