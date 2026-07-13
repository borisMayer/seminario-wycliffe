'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'

type Course = { id: string; title: string; description: string; category: string; price: number; isFree: boolean; _count: { lessons: number; enrollments: number } }

const G = { gold: '#C9A84C', goldLight: '#E8C97A', ink: '#021A38', parchment: '#F5EDD8', green: '#4A9B7F' }
const categoryColors: Record<string, string> = {
  'Mística': '#C9A84C', 'Psicología': '#4A9B7F', 'Teología': '#7B6DB5', 'Práctica': '#C47A3A'
}

export default function CursosPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<Course | null>(null)
  const [paying, setPaying] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(setCourses).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (session) {
      fetch('/api/enrollments').then(r => r.json()).then((data: any[]) => {
        setEnrolledIds(new Set(data.map((e: any) => e.courseId)))
      })
    }
  }, [session])

  const enrollFree = async (courseId: string) => {
    setEnrolling(courseId)
    const r = await fetch('/api/enrollments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId }) })
    if (r.ok) { setEnrolledIds(p => new Set([...p, courseId])); showToast('¡Matriculado exitosamente! ✓') }
    else { const d = await r.json(); showToast(d.error ?? 'Error al matricularse') }
    setEnrolling(null)
    setModal(null)
  }

  const payCourse = async (courseId: string) => {
    setPaying('course')
    const r = await fetch('/api/payments/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'course', courseId })
    })
    const data = await r.json()
    if (data.checkoutUrl) window.location.href = data.checkoutUrl
    else { showToast(data.error ?? 'Error al procesar pago'); setPaying(null) }
  }

  const paySubscription = async () => {
    setPaying('subscription')
    const r = await fetch('/api/payments/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'subscription' })
    })
    const data = await r.json()
    if (data.checkoutUrl) window.location.href = data.checkoutUrl
    else { showToast(data.error ?? 'Error al procesar pago'); setPaying(null) }
  }

  const unenroll = async (courseId: string) => {
    setEnrolling(courseId)
    await fetch('/api/enrollments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId }) })
    setEnrolledIds(p => { const n = new Set(p); n.delete(courseId); return n })
    showToast('Matrícula cancelada')
    setEnrolling(null)
  }

  const handleEnrollClick = (course: Course) => {
    if (!session) { window.location.href = '/auth/signin'; return }
    setModal(course)
    setPaying(null)
  }

  return (
    <div className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1a1608] border border-[#C9A84C]/50 text-[#C9A84C] px-5 py-3 rounded-lg text-sm font-cinzel tracking-wider shadow-xl">{toast}</div>
      )}

      {/* MODAL DE OPCIONES DE PAGO */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#110e08', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '14px', padding: '2.5rem', maxWidth: '500px', width: '100%', position: 'relative', boxShadow: '0 25px 80px rgba(0,0,0,0.8)' }}>
            <button onClick={() => { setModal(null); setPaying(null) }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'rgba(245,237,216,0.25)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Emblem size={44} />
              </div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.28em', color: categoryColors[modal.category] ?? G.gold, marginBottom: '0.35rem', textTransform: 'uppercase' }}>{modal.category}</div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', color: G.parchment, lineHeight: 1.4, marginBottom: '0.4rem' }}>{modal.title}</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(245,237,216,0.4)', fontStyle: 'italic' }}>Elige cómo acceder a este curso</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* OPCIÓN 1: SOLO ESTE CURSO — siempre visible */}
              <div style={{ padding: '1.1rem 1.3rem', border: '1px solid rgba(201,168,76,0.22)', borderRadius: '10px', background: 'rgba(201,168,76,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.65rem', letterSpacing: '0.22em', color: G.gold }}>SOLO ESTE CURSO</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: G.parchment }}>
                    {modal.isFree ? 'Gratis' : `USD $${modal.price > 0 ? modal.price.toFixed(2) : '9.00'}`}
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'rgba(245,237,216,0.4)', marginBottom: '0.75rem' }}>
                  {modal.isFree ? 'Acceso libre para estudiantes registrados. Sin costo.' : 'Acceso permanente a este curso. Pago único, sin suscripción.'}
                </p>
                {modal.isFree ? (
                  <button onClick={() => enrollFree(modal.id)} disabled={enrolling === modal.id}
                    style={{ width: '100%', padding: '0.65rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '6px', fontSize: '0.72rem', letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', opacity: enrolling === modal.id ? 0.6 : 1 }}>
                    {enrolling === modal.id ? 'MATRICULANDO...' : 'ACCEDER A ESTE CURSO →'}
                  </button>
                ) : (
                  <button onClick={() => payCourse(modal.id)} disabled={paying !== null}
                    style={{ width: '100%', padding: '0.65rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '6px', fontSize: '0.72rem', letterSpacing: '0.18em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', opacity: paying === 'course' ? 0.6 : 1 }}>
                    {paying === 'course' ? 'REDIRIGIENDO A PAGO...' : 'PAGAR ESTE CURSO →'}
                  </button>
                )}
              </div>

              {/* SUSCRIPCIÓN */}
              <div style={{ padding: '1.1rem 1.3rem', border: '1px solid rgba(123,109,181,0.28)', borderRadius: '10px', background: 'rgba(123,109,181,0.04)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, #7B6DB5, #C9A84C)' }} />
                <div style={{ position: 'absolute', top: '0.65rem', right: '0.85rem', fontSize: '0.52rem', letterSpacing: '0.15em', padding: '0.12rem 0.45rem', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '20px', color: G.gold }}>MEJOR VALOR</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.65rem', letterSpacing: '0.22em', color: '#9d95c8' }}>PLAN DISCÍPULO</span>
                  <div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: G.parchment }}>USD $19.99</span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.35)' }}>/mes</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'rgba(245,237,216,0.4)', marginBottom: '0.75rem' }}>
                  <strong style={{ color: G.parchment }}>Todos los cursos</strong> + biblioteca sagrada completa + soporte del Rector.
                </p>
                <button onClick={paySubscription} disabled={paying !== null}
                  style={{ width: '100%', padding: '0.65rem', background: 'rgba(123,109,181,0.18)', color: '#b0a8d8', border: '1px solid rgba(123,109,181,0.35)', borderRadius: '6px', fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', opacity: paying === 'subscription' ? 0.6 : 1 }}>
                  {paying === 'subscription' ? 'REDIRIGIENDO A PAGO...' : 'SUSCRIBIRME — TODOS LOS CURSOS →'}
                </button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link href="/precios" style={{ fontSize: '0.7rem', color: 'rgba(201,168,76,0.35)', textDecoration: 'none', letterSpacing: '0.1em' }}>
                  Ver todos los planes →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <Link href="/" className="font-cinzel text-xs tracking-[0.4em] text-[#7a6230] hover:text-[#C9A84C] transition-colors">← SEMINARIO WYCLIFFE</Link>
        <h1 className="font-cinzel text-3xl text-[#C9A84C] mt-2 tracking-widest">AULA VIRTUAL</h1>
        {!session && (
          <p className="text-[#F5EDD8]/40 text-sm mt-3 italic">
            <Link href="/auth/signin" className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">Inicia sesión</Link> o{' '}
            <Link href="/auth/registro" className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">regístrate</Link> para matricularte en cursos
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#F5EDD8]/30 italic font-cinzel">Cargando cursos...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {courses.map((course) => {
            const enrolled = enrolledIds.has(course.id)
            const color = categoryColors[course.category] ?? '#C9A84C'
            return (
              <div key={course.id} className="p-6 border border-[#C9A84C]/15 rounded-lg bg-white/[0.02] hover:border-[#C9A84C]/30 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: color }} />
                <div className="flex justify-between items-start mb-3">
                  <span className="font-cinzel text-xs tracking-widest px-3 py-1 rounded-full" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                    {course.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {course.isFree
                      ? <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: '#4A9B7F', background: 'rgba(74,155,127,0.08)', border: '1px solid rgba(74,155,127,0.2)', padding: '0.12rem 0.5rem', borderRadius: '20px' }}>GRATIS</span>
                      : <span style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.35)' }}>USD ${course.price > 0 ? course.price : '9'}</span>
                    }
                    {enrolled && <span className="font-cinzel text-xs tracking-widest text-[#4A9B7F]">● MATRICULADO</span>}
                  </div>
                </div>
                <h2 className="font-cinzel text-[#F5EDD8] text-lg mb-2 group-hover:text-[#E8C97A] transition-colors leading-snug">{course.title}</h2>
                <p className="text-[#F5EDD8]/45 text-sm leading-relaxed mb-4">{course.description}</p>
                <div className="flex justify-between items-center text-xs text-[#F5EDD8]/30 mb-4">
                  <span>{course._count.lessons} lecciones</span>
                  <span>{course._count.enrollments} estudiantes</span>
                </div>
                {enrolled ? (
                  <div className="flex gap-2">
                    <Link href={`/cursos/${course.id}`} className="flex-1 py-2 text-center bg-[#C9A84C] text-[#021A38] font-cinzel text-xs tracking-widest rounded hover:bg-[#E8C97A] transition-colors font-semibold">
                      CONTINUAR →
                    </Link>
                    <button onClick={() => unenroll(course.id)} disabled={enrolling === course.id}
                      className="px-3 py-2 border border-red-400/20 text-red-400/60 font-cinzel text-xs rounded hover:border-red-400/40 transition-colors disabled:opacity-50">
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleEnrollClick(course)} disabled={enrolling === course.id}
                    className="w-full py-2 border border-[#C9A84C]/30 text-[#C9A84C] font-cinzel text-xs tracking-widest rounded hover:bg-[#C9A84C]/10 transition-colors disabled:opacity-50">
                    {enrolling === course.id ? 'MATRICULANDO...' : 'MATRICULARME →'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
