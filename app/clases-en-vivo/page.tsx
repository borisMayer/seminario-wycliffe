'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const G = { gold: '#C9A84C', goldLight: '#E8C97A', goldDim: '#7a6230', ink: '#021A38', parchment: '#F5EDD8', green: '#4A9B7F', red: '#E05555', purple: '#7B6DB5', orange: '#C47A3A' }

type Course = { id: string; title: string; category: string }
type Material = { name: string; url: string }
type LiveSession = {
  id: string; courseId: string | null; title: string; description: string | null
  meetingUrl: string; platform: string; scheduledAt: string; duration: number
  recordingUrl: string | null; materials: string | null; isGlobal: boolean; createdAt: string
  course: { id: string; title: string; category: string } | null
}

const PLATFORM_ICON: Record<string, string> = { zoom: '🔵', meet: '🟢', teams: '🟣', youtube: '🔴', other: '🎥' }
const PLATFORM_LABEL: Record<string, string> = { zoom: 'Zoom', meet: 'Google Meet', teams: 'Teams', youtube: 'YouTube Live', other: 'Enlace' }

const EMPTY_FORM = { courseId: '', title: '', description: '', meetingUrl: '', platform: 'zoom', scheduledAt: '', duration: '60', isGlobal: false, materials: [] as Material[], recordingUrl: '' }

const formatDate = (d: string) => new Date(d).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const formatTime = (d: string) => new Date(d).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
const isUpcoming = (d: string) => new Date(d) > new Date()
const isPast = (d: string) => new Date(d) < new Date()
const isLive = (d: string, dur: number) => {
  const start = new Date(d).getTime()
  const end = start + dur * 60000
  const now = Date.now()
  return now >= start && now <= end
}

