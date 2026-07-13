'use client'
import { useState, useRef } from 'react'

const G = { gold: '#C9A84C', goldDim: '#7a6230', ink: '#021A38', parchment: '#F5EDD8', green: '#4A9B7F', red: '#E05555', orange: '#C47A3A' }

type UploadResult = { url: string; fileName: string; fileSize: number; fileType: string }

interface Props {
  onUpload: (result: UploadResult) => void
  onCancel: () => void
  label?: string
}

export function FileUploader({ onUpload, onCancel, label = 'Seleccionar archivo' }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_TYPES = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/plain',
  ]
  const TYPE_LABELS: Record<string, string> = {
    'application/msword': 'Word (.doc)',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
    'application/pdf': 'PDF',
    'text/plain': 'Texto (.txt)',
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten archivos Word (.doc/.docx), PDF o TXT')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB')
      return false
    }
    setError('')
    return true
  }

  const handleFile = (file: File) => {
    if (validateFile(file)) setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setProgress(10)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Fake progress animation
      const interval = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300)

      const r = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(interval)
      setProgress(100)

      if (!r.ok) {
        const d = await r.json()
        setError(d.error ?? 'Error al subir')
        setUploading(false)
        return
      }
      const result = await r.json()
      onUpload(result)
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión')
      setUploading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>
      {/* Drop zone */}
      {!selectedFile ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => inputRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? G.gold : 'rgba(201,168,76,0.25)'}`, borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📄</div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(245,237,216,0.6)', marginBottom: '0.4rem' }}>Arrastra tu archivo aquí o <span style={{ color: G.gold }}>haz clic para seleccionar</span></div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.3)' }}>Word (.doc / .docx), PDF, TXT · Máximo 10MB</div>
          <input ref={inputRef} type="file" accept=".doc,.docx,.pdf,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            style={{ display: 'none' }} />
        </div>
      ) : (
        /* File preview */
        <div style={{ border: '1px solid rgba(201,168,76,0.25)', borderRadius: '8px', padding: '1rem 1.2rem', background: 'rgba(201,168,76,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>
              {selectedFile.name.endsWith('.pdf') ? '📕' : selectedFile.name.match(/\.docx?$/) ? '📘' : '📄'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', color: G.parchment, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.4)', marginTop: '0.15rem' }}>
                {TYPE_LABELS[selectedFile.type] ?? selectedFile.type} · {formatSize(selectedFile.size)}
              </div>
            </div>
            {!uploading && (
              <button onClick={() => setSelectedFile(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(245,237,216,0.3)', fontSize: '1rem', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}>✕</button>
            )}
          </div>
          {/* Progress bar */}
          {uploading && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? G.green : G.gold, transition: 'width 0.3s ease', borderRadius: '2px' }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(245,237,216,0.4)', marginTop: '0.3rem', textAlign: 'center' }}>
                {progress === 100 ? '✓ Subido' : `Subiendo... ${progress}%`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: G.red, padding: '0.4rem 0.75rem', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '5px' }}>⚠ {error}</div>}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        {selectedFile && !uploading && (
          <button onClick={handleUpload}
            style={{ padding: '0.55rem 1.2rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
            ⬆ SUBIR ARCHIVO
          </button>
        )}
        <button onClick={onCancel} disabled={uploading}
          style={{ padding: '0.55rem 0.8rem', background: 'transparent', border: '1px solid rgba(245,237,216,0.12)', borderRadius: '5px', color: 'rgba(245,237,216,0.4)', fontSize: '0.72rem', cursor: 'pointer' }}>
          CANCELAR
        </button>
      </div>
    </div>
  )
}
