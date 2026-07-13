'use client'
import { Emblem } from '@/app/components/Emblem'
import { useState, useEffect, useCallback } from 'react'

type Stats = { users: number; courses: number; enrollments: number; posts: number }
type User = { id: string; name: string | null; email: string; role: string; createdAt: string; _count: { enrollments: number; posts: number } }
type Course = { id: string; title: string; description: string; category: string; published: boolean; order: number; isFree: boolean; price: number; _count: { lessons: number; enrollments: number } }
type Lesson = { id: string; courseId: string; title: string; content: string; videoUrl: string | null; order: number }
type Tab = 'dashboard' | 'students' | 'courses' | 'new-course' | 'lessons' | 'payments'

const G = { gold: '#C9A84C', goldLight: '#E8C97A', goldDim: '#7a6230', ink: '#021A38', parchment: '#F5EDD8' }

const btn = (variant: 'primary' | 'secondary' | 'danger' | 'ghost', extra?: object) => ({
  padding: '0.4rem 0.9rem', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.12em',
  cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'opacity 0.2s',
  ...(variant === 'primary' ? { background: G.gold, color: G.ink, border: 'none', fontWeight: 'bold' } :
      variant === 'secondary' ? { background: 'transparent', border: `1px solid rgba(201,168,76,0.35)`, color: G.gold } :
      variant === 'danger' ? { background: 'transparent', border: '1px solid rgba(220,60,60,0.35)', color: '#E05555' } :
      { background: 'transparent', border: '1px solid rgba(245,237,216,0.15)', color: 'rgba(245,237,216,0.45)' }),
  ...extra
})

const input = (extra?: object) => ({
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)',
  borderRadius: '6px', padding: '0.7rem 1rem', color: G.parchment, fontSize: '0.88rem',
  outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'Georgia, serif', ...extra
})

const label = { display: 'block', fontSize: '0.62rem', letterSpacing: '0.25em', color: 'rgba(201,168,76,0.65)', marginBottom: '0.4rem' } as const
const card = { padding: '1.4rem', border: '1px solid rgba(201,168,76,0.14)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' } as const


