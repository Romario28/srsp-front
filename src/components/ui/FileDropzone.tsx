import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { FileSpreadsheet, Upload, X } from 'lucide-react'

interface FileDropzoneProps {
  file: File | null
  onChange: (file: File | null) => void
  accept?: string
  maxSizeMo?: number
  disabled?: boolean
  hint?: string
}

function formatTaille(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
}

export function FileDropzone({ file, onChange, accept = '.xlsx,.xls', maxSizeMo, disabled = false, hint }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rejet, setRejet] = useState<string | null>(null)
  const extensions = accept.split(',').map((ext) => ext.trim().toLowerCase()).filter(Boolean)
  const accepter = (candidate: File | undefined) => {
    if (!candidate) return
    if (extensions.length > 0 && !extensions.some((ext) => candidate.name.toLowerCase().endsWith(ext))) { setRejet(`Format non pris en charge — attendu : ${extensions.join(', ')}`); return }
    if (maxSizeMo != null && candidate.size > maxSizeMo * 1024 * 1024) { setRejet(`Fichier trop volumineux (${formatTaille(candidate.size)}) — maximum ${maxSizeMo} Mo`); return }
    setRejet(null)
    onChange(candidate)
  }
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => { accepter(event.target.files?.[0]); event.target.value = '' }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); if (!disabled) accepter(event.dataTransfer.files?.[0]) }
  return (
    <div className="flex flex-col gap-1.5">
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleInput} disabled={disabled} />
      {file ? <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E4E6EB] bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3"><FileSpreadsheet className="h-5 w-5 flex-shrink-0 text-success" /><div className="min-w-0"><p className="truncate text-[13.5px] font-medium text-ink">{file.name}</p><p className="text-[12px] text-[#6B7180]">{formatTaille(file.size)}</p></div></div>
        <button type="button" onClick={() => { setRejet(null); onChange(null) }} disabled={disabled} aria-label="Retirer le fichier" className="rounded-md p-1.5 text-[#6B7180] hover:bg-[#F0F1F4] hover:text-danger disabled:opacity-50"><X className="h-4 w-4" /></button>
      </div> : <div onDragOver={(event) => { event.preventDefault(); if (!disabled) setIsDragging(true) }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false) }} onDrop={handleDrop}>
        <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className={`flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDragging ? 'border-accent bg-accent-light' : 'border-[#DADCE3] bg-white hover:border-accent'}`}>
          <Upload className="h-6 w-6 text-[#9CA0AC]" /><span className="text-[13.5px] font-medium text-ink">Glissez un fichier ici ou cliquez pour parcourir</span>{hint && <span className="text-[12px] text-[#6B7180]">{hint}</span>}
        </button>
      </div>}
      {rejet && <span role="alert" className="text-[12px] text-danger">{rejet}</span>}
    </div>
  )
}