export default function ClasesEnVivoPage() {
  const { data: session } = useSession()
  const isRector = (session?.user as any)?.role === 'RECTOR'

  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'proximas' | 'pasadas' | 'agenda'>('proximas')
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM })
  const [newMaterial, setNewMaterial] = useState({ name: '', url: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const fetchSessions = async () => {
    const [all, global] = await Promise.all([
      fetch('/api/live-sessions').then(r => r.json()),
      fetch('/api/live-sessions?global=true').then(r => r.json()),
    ])
    const combined = Array.isArray(all) ? all : []
    setSessions(combined)
    setLoading(false)
  }

  useEffect(() => {
    fetchSessions()
    // Fetch enrolled courses for student, all courses for rector
    const url = isRector ? '/api/admin/courses-all' : '/api/enrollments'
    fetch(url).then(r => r.json()).then(data => {
      if (isRector) setCourses(Array.isArray(data) ? data : [])
      else setCourses(Array.isArray(data) ? data.map((e: any) => e.course) : [])
    })
  }, [isRector])

  const upcoming = sessions.filter(s => isUpcoming(s.scheduledAt) || isLive(s.scheduledAt, s.duration))
  const past = sessions.filter(s => isPast(s.scheduledAt) && !isLive(s.scheduledAt, s.duration))

  const filtered = (list: LiveSession[]) => filterCourse === 'all' ? list : filterCourse === 'global' ? list.filter(s => s.isGlobal) : list.filter(s => s.courseId === filterCourse)

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setShowForm(false); setEditingId(null); setNewMaterial({ name: '', url: '' }) }

  const startEdit = (s: LiveSession) => {
    const mats = s.materials ? JSON.parse(s.materials) : []
    setForm({
      courseId: s.courseId ?? '', title: s.title, description: s.description ?? '',
      meetingUrl: s.meetingUrl, platform: s.platform,
      scheduledAt: new Date(s.scheduledAt).toISOString().slice(0, 16),
      duration: String(s.duration), isGlobal: s.isGlobal,
      materials: mats, recordingUrl: s.recordingUrl ?? ''
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const submitForm = async () => {
    if (!form.title || !form.meetingUrl || !form.scheduledAt) { showToast('Título, link y fecha son requeridos'); return }
    setSubmitting(true)
    const url = editingId ? `/api/live-sessions/${editingId}` : '/api/live-sessions'
    const method = editingId ? 'PATCH' : 'POST'
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, courseId: form.courseId || null, materials: form.materials })
    })
    if (r.ok) {
      const saved = await r.json()
      if (editingId) setSessions(p => p.map(s => s.id === editingId ? saved : s))
      else setSessions(p => [...p, saved].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()))
      showToast(editingId ? 'Clase actualizada ✓' : 'Clase creada ✓')
      resetForm()
    } else { const d = await r.json(); showToast(d.error ?? 'Error') }
    setSubmitting(false)
  }

  const deleteSession = async (id: string) => {
    if (!confirm('¿Eliminar esta clase?')) return
    const r = await fetch(`/api/live-sessions/${id}`, { method: 'DELETE' })
    if (r.ok) { setSessions(p => p.filter(s => s.id !== id)); showToast('Clase eliminada') }
  }

  const SessionCard = ({ s }: { s: LiveSession }) => {
    const live = isLive(s.scheduledAt, s.duration)
    const past = isPast(s.scheduledAt) && !live
    const mats: Material[] = s.materials ? JSON.parse(s.materials) : []
    const courseColor = s.course ? ({ 'Mística': G.gold, 'Psicología': G.green, 'Teología': G.purple, 'Práctica': G.orange }[s.course.category] ?? G.gold) : G.gold

    return (
      <div style={{ border: `1px solid ${live ? 'rgba(224,85,85,0.4)' : 'rgba(201,168,76,0.12)'}`, borderRadius: '10px', overflow: 'hidden', background: live ? 'rgba(224,85,85,0.03)' : 'rgba(255,255,255,0.02)', position: 'relative' }}>
        {/* Live indicator */}
        {live && (
          <div style={{ position: 'absolute', top: '0.85rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: G.red, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: G.red, fontFamily: 'Georgia, serif' }}>EN VIVO</span>
          </div>
        )}

        <div style={{ padding: '1.2rem 1.4rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '1.6rem', flexShrink: 0, marginTop: '0.1rem' }}>{PLATFORM_ICON[s.platform]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                {s.isGlobal && <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', padding: '0.12rem 0.5rem', borderRadius: '20px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: G.gold }}>GENERAL</span>}
                {s.course && <span style={{ fontSize: '0.58rem', letterSpacing: '0.14em', padding: '0.12rem 0.5rem', borderRadius: '20px', background: `${courseColor}12`, border: `1px solid ${courseColor}30`, color: courseColor }}>{s.course.title}</span>}
              </div>
              <h3 style={{ fontSize: '1rem', color: G.parchment, lineHeight: 1.3, marginBottom: '0.25rem' }}>{s.title}</h3>
              {s.description && <p style={{ fontSize: '0.82rem', color: 'rgba(245,237,216,0.5)', lineHeight: 1.6 }}>{s.description}</p>}
            </div>
          </div>

          {/* Date / time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem', padding: '0.65rem 0.9rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>📅</span>
              <span style={{ fontSize: '0.82rem', color: past ? 'rgba(245,237,216,0.35)' : G.parchment }}>{formatDate(s.scheduledAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>🕐</span>
              <span style={{ fontSize: '0.82rem', color: past ? 'rgba(245,237,216,0.35)' : G.parchment }}>{formatTime(s.scheduledAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(245,237,216,0.35)' }}>⏱ {s.duration} min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(245,237,216,0.35)' }}>{PLATFORM_LABEL[s.platform]}</span>
            </div>
          </div>

          {/* Materials */}
          {mats.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: G.goldDim, marginBottom: '0.4rem' }}>MATERIALES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {mats.map((m, i) => (
                  <a key={i} href={m.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: G.gold, textDecoration: 'none', padding: '0.25rem 0.65rem', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', background: 'rgba(201,168,76,0.05)' }}>
                    📎 {m.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!past && (
              <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', background: live ? G.red : G.gold, color: G.ink, borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.15em', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
                {live ? '▶ UNIRSE AHORA' : '🔗 VER ENLACE'}
              </a>
            )}
            {past && s.recordingUrl && (
              <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', background: 'rgba(123,109,181,0.15)', border: '1px solid rgba(123,109,181,0.35)', color: G.purple, borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '0.15em', fontFamily: 'Georgia, serif' }}>
                🎬 VER GRABACIÓN
              </a>
            )}
            {past && !s.recordingUrl && (
              <span style={{ fontSize: '0.75rem', color: 'rgba(245,237,216,0.25)', fontStyle: 'italic' }}>Sin grabación disponible</span>
            )}
            {isRector && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => startEdit(s)}
                  style={{ padding: '0.35rem 0.7rem', background: 'transparent', border: `1px solid ${G.gold}35`, borderRadius: '4px', color: G.gold, fontSize: '0.65rem', letterSpacing: '0.1em', cursor: 'pointer' }}>EDITAR</button>
                <button onClick={() => deleteSession(s.id)}
                  style={{ padding: '0.35rem 0.7rem', background: 'transparent', border: '1px solid rgba(224,85,85,0.25)', borderRadius: '4px', color: 'rgba(224,85,85,0.5)', fontSize: '0.65rem', cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: G.ink, color: G.parchment, fontFamily: 'Georgia, serif' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1608', border: '1px solid rgba(201,168,76,0.5)', color: G.gold, padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast}</div>}

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(245,237,216,0.3)', textDecoration: 'none' }}>← INICIO</Link>
          <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: G.gold }}>🎥 CLASES EN VIVO</span>
        </div>
        {isRector && (
          <button onClick={() => { resetForm(); setShowForm(true) }}
            style={{ padding: '0.5rem 1.2rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
            + NUEVA CLASE
          </button>
        )}
      </header>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* Rector form */}
        {showForm && isRector && (
          <div style={{ padding: '1.5rem', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', background: 'rgba(201,168,76,0.03)', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: G.gold, marginBottom: '1.2rem' }}>{editingId ? 'EDITAR CLASE' : 'NUEVA CLASE EN VIVO'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Título de la clase *"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif' }} />
              <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}
                style={{ background: '#1a1608', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif' }}>
                {Object.entries(PLATFORM_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <input value={form.meetingUrl} onChange={e => setForm(p => ({ ...p, meetingUrl: e.target.value }))} placeholder="Link de la reunión *"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif', gridColumn: '1/-1' }} />
              <input value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} type="datetime-local"
                style={{ background: '#1a1608', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif' }} />
              <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="Duración (minutos)" type="number"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif' }} />
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
                style={{ background: '#1a1608', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif' }}>
                <option value="">Sin curso (general)</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '5px' }}>
                <input type="checkbox" id="isGlobal" checked={form.isGlobal} onChange={e => setForm(p => ({ ...p, isGlobal: e.target.checked }))} style={{ accentColor: G.gold }} />
                <label htmlFor="isGlobal" style={{ fontSize: '0.82rem', color: 'rgba(245,237,216,0.6)', cursor: 'pointer' }}>Visible en agenda general</label>
              </div>
              <input value={form.recordingUrl} onChange={e => setForm(p => ({ ...p, recordingUrl: e.target.value }))} placeholder="URL grabación (después de la clase)"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif', gridColumn: '1/-1' }} />
            </div>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción de la clase..." rows={2}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', resize: 'none', outline: 'none', fontFamily: 'Georgia, serif', marginBottom: '0.75rem', boxSizing: 'border-box' }} />

            {/* Materials */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: G.goldDim, marginBottom: '0.5rem' }}>MATERIALES ADJUNTOS</div>
              {form.materials.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', padding: '0.4rem 0.7rem', background: 'rgba(255,255,255,0.03)', borderRadius: '5px' }}>
                  <span style={{ fontSize: '0.82rem', color: G.gold, flex: 1 }}>📎 {m.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.35)', flex: 2 }}>{m.url.substring(0, 40)}...</span>
                  <button onClick={() => setForm(p => ({ ...p, materials: p.materials.filter((_, j) => j !== i) }))}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(224,85,85,0.5)', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.4rem', marginTop: '0.4rem' }}>
                <input value={newMaterial.name} onChange={e => setNewMaterial(p => ({ ...p, name: e.target.value }))} placeholder="Nombre del material"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '5px', padding: '0.45rem 0.65rem', color: G.parchment, fontSize: '0.78rem', outline: 'none', fontFamily: 'Georgia, serif' }} />
                <input value={newMaterial.url} onChange={e => setNewMaterial(p => ({ ...p, url: e.target.value }))} placeholder="URL del material"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '5px', padding: '0.45rem 0.65rem', color: G.parchment, fontSize: '0.78rem', outline: 'none', fontFamily: 'Georgia, serif' }} />
                <button onClick={() => { if (newMaterial.name && newMaterial.url) { setForm(p => ({ ...p, materials: [...p.materials, newMaterial] })); setNewMaterial({ name: '', url: '' }) } }}
                  style={{ padding: '0.45rem 0.75rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '5px', color: G.gold, fontSize: '0.72rem', cursor: 'pointer' }}>+ AGREGAR</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={submitForm} disabled={submitting}
                style={{ padding: '0.6rem 1.5rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
                {submitting ? '...' : editingId ? 'GUARDAR' : 'CREAR CLASE'}
              </button>
              <button onClick={resetForm} style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid rgba(245,237,216,0.12)', borderRadius: '5px', color: 'rgba(245,237,216,0.4)', fontSize: '0.72rem', cursor: 'pointer' }}>CANCELAR</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {([['proximas', '📅 Próximas'], ['pasadas', '🎬 Pasadas'], ['agenda', '🗓 Agenda completa']] as [string, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as any)}
                style={{ padding: '0.4rem 0.9rem', background: tab === id ? G.gold : 'transparent', color: tab === id ? G.ink : 'rgba(245,237,216,0.5)', border: `1px solid ${tab === id ? G.gold : 'rgba(201,168,76,0.2)'}`, borderRadius: '20px', fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: tab === id ? 'bold' : 'normal' }}>
                {label}
              </button>
            ))}
          </div>
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
            style={{ background: '#1a1608', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '5px', padding: '0.4rem 0.8rem', color: 'rgba(245,237,216,0.6)', fontSize: '0.78rem', outline: 'none', fontFamily: 'Georgia, serif' }}>
            <option value="all">Todos los cursos</option>
            <option value="global">Solo generales</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Cargando clases...</div>
        ) : (
          <>
            {tab === 'proximas' && (
              <div>
                {/* Live now banner */}
                {filtered(upcoming).some(s => isLive(s.scheduledAt, s.duration)) && (
                  <div style={{ padding: '1rem 1.4rem', background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: G.red, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: G.red }}>Hay una clase en curso ahora mismo</span>
                  </div>
                )}
                {filtered(upcoming).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(201,168,76,0.12)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
                    <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>No hay clases próximas programadas</p>
                    {isRector && <button onClick={() => { resetForm(); setShowForm(true) }} style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>+ PROGRAMAR CLASE</button>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered(upcoming).map(s => <SessionCard key={s.id} s={s} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'pasadas' && (
              <div>
                {filtered(past).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(201,168,76,0.12)', borderRadius: '10px' }}>
                    <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>No hay clases pasadas registradas</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered(past).reverse().map(s => <SessionCard key={s.id} s={s} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'agenda' && (
              <div>
                {sessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(201,168,76,0.12)', borderRadius: '10px' }}>
                    <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Sin clases programadas aún</p>
                  </div>
                ) : (
                  // Group by month
                  (() => {
                    const grouped: Record<string, LiveSession[]> = {}
                    filtered([...sessions].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())).forEach(s => {
                      const key = new Date(s.scheduledAt).toLocaleDateString('es', { month: 'long', year: 'numeric' })
                      if (!grouped[key]) grouped[key] = []
                      grouped[key].push(s)
                    })
                    return Object.entries(grouped).map(([month, items]) => (
                      <div key={month} style={{ marginBottom: '2rem' }}>
                        <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: G.goldDim, textTransform: 'uppercase', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>{month}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {items.map(s => <SessionCard key={s.id} s={s} />)}
                        </div>
                      </div>
                    ))
                  })()
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