function PaymentsTab() {
  const [data, setData] = useState<{payments: any[], total: number} | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/payments').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  const statusColor = (s: string) => s === 'approved' ? '#4A9B7F' : s === 'rejected' ? '#E05555' : '#C9A84C'
  const statusLabel = (s: string) => s === 'approved' ? 'APROBADO' : s === 'rejected' ? 'RECHAZADO' : 'PENDIENTE'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.2em', color: '#C9A84C', marginBottom: '0.3rem' }}>PAGOS</h1>
          <p style={{ color: 'rgba(245,237,216,0.4)', fontSize: '0.88rem', fontStyle: 'italic' }}>Historial de transacciones</p>
        </div>
        <a href="/precios" target="_blank" style={{ padding: '0.5rem 1.1rem', background: '#C9A84C', color: '#021A38', borderRadius: '5px', textDecoration: 'none', fontSize: '0.72rem', letterSpacing: '0.15em', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>VER PÁGINA DE PRECIOS ↗</a>
      </div>

      {!loading && data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Recaudado', value: `USD $${data.total.toFixed(2)}`, color: '#4A9B7F' },
            { label: 'Pagos Aprobados', value: data.payments.filter(p => p.status === 'approved').length, color: '#C9A84C' },
            { label: 'Total Transacciones', value: data.payments.length, color: '#7B6DB5' },
          ].map(s => (
            <div key={s.label} style={{ padding: '1.2rem', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(245,237,216,0.38)', marginTop: '0.25rem', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Cargando...</div> :
        !data?.payments.length ? (
          <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed rgba(201,168,76,0.12)', borderRadius: '8px' }}>
            <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Aún no hay transacciones registradas</p>
          </div>
        ) : (
          <div style={{ border: '1px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: '0.75rem', padding: '0.65rem 1.2rem', background: 'rgba(201,168,76,0.04)', borderBottom: '1px solid rgba(201,168,76,0.08)', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase' }}>
              <span>Usuario</span><span>Tipo</span><span>Monto</span><span>Estado</span><span>Fecha</span>
            </div>
            {data.payments.map((p: any, i: number) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: '0.75rem', padding: '0.85rem 1.2rem', alignItems: 'center', borderBottom: i < data.payments.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#F5EDD8' }}>{p.user?.name ?? '—'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(245,237,216,0.35)' }}>{p.user?.email}</div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(245,237,216,0.55)' }}>{p.type === 'subscription' ? '🔄 Suscripción' : '📖 Curso'}</div>
                <div style={{ fontSize: '0.88rem', color: '#4A9B7F', fontWeight: 'bold' }}>USD ${p.amount.toFixed(2)}</div>
                <div><span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', padding: '0.15rem 0.55rem', borderRadius: '20px', border: `1px solid ${statusColor(p.status)}40`, color: statusColor(p.status), background: `${statusColor(p.status)}10` }}>{statusLabel(p.status)}</span></div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.35)' }}>{new Date(p.createdAt).toLocaleDateString('es')}</div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

export default function RectorPanel() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: '', published: false, isFree: true, price: 0 })
  const [newLesson, setNewLesson] = useState({ title: '', content: '', videoUrl: '' })
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchStats = useCallback(async () => {
    const r = await fetch('/api/admin/stats'); if (r.ok) setStats(await r.json())
  }, [])
  const fetchUsers = useCallback(async () => {
    setLoading(true); const r = await fetch('/api/admin/users'); if (r.ok) setUsers(await r.json()); setLoading(false)
  }, [])
  const fetchCourses = useCallback(async () => {
    setLoading(true); const r = await fetch('/api/admin/courses'); if (r.ok) setCourses(await r.json()); setLoading(false)
  }, [])
  const fetchLessons = useCallback(async (courseId: string) => {
    setLoading(true); const r = await fetch(`/api/admin/lessons?courseId=${courseId}`); if (r.ok) setLessons(await r.json()); setLoading(false)
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => {
    if (tab === 'students') fetchUsers()
    if (tab === 'courses' || tab === 'new-course') fetchCourses()
    if (tab === 'lessons' && activeCourse) fetchLessons(activeCourse.id)
  }, [tab, activeCourse, fetchUsers, fetchCourses, fetchLessons])

  const openLessons = (course: Course) => { setActiveCourse(course); setTab('lessons'); setShowLessonForm(false); setEditLesson(null) }
  const updateUserRole = async (id: string, role: string) => {
    const r = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role }) })
    if (r.ok) { fetchUsers(); showToast('Rol actualizado ✓') }
  }
  const togglePublish = async (c: Course) => {
    await fetch('/api/admin/courses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, published: !c.published }) })
    fetchCourses(); showToast(c.published ? 'Curso ocultado' : 'Curso publicado ✓')
  }
  const deleteCourse = async (id: string) => {
    if (!confirm('¿Eliminar este curso y todas sus lecciones?')) return
    await fetch('/api/admin/courses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchCourses(); showToast('Curso eliminado')
  }
  const createCourse = async () => {
    if (!newCourse.title || !newCourse.description || !newCourse.category) { showToast('Completa todos los campos'); return }
    const r = await fetch('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCourse) })
    if (r.ok) { setNewCourse({ title: '', description: '', category: '', published: false, isFree: true, price: 0 }); setTab('courses'); showToast('¡Curso creado! ✓') }
  }
  const createLesson = async () => {
    if (!newLesson.title || !newLesson.content) { showToast('Título y contenido son requeridos'); return }
    const r = await fetch('/api/admin/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newLesson, courseId: activeCourse!.id, videoUrl: newLesson.videoUrl || null }) })
    if (r.ok) { setNewLesson({ title: '', content: '', videoUrl: '' }); setShowLessonForm(false); fetchLessons(activeCourse!.id); fetchCourses(); showToast('¡Lección creada! ✓') }
  }
  const saveEditLesson = async () => {
    if (!editLesson) return
    await fetch('/api/admin/lessons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editLesson) })
    setEditLesson(null); fetchLessons(activeCourse!.id); showToast('Lección actualizada ✓')
  }
  const deleteLesson = async (id: string) => {
    if (!confirm('¿Eliminar esta lección?')) return
    await fetch('/api/admin/lessons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchLessons(activeCourse!.id); fetchCourses(); showToast('Lección eliminada')
  }
  const moveLesson = async (lesson: Lesson, dir: -1 | 1) => {
    const newOrder = lesson.order + dir
    await fetch('/api/admin/lessons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lesson.id, order: newOrder }) })
    fetchLessons(activeCourse!.id)
  }

  const roleColor = (r: string) => r === 'RECTOR' ? G.gold : r === 'STUDENT' ? '#4A9B7F' : '#6B7280'

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'students', label: 'Discípulos', icon: '🕊' },
    { id: 'courses', label: 'Cursos', icon: '📖' },
    { id: 'new-course', label: 'Nuevo Curso', icon: '+' },
    { id: 'payments', label: 'Pagos', icon: '💳' },
  ]

  const sectionTitle = (title: string, subtitle?: string) => (
    <div style={{ marginBottom: '2rem' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.2em', color: G.gold, marginBottom: '0.3rem' }}>{title}</h1>
      {subtitle && <p style={{ color: 'rgba(245,237,216,0.4)', fontSize: '0.88rem', fontStyle: 'italic' }}>{subtitle}</p>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: G.ink, color: G.parchment, fontFamily: 'Georgia, serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1608', border: '1px solid rgba(201,168,76,0.5)', color: G.gold, padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.88rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

        {/* Sidebar */}
        <aside style={{ width: '220px', borderRight: '1px solid rgba(201,168,76,0.1)', padding: '2rem 0', flexShrink: 0, background: 'rgba(0,0,0,0.25)' }}>
          <div style={{ padding: '0 1.5rem 1.75rem', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem', filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.45))' }}>✠</div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.3em', color: G.gold, textTransform: 'uppercase' }}>Panel del</div>
            <div style={{ fontSize: '1.05rem', letterSpacing: '0.12em', color: G.goldLight, fontWeight: 'bold' }}>Rector</div>
          </div>
          <nav style={{ padding: '1.2rem 0' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ width: '100%', textAlign: 'left', padding: '0.65rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.65rem', background: tab === t.id ? 'rgba(201,168,76,0.09)' : 'transparent', borderLeft: `2px solid ${tab === t.id ? G.gold : 'transparent'}`, color: tab === t.id ? G.gold : 'rgba(245,237,216,0.45)', fontSize: '0.83rem', letterSpacing: '0.08em', cursor: 'pointer' }}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
            {tab === 'lessons' && activeCourse && (
              <div style={{ margin: '0.5rem 1rem', padding: '0.75rem', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: G.goldDim, marginBottom: '0.3rem' }}>EDITANDO</div>
                <div style={{ fontSize: '0.78rem', color: G.goldLight, lineHeight: 1.3 }}>{activeCourse.title}</div>
              </div>
            )}
          </nav>
          <div style={{ padding: '1rem 1.4rem', marginTop: '1rem' }}>
            <a href="/" style={{ display: 'block', textAlign: 'center', padding: '0.4rem', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'rgba(245,237,216,0.25)', textDecoration: 'none' }}>← SEMINARIO</a>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto', maxHeight: '100vh' }}>

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div>
              {sectionTitle('SEMINARIO WYCLIFFE', 'Visión general del seminario')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                {[
                  { label: 'Discípulos', value: stats?.users ?? '—', icon: '🕊', color: G.gold },
                  { label: 'Cursos', value: stats?.courses ?? '—', icon: '📖', color: '#4A9B7F' },
                  { label: 'Matrículas', value: stats?.enrollments ?? '—', icon: '📜', color: '#7B6DB5' },
                  { label: 'Posts', value: stats?.posts ?? '—', icon: '💬', color: '#C47A3A' },
                ].map(s => (
                  <div key={s.label} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: s.color, opacity: 0.7 }} />
                    <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.2em', color: 'rgba(245,237,216,0.4)', marginTop: '0.3rem', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={card}>
                  <h3 style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: G.gold, marginBottom: '1rem' }}>ACCESOS RÁPIDOS</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {([['students','🕊 Gestionar discípulos'],['courses','📖 Ver cursos'],['new-course','+ Crear nuevo curso']] as [Tab,string][]).map(([t,l]) => (
                      <button key={t} onClick={() => setTab(t)} style={{ textAlign: 'left', padding: '0.55rem 0.9rem', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '5px', color: 'rgba(245,237,216,0.65)', fontSize: '0.83rem', cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={card}>
                  <h3 style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: G.gold, marginBottom: '1rem' }}>ESTADO DEL SISTEMA</h3>
                  {[['Base de datos','Conectada'],['Autenticación','Activa'],['API Routes','Funcionando'],['Vercel Deploy','Online']].map(([l,s]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.83rem', color: 'rgba(245,237,216,0.55)' }}>{l}</span>
                      <span style={{ fontSize: '0.7rem', color: '#4A9B7F', letterSpacing: '0.08em' }}>● {s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENTS ── */}
          {tab === 'students' && (
            <div>
              {sectionTitle('DISCÍPULOS', 'Gestiona los roles y accesos de tu comunidad')}
              {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Cargando...</div> :
                users.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Aún no hay discípulos registrados</div> : (
                <div style={{ border: '1px solid rgba(201,168,76,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 60px 60px 120px', gap: '0.75rem', padding: '0.65rem 1.2rem', background: 'rgba(201,168,76,0.04)', borderBottom: '1px solid rgba(201,168,76,0.08)', fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(201,168,76,0.55)', textTransform: 'uppercase' }}>
                    <span>Nombre / Email</span><span>Rol</span><span>Cursos</span><span>Posts</span><span>Cambiar Rol</span>
                  </div>
                  {users.map((u, i) => (
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 60px 60px 120px', gap: '0.75rem', padding: '0.9rem 1.2rem', alignItems: 'center', borderBottom: i < users.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', color: G.parchment }}>{u.name ?? 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.38)' }}>{u.email}</div>
                      </div>
                      <div><span style={{ fontSize: '0.68rem', letterSpacing: '0.08em', padding: '0.18rem 0.65rem', borderRadius: '20px', border: `1px solid ${roleColor(u.role)}40`, color: roleColor(u.role), background: `${roleColor(u.role)}12` }}>{u.role}</span></div>
                      <div style={{ textAlign: 'center', fontSize: '0.88rem', color: G.gold }}>{u._count.enrollments}</div>
                      <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'rgba(245,237,216,0.45)' }}>{u._count.posts}</div>
                      <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)} style={{ background: '#1a1608', border: '1px solid rgba(201,168,76,0.2)', color: G.gold, padding: '0.3rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', width: '100%' }}>
                        <option value="VISITOR">VISITOR</option>
                        <option value="STUDENT">STUDENT</option>
                        <option value="RECTOR">RECTOR</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COURSES ── */}
          {tab === 'courses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>{sectionTitle('CURSOS', 'Gestiona el contenido académico del seminario')}</div>
                <button onClick={() => setTab('new-course')} style={btn('primary')}>+ NUEVO CURSO</button>
              </div>
              {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Cargando...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {courses.map(c => (
                    <div key={c.id} style={{ border: '1px solid rgba(201,168,76,0.13)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                      {/* Main row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.3rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.93rem', color: G.parchment }}>{c.title}</span>
                            <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', padding: '0.12rem 0.55rem', borderRadius: '20px', background: 'rgba(201,168,76,0.09)', border: '1px solid rgba(201,168,76,0.18)', color: G.gold }}>{c.category}</span>
                            {c.isFree
                              ? <span style={{ fontSize: '0.58rem', letterSpacing: '0.12em', padding: '0.1rem 0.45rem', borderRadius: '20px', background: 'rgba(74,155,127,0.1)', border: '1px solid rgba(74,155,127,0.2)', color: '#4A9B7F' }}>✓ GRATIS</span>
                              : <span style={{ fontSize: '0.58rem', letterSpacing: '0.1em', padding: '0.1rem 0.45rem', borderRadius: '20px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.18)', color: G.gold }}>💳 USD ${c.price}</span>
                            }
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(245,237,216,0.38)' }}>
                            {c._count.lessons} lecciones · {c._count.enrollments} matriculados
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: c.published ? '#4A9B7F' : 'rgba(245,237,216,0.28)' }}>● {c.published ? 'PUBLICADO' : 'OCULTO'}</span>
                          <button onClick={() => openLessons(c)} style={btn('primary', { fontSize: '0.68rem' })}>📝 LECCIONES</button>
                          <button onClick={() => togglePublish(c)} style={btn('secondary', { fontSize: '0.68rem' })}>{c.published ? 'OCULTAR' : 'PUBLICAR'}</button>
                          <button onClick={() => { setEditingPrice(editingPrice === c.id ? null : c.id); setPriceInput(c.isFree ? '' : String(c.price)) }}
                            style={{ padding: '0.3rem 0.7rem', background: editingPrice === c.id ? 'rgba(201,168,76,0.12)' : 'transparent', border: `1px solid ${editingPrice === c.id ? G.gold : 'rgba(201,168,76,0.2)'}`, borderRadius: '4px', color: G.gold, fontSize: '0.65rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                            💳 PRECIO
                          </button>
                          <button onClick={() => deleteCourse(c.id)} style={btn('danger', { fontSize: '0.68rem' })}>ELIMINAR</button>
                        </div>
                      </div>

                      {/* Inline price editor */}
                      {editingPrice === c.id && (
                        <div style={{ padding: '1rem 1.3rem', background: 'rgba(201,168,76,0.04)', borderTop: '1px solid rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', color: G.goldDim }}>MODALIDAD DE ACCESO</div>
                          {/* Toggle buttons */}
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={async () => {
                                await fetch('/api/admin/courses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, isFree: true, price: 0 }) })
                                fetchCourses(); setEditingPrice(null); showToast('Curso marcado como gratuito ✓')
                              }}
                              style={{ padding: '0.4rem 0.9rem', border: `1px solid ${c.isFree ? '#4A9B7F' : 'rgba(74,155,127,0.25)'}`, borderRadius: '5px', background: c.isFree ? 'rgba(74,155,127,0.12)' : 'transparent', color: c.isFree ? '#4A9B7F' : 'rgba(245,237,216,0.4)', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.12em', fontFamily: 'Georgia, serif' }}>
                              ✓ GRATUITO
                            </button>
                            <button
                              onClick={() => { /* just focus the price input */ document.getElementById(`price-${c.id}`)?.focus() }}
                              style={{ padding: '0.4rem 0.9rem', border: `1px solid ${!c.isFree ? G.gold : 'rgba(201,168,76,0.2)'}`, borderRadius: '5px', background: !c.isFree ? 'rgba(201,168,76,0.1)' : 'transparent', color: !c.isFree ? G.gold : 'rgba(245,237,216,0.4)', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.12em', fontFamily: 'Georgia, serif' }}>
                              💳 DE PAGO
                            </button>
                          </div>
                          {/* Price input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'rgba(245,237,216,0.5)' }}>USD $</span>
                            <input
                              id={`price-${c.id}`}
                              type="number" min="0.01" step="0.01"
                              value={priceInput}
                              onChange={e => setPriceInput(e.target.value)}
                              placeholder="0.00"
                              style={{ width: '90px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '5px', padding: '0.4rem 0.6rem', color: G.parchment, fontSize: '0.82rem', outline: 'none', fontFamily: 'Georgia, serif' }}
                            />
                            <button
                              onClick={async () => {
                                const p = parseFloat(priceInput)
                                if (!priceInput || isNaN(p) || p <= 0) { showToast('Ingresa un precio válido mayor a 0'); return }
                                await fetch('/api/admin/courses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, isFree: false, price: p }) })
                                fetchCourses(); setEditingPrice(null); showToast(`Precio actualizado: USD $${p.toFixed(2)} ✓`)
                              }}
                              style={{ padding: '0.4rem 0.85rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.7rem', letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
                              GUARDAR
                            </button>
                            <button onClick={() => setEditingPrice(null)}
                              style={{ padding: '0.4rem 0.65rem', background: 'transparent', border: '1px solid rgba(245,237,216,0.1)', borderRadius: '5px', color: 'rgba(245,237,216,0.35)', fontSize: '0.7rem', cursor: 'pointer' }}>
                              ✕
                            </button>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Precio actual: {c.isFree ? 'Gratuito' : `USD $${c.price}`}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NEW COURSE ── */}
          {tab === 'new-course' && (
            <div>
              {sectionTitle('NUEVO CURSO', 'Crea un nuevo curso para el seminario')}
              <div style={{ maxWidth: '580px', ...card }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {[{l:'TÍTULO DEL CURSO',k:'title',p:'Ej: Teología Sistemática I'},{l:'CATEGORÍA',k:'category',p:'Ej: Estudios Bíblicos, Teología, Historia, Ministerio'}].map(f => (
                    <div key={f.k}>
                      <label style={label}>{f.l}</label>
                      <input type="text" value={(newCourse as any)[f.k]} onChange={e => setNewCourse(p => ({...p,[f.k]:e.target.value}))} placeholder={f.p} style={input()} />
                    </div>
                  ))}
                  <div>
                    <label style={label}>DESCRIPCIÓN</label>
                    <textarea value={newCourse.description} onChange={e => setNewCourse(p => ({...p,description:e.target.value}))} placeholder="Describe el contenido y objetivo..." rows={4} style={input({resize:'vertical'})} />
                  </div>
                  {/* Precio */}
                  <div>
                    <label style={label}>MODALIDAD DE ACCESO</label>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.6rem' }}>
                      <button onClick={() => setNewCourse(p => ({...p, isFree: true, price: 0}))}
                        style={{ flex: 1, padding: '0.55rem', border: `1px solid ${newCourse.isFree ? '#4A9B7F' : 'rgba(245,237,216,0.12)'}`, borderRadius: '6px', background: newCourse.isFree ? 'rgba(74,155,127,0.1)' : 'transparent', color: newCourse.isFree ? '#4A9B7F' : 'rgba(245,237,216,0.4)', cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.15em', fontFamily: 'Georgia, serif' }}>
                        ✓ GRATUITO
                      </button>
                      <button onClick={() => setNewCourse(p => ({...p, isFree: false, price: p.price || 9}))}
                        style={{ flex: 1, padding: '0.55rem', border: `1px solid ${!newCourse.isFree ? '#C9A84C' : 'rgba(245,237,216,0.12)'}`, borderRadius: '6px', background: !newCourse.isFree ? 'rgba(201,168,76,0.08)' : 'transparent', color: !newCourse.isFree ? '#C9A84C' : 'rgba(245,237,216,0.4)', cursor: 'pointer', fontSize: '0.72rem', letterSpacing: '0.15em', fontFamily: 'Georgia, serif' }}>
                        💳 DE PAGO
                      </button>
                    </div>
                    {!newCourse.isFree && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', color: 'rgba(245,237,216,0.5)' }}>USD $</span>
                        <input type="number" min="1" step="0.01" value={newCourse.price || ''} onChange={e => setNewCourse(p => ({...p, price: parseFloat(e.target.value) || 0}))}
                          placeholder="Ej: 19.99" style={{...input(), width: '140px'}} />
                        <span style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>precio por curso</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <input type="checkbox" id="pub" checked={newCourse.published} onChange={e => setNewCourse(p => ({...p,published:e.target.checked}))} style={{ accentColor: G.gold, width:'15px', height:'15px', cursor:'pointer' }} />
                    <label htmlFor="pub" style={{ fontSize: '0.83rem', color: 'rgba(245,237,216,0.55)', cursor:'pointer' }}>Publicar inmediatamente</label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.3rem' }}>
                    <button onClick={createCourse} style={btn('primary', { flex:1, padding:'0.75rem' })}>CREAR CURSO ✓</button>
                    <button onClick={() => setTab('courses')} style={btn('ghost', { padding:'0.75rem 1.2rem' })}>Cancelar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LESSONS ── */}
          {tab === 'lessons' && activeCourse && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                  <button onClick={() => setTab('courses')} style={{ background: 'none', border: 'none', color: 'rgba(245,237,216,0.38)', fontSize: '0.78rem', cursor: 'pointer', marginBottom: '0.5rem', padding: 0 }}>← Volver a cursos</button>
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', letterSpacing: '0.15em', color: G.gold, marginBottom: '0.25rem' }}>LECCIONES</h1>
                  <p style={{ color: 'rgba(245,237,216,0.4)', fontSize: '0.83rem', fontStyle: 'italic' }}>{activeCourse.title}</p>
                </div>
                <button onClick={() => { setShowLessonForm(true); setEditLesson(null) }} style={btn('primary')}>+ NUEVA LECCIÓN</button>
              </div>

              {/* New lesson form */}
              {showLessonForm && !editLesson && (
                <div style={{ ...card, marginBottom: '1.5rem', borderColor: 'rgba(201,168,76,0.3)' }}>
                  <h3 style={{ fontSize: '0.72rem', letterSpacing: '0.22em', color: G.gold, marginBottom: '1.2rem' }}>NUEVA LECCIÓN</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={label}>TÍTULO DE LA LECCIÓN</label>
                      <input type="text" value={newLesson.title} onChange={e => setNewLesson(p => ({...p,title:e.target.value}))} placeholder="Ej: El Canon del Antiguo Testamento" style={input()} />
                    </div>
                    <div>
                      <label style={label}>CONTENIDO (texto de la lección)</label>
                      <textarea value={newLesson.content} onChange={e => setNewLesson(p => ({...p,content:e.target.value}))} placeholder="Escribe aquí el contenido completo de la lección..." rows={6} style={input({resize:'vertical'})} />
                    </div>
                    <div>
                      <label style={label}>URL DEL VIDEO (opcional)</label>
                      <input type="text" value={newLesson.videoUrl} onChange={e => setNewLesson(p => ({...p,videoUrl:e.target.value}))} placeholder="https://vimeo.com/... o https://youtube.com/..." style={input()} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button onClick={createLesson} style={btn('primary', { padding:'0.7rem 1.5rem' })}>GUARDAR LECCIÓN ✓</button>
                      <button onClick={() => setShowLessonForm(false)} style={btn('ghost', { padding:'0.7rem 1.2rem' })}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit lesson form */}
              {editLesson && (
                <div style={{ ...card, marginBottom: '1.5rem', borderColor: 'rgba(201,168,76,0.3)' }}>
                  <h3 style={{ fontSize: '0.72rem', letterSpacing: '0.22em', color: G.gold, marginBottom: '1.2rem' }}>EDITANDO LECCIÓN #{editLesson.order}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={label}>TÍTULO</label>
                      <input type="text" value={editLesson.title} onChange={e => setEditLesson(p => p ? {...p,title:e.target.value} : p)} style={input()} />
                    </div>
                    <div>
                      <label style={label}>CONTENIDO</label>
                      <textarea value={editLesson.content} onChange={e => setEditLesson(p => p ? {...p,content:e.target.value} : p)} rows={8} style={input({resize:'vertical'})} />
                    </div>
                    <div>
                      <label style={label}>URL DEL VIDEO (opcional)</label>
                      <input type="text" value={editLesson.videoUrl ?? ''} onChange={e => setEditLesson(p => p ? {...p,videoUrl:e.target.value} : p)} placeholder="https://..." style={input()} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button onClick={saveEditLesson} style={btn('primary', { padding:'0.7rem 1.5rem' })}>GUARDAR CAMBIOS ✓</button>
                      <button onClick={() => setEditLesson(null)} style={btn('ghost', { padding:'0.7rem 1.2rem' })}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lessons list */}
              {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Cargando lecciones...</div> :
                lessons.length === 0 ? (
                  <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📜</div>
                    <p style={{ color: 'rgba(245,237,216,0.4)', fontStyle: 'italic', marginBottom: '1rem' }}>Este curso aún no tiene lecciones</p>
                    <button onClick={() => setShowLessonForm(true)} style={btn('primary', { padding:'0.65rem 1.5rem' })}>+ CREAR PRIMERA LECCIÓN</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {lessons.sort((a,b) => a.order - b.order).map((l, i) => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.1rem 1.3rem', border: `1px solid ${editLesson?.id === l.id ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.12)'}`, borderRadius: '8px', background: editLesson?.id === l.id ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)' }}>
                        {/* Order badge */}
                        <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', color: G.goldDim }}>
                          {l.order}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.92rem', color: G.parchment, marginBottom: '0.3rem' }}>{l.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(245,237,216,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {l.content.substring(0, 100)}{l.content.length > 100 ? '...' : ''}
                          </div>
                          {l.videoUrl && <div style={{ fontSize: '0.7rem', color: '#4A9B7F', marginTop: '0.25rem' }}>🎥 Video adjunto</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <button onClick={() => moveLesson(l, -1)} disabled={i === 0} style={btn('ghost', { padding:'0.3rem 0.5rem', opacity: i===0 ? 0.3 : 1 })}>↑</button>
                          <button onClick={() => moveLesson(l, 1)} disabled={i === lessons.length-1} style={btn('ghost', { padding:'0.3rem 0.5rem', opacity: i===lessons.length-1 ? 0.3 : 1 })}>↓</button>
                          <button onClick={() => { setEditLesson(l); setShowLessonForm(false) }} style={btn('secondary', { fontSize:'0.68rem' })}>EDITAR</button>
                          <button onClick={() => deleteLesson(l.id)} style={btn('danger', { fontSize:'0.68rem' })}>ELIMINAR</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {tab === 'payments' && (
            <PaymentsTab />
          )}
        </main>
      </div>
    </div>
  )
}
