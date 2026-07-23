'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Video, FileText, Headphones, Presentation, BookOpen,
  Link2, ImageIcon, Download, Check, Loader2, ExternalLink, Archive
} from 'lucide-react'
import { isExternalPlatformVideo } from '@/lib/videoEmbed'

/* ─────────────────────────── Tipos ─────────────────────────── */

export type ResourceType = 'video' | 'pdf' | 'audio' | 'slides' | 'text' | 'link' | 'image'

export type LessonResource = {
  id: string
  title: string
  type: ResourceType
  url: string
  description?: string | null
  fileSize?: number | null   // bytes
  duration?: number | null   // segundos
  downloadable?: boolean
  isPremium?: boolean
}

type FilterKey = 'todos' | 'video' | 'pdf' | 'audio' | 'descargables'

/* ──────────────────── Presentación por tipo ──────────────────── */

const TYPE_META: Record<ResourceType, { label: string; accent: string; Icon: typeof Video }> = {
  video:  { label: 'Video',       accent: '#7B6DB5', Icon: Video },
  pdf:    { label: 'PDF',         accent: '#C9A84C', Icon: FileText },
  audio:  { label: 'Audio',       accent: '#4A9B7F', Icon: Headphones },
  slides: { label: 'Diapositivas', accent: '#C47A3A', Icon: Presentation },
  text:   { label: 'Lectura',     accent: '#6B8FA8', Icon: BookOpen },
  image:  { label: 'Imagen',      accent: '#7A9B4A', Icon: ImageIcon },
  link:   { label: 'Enlace',      accent: '#9B4A7F', Icon: Link2 },
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'video', label: 'Video' },
  { key: 'pdf', label: 'PDF' },
  { key: 'audio', label: 'Audio' },
  { key: 'descargables', label: 'Descargables' },
]

/* ───────────────────────── Utilidades ───────────────────────── */

function formatSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const mb = bytes / (1024 * 1024)
  return mb < 100 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`
}

function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`
  return `${m}:${String(s).padStart(2, '0')}`
}

function isDownloadable(r: LessonResource): boolean {
  if (r.downloadable === false) return false
  if (r.type === 'link') return false
  // Los videos alojados en plataformas externas (YouTube, Vimeo, Drive…) se ven, no se descargan.
  if (r.type === 'video' && isExternalPlatformVideo(r.url)) return false
  return true
}

function safeFileName(r: LessonResource): string {
  const clean = r.title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s._-]/g, '')
    .trim().replace(/\s+/g, '-')
  const fromUrl = r.url.split('?')[0].split('#')[0].split('.').pop() ?? ''
  const ext = /^[a-zA-Z0-9]{2,4}$/.test(fromUrl)
    ? fromUrl
    : ({ pdf: 'pdf', audio: 'mp3', video: 'mp4', slides: 'pdf', image: 'jpg', text: 'txt', link: 'txt' }[r.type])
  return `${clean || 'recurso'}.${ext}`
}

const STORAGE_KEY = 'wycliffe:recursos-completados'

function readLocal(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function writeLocal(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    /* modo privado o cuota llena: el estado sigue vivo en memoria */
  }
}

/* ───────────────────────── Componente ───────────────────────── */

