'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getVideoEmbed } from '@/lib/videoEmbed'

const G = { gold: '#C9A84C', goldLight: '#E8C97A', goldDim: '#7a6230', ink: '#021A38', parchment: '#F5EDD8', green: '#4A9B7F', red: '#E05555' }

const TYPES = [
  { value: 'pdf', label: 'PDF', icon: '📕' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'audio', label: 'Audio', icon: '🎧' },
  { value: 'slides', label: 'Diapositivas', icon: '📊' },
  { value: 'text', label: 'Lectura', icon: '📄' },
  { value: 'image', label: 'Imagen', icon: '🖼' },
  { value: 'link', label: 'Enlace', icon: '🔗' },
]

type Resource = {
  id: string
  title: string
  type: string
  url: string
  description: string | null
  fileSize: number | null
  duration: number | null
  downloadable: boolean
  isPremium: boolean
  order: number
}

const fmtSize = (b: number | null) => {
  if (!b) return null
  return b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`
}
const fmtDur = (s: number | null) => {
  if (!s) return null
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m}:${String(sec).padStart(2, '0')}`
}

export function ResourceManager({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mode, setMode] = useState<'archivo' | 'enlace'>('archivo')
  const [dragging, setDragging] = useState(false)
  const [diag, setDiag] = useState<{ ok: boolean; message: string; pdfDelivery?: boolean | null } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', type: 'pdf', url: '', description: '',
    fileSize: null as number | null, duration: null as number | null,
    downloadable: true, isPremium: false,
  })

  const resetForm = () => setForm({ title: '', type: 'pdf', url: '', description: '', fileSize: null, duration: null, downloadable: true, isPremium: false })

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/lessons/${lessonId}/resources`)
    const d = await r.json()
    setResources(d.resources ?? [])
    setLoading(false)
  }, [lessonId])

  useEffect(() => { load() }, [load])

  // Comprobación de la conexión con Cloudinary al abrir el gestor
  useEffect(() => {
    let vivo = true
    fetch('/api/admin/cloudinary-check')
      .then(r => r.json())
      .then(d => { if (vivo) setDiag(d) })
      .catch(() => { if (vivo) setDiag({ ok: false, message: 'No se pudo verificar la conexión con Cloudinary.' }) })
    return () => { vivo = false }
  }, [])

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setOk(''); setTimeout(() => setError(''), 6000) }
    else { setOk(msg); setError(''); setTimeout(() => setOk(''), 3000) }
  }

  const uploadFile = async (file: File) => {
    setUploading(true); setProgress(10); setError('')
    const tick = setInterval(() => setProgress(p => Math.min(p + 12, 85)), 400)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('lessonId', lessonId)
      const r = await fetch('/api/upload-resource', { method: 'POST', body: fd })
      clearInterval(tick); setProgress(100)
      const d = await r.json()
      if (!r.ok) { flash(d.error ?? 'Error al subir', true); setUploading(false); setProgress(0); return }
      setForm(f => ({
        ...f,
        url: d.url,
        type: d.type,
        title: f.title || d.suggestedTitle,
        fileSize: d.fileSize,
        duration: d.duration,
      }))
      flash('Archivo subido. Revisa el título y guarda el material.')
    } catch {
      clearInterval(tick)
      flash('Se cortó la subida. Vuelve a intentarlo.', true)
    }
    setUploading(false)
    setTimeout(() => setProgress(0), 800)
  }

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) { flash('Falta el título o el archivo/enlace.', true); return }
    const r = await fetch(`/api/lessons/${lessonId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, order: resources.length }),
    })
    if (!r.ok) { flash('No se pudo guardar el material.', true); return }
    resetForm()
    flash('Material añadido.')
    load()
  }

  const remove = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"? El archivo también se borrará de Cloudinary.`)) return
    await fetch(`/api/lessons/${lessonId}/resources`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const box = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '6px', padding: '0.55rem 0.8rem', color: G.parchment, fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'Georgia, serif' }
  const lbl = { display: 'block', fontSize: '0.58rem', letterSpacing: '0.22em', color: 'rgba(201,168,76,0.6)', marginBottom: '0.3rem' } as const

  return (
    <div style={{ marginTop: '0.9rem', padding: '1.1rem', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '8px', background: 'rgba(0,0,0,0.18)', fontFamily: 'Georgia, serif' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: G.goldDim, marginBottom: '0.9rem', textTransform: 'uppercase' }}>
        Materiales · {lessonTitle}
      </div>

      {/* Estado de la conexión con Cloudinary */}
      {diag && !diag.ok && (
        <div style={{ fontSize: '0.75rem', color: G.red, padding: '0.6rem 0.8rem', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.25)', borderRadius: '6px', marginBottom: '0.9rem', lineHeight: 1.5 }}>
          ⚠ <strong>Cloudinary no está operativo.</strong> {diag.message}
        </div>
      )}
      {diag?.ok && diag.pdfDelivery === false && (
        <div style={{ fontSize: '0.75rem', color: '#E8C97A', padding: '0.6rem 0.8rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '6px', marginBottom: '0.9rem', lineHeight: 1.5 }}>
          ⚠ La entrega de PDF y ZIP está bloqueada en tu cuenta. Actívala en console.cloudinary.com → Settings → Security → «PDF and ZIP files delivery» → Allow delivery. Sin eso, los PDF suben pero el alumno no puede abrirlos.
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ fontSize: '0.78rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Cargando materiales…</div>
      ) : resources.length === 0 ? (
        <div style={{ fontSize: '0.78rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic', marginBottom: '1rem' }}>
          Esta lección aún no tiene materiales. Añade el primero abajo.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.1rem' }}>
          {resources.map(r => {
            const t = TYPES.find(x => x.value === r.type) ?? TYPES[4]
            const meta = [fmtDur(r.duration), fmtSize(r.fileSize)].filter(Boolean).join(' · ')
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 0.8rem', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{t.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', color: G.parchment, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.3)' }}>
                    {t.label}{meta ? ` · ${meta}` : ''}{r.isPremium ? ' · Premium' : ''}
                  </div>
                </div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.65rem', color: G.gold, textDecoration: 'none', flexShrink: 0 }}>VER ↗</a>
                <button onClick={() => remove(r.id, r.title)} style={{ background: 'transparent', border: '1px solid rgba(220,60,60,0.3)', borderRadius: '4px', color: G.red, fontSize: '0.62rem', padding: '0.25rem 0.5rem', cursor: 'pointer', flexShrink: 0 }}>
                  ELIMINAR
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Alta */}
      <div style={{ borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '0.9rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
          {(['archivo', 'enlace'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.62rem', letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Georgia, serif',
                background: mode === m ? G.gold : 'transparent', color: mode === m ? G.ink : 'rgba(245,237,216,0.4)',
                border: mode === m ? 'none' : '1px solid rgba(245,237,216,0.15)' }}>
              {m === 'archivo' ? 'SUBIR ARCHIVO' : 'ENLACE EXTERNO'}
            </button>
          ))}
        </div>

        {mode === 'archivo' ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f) }}
            onClick={() => !uploading && inputRef.current?.click()}
            style={{ border: `2px dashed ${dragging ? G.gold : 'rgba(201,168,76,0.22)'}`, borderRadius: '7px', padding: '1.2rem', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', background: dragging ? 'rgba(201,168,76,0.05)' : 'transparent', marginBottom: '0.8rem' }}>
            {uploading ? (
              <div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? G.green : G.gold, transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(245,237,216,0.4)' }}>Subiendo… {progress}%</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.8rem', color: 'rgba(245,237,216,0.55)' }}>
                  Arrastra el archivo o <span style={{ color: G.gold }}>haz clic para elegirlo</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.28)', marginTop: '0.3rem' }}>
                  Audio y video hasta 100 MB · PDF, Word, Excel, PowerPoint, CSV, ZIP, EPUB e imágenes hasta 10 MB
                </div>
              </>
            )}
            <input ref={inputRef} type="file" style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.rtf,.odt,.zip,.txt,.md,.epub,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />
          </div>
        ) : (
          <div style={{ marginBottom: '0.8rem' }}>
            <label style={lbl}>URL DEL RECURSO</label>
            <input value={form.url} onChange={e => {
                const url = e.target.value
                const esVideo = getVideoEmbed(url).kind !== 'link'
                setForm(f => ({ ...f, url, type: esVideo ? 'video' : f.type }))
              }}
              placeholder="YouTube, Vimeo, Google Drive, Loom, Dailymotion, Facebook, Twitch o cualquier enlace" style={box} />
            {form.url && getVideoEmbed(form.url).kind !== 'link' && (
              <div style={{ fontSize: '0.68rem', color: G.green, marginTop: '0.35rem' }}>
                ✓ Video reconocido: se reproducirá incrustado dentro de la lección.
              </div>
            )}
          </div>
        )}

        {/* Campos del material */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '0.6rem', marginBottom: '0.6rem' }}>
          <div>
            <label style={lbl}>TÍTULO</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ej: Guía de estudio — Sola Scriptura" style={box} />
          </div>
          <div>
            <label style={lbl}>FORMATO</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={box}>
              {TYPES.map(t => <option key={t.value} value={t.value} style={{ background: G.ink }}>{t.icon} {t.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '0.7rem' }}>
          <label style={lbl}>DESCRIPCIÓN (OPCIONAL)</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Una línea sobre qué contiene el material" style={box} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(245,237,216,0.5)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.downloadable} onChange={e => setForm(f => ({ ...f, downloadable: e.target.checked }))} />
            Incluir en «Descargar todo»
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(245,237,216,0.5)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} />
            Solo premium
          </label>
          {(form.fileSize || form.duration) && (
            <span style={{ fontSize: '0.68rem', color: G.green }}>
              ✓ {[fmtDur(form.duration), fmtSize(form.fileSize)].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        {error && <div style={{ fontSize: '0.75rem', color: G.red, padding: '0.45rem 0.7rem', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '5px', marginBottom: '0.7rem' }}>⚠ {error}</div>}
        {ok && <div style={{ fontSize: '0.75rem', color: G.green, padding: '0.45rem 0.7rem', background: 'rgba(74,155,127,0.08)', border: '1px solid rgba(74,155,127,0.2)', borderRadius: '5px', marginBottom: '0.7rem' }}>✓ {ok}</div>}

        <button onClick={save} disabled={uploading}
          style={{ padding: '0.5rem 1.2rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.7rem', letterSpacing: '0.12em', cursor: uploading ? 'default' : 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', opacity: uploading ? 0.5 : 1 }}>
          AÑADIR MATERIAL
        </button>
      </div>
    </div>
  )
}