export default function LessonResources({
  lessonId,
  lessonTitle,
  resources: resourcesProp,
  onCount,
}: {
  lessonId: string
  lessonTitle?: string
  /** Si la página ya trae los recursos, se usan y se omite el fetch. */
  resources?: LessonResource[]
  /** Informa al contenedor cuántos materiales tiene la lección. */
  onCount?: (n: number) => void
}) {
  const [resources, setResources] = useState<LessonResource[]>(resourcesProp ?? [])
  const [loading, setLoading] = useState(!resourcesProp)
  const [filter, setFilter] = useState<FilterKey>('todos')
  const [done, setDone] = useState<Set<string>>(new Set())
  const [zipping, setZipping] = useState(false)
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 })
  const [zipError, setZipError] = useState<string | null>(null)

  /* Carga de recursos + estado de completado */
  useEffect(() => {
    if (resourcesProp) { setResources(resourcesProp); return }
    let cancelled = false
    setLoading(true)
    fetch(`/api/lessons/${lessonId}/resources`)
      .then(r => r.json())
      .then((data: { resources?: LessonResource[]; completedIds?: string[] }) => {
        if (cancelled) return
        setResources(data.resources ?? [])
        onCount?.((data.resources ?? []).length)
        // La base de datos manda; localStorage cubre a quien aún no inicia sesión.
        const fromDb = new Set(data.completedIds ?? [])
        setDone(fromDb.size > 0 ? fromDb : readLocal())
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setResources([]); setLoading(false); onCount?.(0) } })
    return () => { cancelled = true }
  }, [lessonId, resourcesProp, onCount])

  useEffect(() => { setDone(prev => (prev.size ? prev : readLocal())) }, [])

  /* Marcar / desmarcar */
  const toggleDone = useCallback((id: string) => {
    setDone(prev => {
      const next = new Set(prev)
      const completed = !next.has(id)
      completed ? next.add(id) : next.delete(id)
      writeLocal(next)
      fetch('/api/resource-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: id, completed }),
      }).catch(() => { /* sin sesión: queda guardado en el navegador */ })
      return next
    })
  }, [])

  /* Filtros y conteos */
  const counts = useMemo(() => ({
    todos: resources.length,
    video: resources.filter(r => r.type === 'video').length,
    pdf: resources.filter(r => r.type === 'pdf').length,
    audio: resources.filter(r => r.type === 'audio').length,
    descargables: resources.filter(isDownloadable).length,
  }), [resources])

  const visible = useMemo(() => {
    if (filter === 'todos') return resources
    if (filter === 'descargables') return resources.filter(isDownloadable)
    return resources.filter(r => r.type === filter)
  }, [resources, filter])

  const downloadables = useMemo(() => resources.filter(isDownloadable), [resources])
  const completedCount = resources.filter(r => done.has(r.id)).length

  /* Descargar todo en un ZIP */
  const downloadAll = useCallback(async () => {
    if (!downloadables.length || zipping) return
    setZipping(true)
    setZipError(null)
    setZipProgress({ current: 0, total: downloadables.length })

    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      const failed: string[] = []

      for (let i = 0; i < downloadables.length; i++) {
        const r = downloadables[i]
        try {
          const res = await fetch(r.url)
          if (!res.ok) throw new Error(String(res.status))
          zip.file(safeFileName(r), await res.blob())
        } catch {
          failed.push(r.title)
        }
        setZipProgress({ current: i + 1, total: downloadables.length })
      }

      if (failed.length === downloadables.length) {
        setZipError('No se pudo empaquetar ningún archivo. Ábrelos uno por uno desde las tarjetas.')
        return
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `${(lessonTitle ?? 'leccion').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}-materiales.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)

      if (failed.length) {
        setZipError(`${failed.length} de ${downloadables.length} archivos quedaron fuera del ZIP: ${failed.join(', ')}. Ábrelos desde su tarjeta.`)
      }
    } catch {
      setZipError('La descarga se interrumpió. Vuelve a intentarlo.')
    } finally {
      setZipping(false)
    }
  }, [downloadables, lessonTitle, zipping])

  /* ─────────────────────────── Vistas ─────────────────────────── */

  if (loading) {
    return (
      <div className="mt-10 flex items-center gap-3 border-t border-[#C9A84C]/10 pt-6 text-[#F5EDD8]/35">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span className="font-cinzel text-[0.65rem] tracking-[0.25em]">CARGANDO MATERIALES</span>
      </div>
    )
  }

  if (!resources.length) {
    return (
      <section className="mt-10 border-t border-[#C9A84C]/10 pt-6">
        <h2 className="font-cinzel text-[0.65rem] uppercase tracking-[0.3em] text-[#C9A84C]/50">Materiales</h2>
        <p className="mt-3 font-serif text-sm italic text-[#F5EDD8]/30">
          Esta lección todavía no tiene materiales adjuntos.
        </p>
      </section>
    )
  }

  return (
    <section id="materiales" className="mt-12 scroll-mt-6 border-t border-[#C9A84C]/10 pt-7" aria-labelledby="materiales-heading">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="materiales-heading" className="font-cinzel text-[0.68rem] uppercase tracking-[0.3em] text-[#C9A84C]">
            Materiales de la lección
          </h2>
          <p className="mt-1.5 font-serif text-[0.78rem] text-[#F5EDD8]/40">
            {resources.length} {resources.length === 1 ? 'recurso' : 'recursos'} · {completedCount} revisado{completedCount === 1 ? '' : 's'}
          </p>
        </div>

        {downloadables.length > 0 && (
          <button
            onClick={downloadAll}
            disabled={zipping}
            className="group inline-flex items-center gap-2 rounded border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-4 py-2.5
                       font-cinzel text-[0.65rem] tracking-[0.18em] text-[#C9A84C]
                       transition-colors motion-safe:duration-200 hover:border-[#C9A84C]/60 hover:bg-[#C9A84C]/10
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84C]
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            {zipping ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                EMPAQUETANDO {zipProgress.current}/{zipProgress.total}
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5" aria-hidden />
                DESCARGAR TODO ({downloadables.length})
              </>
            )}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar materiales por formato">
        {FILTERS.map(f => {
          const n = counts[f.key]
          const active = filter === f.key
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={active}
              disabled={n === 0}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3.5 py-1.5 font-cinzel text-[0.6rem] tracking-[0.15em] transition-colors
                          motion-safe:duration-200 focus-visible:outline focus-visible:outline-2
                          focus-visible:outline-offset-2 focus-visible:outline-[#C9A84C]
                          disabled:cursor-not-allowed disabled:opacity-25
                          ${active
                            ? 'border-[#C9A84C] bg-[#C9A84C] text-[#021A38]'
                            : 'border-[#C9A84C]/20 text-[#F5EDD8]/45 hover:border-[#C9A84C]/45 hover:text-[#F5EDD8]/75'}`}
            >
              {f.label.toUpperCase()}
              <span className={active ? 'ml-1.5 text-[#021A38]/55' : 'ml-1.5 text-[#F5EDD8]/25'}>{n}</span>
            </button>
          )
        })}
      </div>

      {zipError && (
        <p role="status" className="mt-4 rounded border border-[#C47A3A]/30 bg-[#C47A3A]/5 px-3.5 py-2.5 font-serif text-[0.75rem] leading-relaxed text-[#C47A3A]">
          {zipError}
        </p>
      )}

      {/* Tarjetas: una columna en móvil, dos desde tablet */}
      <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {visible.map(r => {
          const meta = TYPE_META[r.type] ?? TYPE_META.text
          const { Icon, accent } = meta
          const completed = done.has(r.id)
          const size = formatSize(r.fileSize)
          const dur = formatDuration(r.duration)
          const canDownload = isDownloadable(r)

          return (
            <li
              key={r.id}
              className={`group relative flex gap-3.5 rounded-lg border p-4 transition-colors motion-safe:duration-200
                          ${completed
                            ? 'border-[#4A9B7F]/30 bg-[#4A9B7F]/[0.04]'
                            : 'border-[#C9A84C]/12 bg-white/[0.02] hover:border-[#C9A84C]/30'}`}
            >
              {/* Sigilo del formato */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border"
                style={{ borderColor: `${accent}44`, background: `${accent}14`, color: accent }}
                aria-hidden
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="font-cinzel text-[0.55rem] uppercase tracking-[0.2em]"
                      style={{ color: accent }}
                    >
                      {meta.label}
                    </span>
                    <h3 className="mt-1 font-serif text-[0.92rem] leading-snug text-[#F5EDD8]/85">
                      {r.title}
                    </h3>
                  </div>

                  {/* Marcar como revisado */}
                  <button
                    onClick={() => toggleDone(r.id)}
                    aria-pressed={completed}
                    aria-label={completed ? `Marcar "${r.title}" como pendiente` : `Marcar "${r.title}" como revisado`}
                    title={completed ? 'Revisado' : 'Marcar como revisado'}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors
                                motion-safe:duration-200 focus-visible:outline focus-visible:outline-2
                                focus-visible:outline-offset-2 focus-visible:outline-[#C9A84C]
                                ${completed
                                  ? 'border-[#4A9B7F] bg-[#4A9B7F] text-[#021A38]'
                                  : 'border-[#F5EDD8]/20 text-transparent hover:border-[#C9A84C]/60'}`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </button>
                </div>

                {r.description && (
                  <p className="mt-1.5 line-clamp-2 font-serif text-[0.78rem] leading-relaxed text-[#F5EDD8]/40">
                    {r.description}
                  </p>
                )}

                {/* Metadatos + acciones */}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-serif text-[0.68rem] text-[#F5EDD8]/30">
                  {dur && <span>{dur}</span>}
                  {size && <span>{size}</span>}
                  {r.isPremium && (
                    <span className="rounded-full border border-[#C9A84C]/30 px-2 py-0.5 text-[0.6rem] text-[#C9A84C]/70">
                      Premium
                    </span>
                  )}

                  <span className="ml-auto flex items-center gap-3">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#C9A84C]/75 transition-colors hover:text-[#E8C97A]
                                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84C]"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden />
                      Abrir
                    </a>
                    {canDownload && (
                      <a
                        href={r.url}
                        download={safeFileName(r)}
                        className="inline-flex items-center gap-1 text-[#F5EDD8]/45 transition-colors hover:text-[#F5EDD8]/80
                                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84C]"
                      >
                        <Download className="h-3 w-3" aria-hidden />
                        Descargar
                      </a>
                    )}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {visible.length === 0 && (
        <p className="mt-5 font-serif text-sm italic text-[#F5EDD8]/30">
          No hay materiales en este formato. Prueba con otro filtro.
        </p>
      )}
    </section>
  )
}
