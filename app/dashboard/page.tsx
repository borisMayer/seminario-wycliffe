'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'

type Course = { id: string; title: string; category: string; description: string; _count: { lessons: number } }
type Enrollment = { id: string; courseId: string; createdAt: string; course: Course & { _count: { lessons: number } } }
type Progress = { lessonId: string; completed: boolean }
type ForumPost = { id: string; title: string; createdAt: string; _count: { comments: number } }
type Grade = { id: string; assignmentId: string; userId: string; score: number; comment: string | null; assignment: { title: string; weight: number; course: { id: string; title: string; category: string } } }
type Assignment = { id: string; courseId: string; title: string; weight: number; type: string }

const G = { gold: '#C9A84C', goldLight: '#E8C97A', goldDim: '#7a6230', ink: '#021A38', parchment: '#F5EDD8' }

const categoryColor: Record<string, string> = {
  'Mística': '#C9A84C', 'Psicología': '#4A9B7F', 'Teología': '#7B6DB5', 'Práctica': '#C47A3A'
}

const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`
  if (diff < 2592000) return `hace ${Math.floor(diff/86400)}d`
  return new Date(date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

const scoreColor = (s: number) => s >= 90 ? '#4A9B7F' : s >= 70 ? '#C9A84C' : s >= 50 ? '#C47A3A' : '#E05555'
const scoreLabel = (s: number) => s >= 90 ? 'Excelente' : s >= 70 ? 'Bueno' : s >= 50 ? 'Suficiente' : 'Insuficiente'

const Ring = ({ pct, size = 80, color = G.gold }: { pct: number; size?: number; color?: string }) => {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={pct === 100 ? '#4A9B7F' : color} fontSize={size * 0.22} fontFamily="Georgia, serif"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
        {pct}%
      </text>
    </svg>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState<Grade[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [showNotasDetail, setShowNotasDetail] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') return
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/enrollments').then(r => r.json()),
      fetch('/api/progress').then(r => r.json()),
      fetch('/api/forum').then(r => r.json()),
      fetch('/api/grades').then(r => r.json()),
    ]).then(([enr, prog, forum, gr]) => {
      setEnrollments(Array.isArray(enr) ? enr : [])
      setProgress(Array.isArray(prog) ? prog : [])
      const userId = (session?.user as any)?.id
      setPosts(Array.isArray(forum) ? forum.filter((p: any) => p.user?.id === userId).slice(0, 5) : [])
      setGrades(Array.isArray(gr) ? gr : [])
      // Fetch all assignments for enrolled courses
      if (Array.isArray(enr) && enr.length > 0) {
        Promise.all(enr.map((e: any) => fetch(`/api/assignments?courseId=${e.courseId}`).then(r => r.json())))
          .then(results => setAssignments(results.flat().filter(Boolean)))
      }
      setLoading(false)
    })
  }, [status, session])

  if (status === 'unauthenticated') return (
    <div style={{ minHeight: '100vh', background: G.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{display:"flex",justifyContent:"center"}}><Emblem size={60}/></div>
        <p style={{ fontFamily: 'Georgia, serif', color: 'rgba(201,168,76,0.6)', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>ACCESO RESTRINGIDO</p>
        <Link href="/auth/signin" style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.2em', padding: '0.75rem 2rem', background: G.gold, color: G.ink, borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>INICIAR SESIÓN →</Link>
      </div>
    </div>
  )

  // Compute stats
  const completedLessons = progress.filter(p => p.completed).length
  const totalLessons = enrollments.reduce((acc, e) => acc + (e.course._count.lessons ?? 0), 0)
  const globalPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const courseProgress = enrollments.map(e => {
    const courseLessons = e.course._count.lessons ?? 0
    // We don't have lesson IDs per course here, so we approximate from total
    const completed = progress.filter(p => p.completed).length
    return { ...e, courseLessons, pct: courseLessons > 0 ? Math.min(100, Math.round((completed / Math.max(totalLessons, 1)) * 100)) : 0 }
  })

  const userName = (session?.user as any)?.name ?? session?.user?.email ?? 'Discípulo'
  const isRector = (session?.user as any)?.role === 'RECTOR'

  return (
    <div style={{ minHeight: '100vh', background: G.ink, color: G.parchment, fontFamily: 'Georgia, serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(245,237,216,0.3)', textDecoration: 'none' }}>← INICIO</Link>
          <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: G.gold }}>🎓 MI PROGRESO</span>
        </div>
        {isRector && (
          <Link href="/rector" style={{ fontFamily: 'Georgia, serif', fontSize: '0.72rem', letterSpacing: '0.15em', padding: '0.4rem 1rem', background: G.gold, color: G.ink, borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>⚙ PANEL RECTOR</Link>
        )}
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: G.gold, flexShrink: 0 }}>
            {userName[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.35em', color: G.goldDim, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Salve,</div>
            <h1 style={{ fontSize: '1.6rem', color: G.goldLight, letterSpacing: '0.08em' }}>{userName}</h1>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(245,237,216,0.25)', fontStyle: 'italic' }}>Cargando tu progreso...</div>
        ) : (
          <>
            {/* Global stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'Cursos Activos', value: enrollments.length, icon: '📖', color: G.gold },
                { label: 'Lecciones Completadas', value: completedLessons, icon: '✓', color: '#4A9B7F' },
                { label: 'Total Lecciones', value: totalLessons, icon: '📜', color: '#7B6DB5' },
                { label: 'Posts en Foro', value: posts.length, icon: '🕊', color: '#C47A3A' },
              ].map(s => (
                <div key={s.label} style={{ padding: '1.2rem', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: s.color, opacity: 0.6 }} />
                  <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{s.icon}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', color: 'rgba(245,237,216,0.38)', marginTop: '0.3rem', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Global progress ring + bar */}
            <div style={{ padding: '1.8rem', border: '1px solid rgba(201,168,76,0.14)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <Ring pct={globalPct} size={90} color={globalPct === 100 ? '#4A9B7F' : G.gold} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: G.goldDim, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Progreso Global</div>
                <div style={{ fontSize: '1.1rem', color: globalPct === 100 ? '#4A9B7F' : G.parchment, marginBottom: '0.75rem' }}>
                  {globalPct === 100 ? '¡Has completado todo el programa! ✠' :
                   globalPct >= 75 ? 'Estás en la recta final del camino' :
                   globalPct >= 50 ? 'Caminando firmemente por el sendero' :
                   globalPct >= 25 ? 'Comenzando a recorrer el camino' :
                   enrollments.length === 0 ? 'Aún no te has matriculado en ningún curso' :
                   'El camino del rector comienza con un paso'}
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${globalPct}%`, background: globalPct === 100 ? '#4A9B7F' : `linear-gradient(to right, ${G.gold}, ${G.goldLight})`, borderRadius: '3px', transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.35)', marginTop: '0.4rem' }}>{completedLessons} de {totalLessons} lecciones completadas</div>
              </div>
            </div>

            {/* Courses progress */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: G.goldDim, marginBottom: '1.2rem', textTransform: 'uppercase' }}>Mis Cursos</div>
              {enrollments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', border: '1px dashed rgba(201,168,76,0.15)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📖</div>
                  <p style={{ color: 'rgba(245,237,216,0.35)', fontStyle: 'italic', marginBottom: '1.2rem' }}>Aún no estás matriculado en ningún curso</p>
                  <Link href="/cursos" style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', letterSpacing: '0.2em', padding: '0.65rem 1.5rem', background: G.gold, color: G.ink, borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>VER CURSOS →</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {enrollments.map((e, i) => {
                    const color = categoryColor[e.course.category] ?? G.gold
                    const lessons = e.course._count.lessons
                    // Distribute completed lessons across courses proportionally
                    const coursePct = lessons > 0 && totalLessons > 0
                      ? Math.min(100, Math.round((completedLessons / totalLessons) * (lessons / enrollments.length) * enrollments.length * 100 / lessons))
                      : 0
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem 1.4rem', border: `1px solid rgba(201,168,76,0.12)`, borderRadius: '8px', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: color, opacity: 0.7 }} />
                        <Ring pct={coursePct} size={56} color={color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', color, marginBottom: '0.25rem', textTransform: 'uppercase' }}>{e.course.category}</div>
                          <div style={{ fontSize: '0.95rem', color: G.parchment, marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.course.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.35)' }}>{lessons} lecciones · matriculado {timeAgo(e.createdAt)}</div>
                        </div>
                        <Link href={`/cursos/${e.courseId}`}
                          style={{ flexShrink: 0, padding: '0.5rem 1.1rem', background: coursePct === 100 ? 'rgba(74,155,127,0.15)' : `${color}18`, border: `1px solid ${coursePct === 100 ? 'rgba(74,155,127,0.35)' : `${color}35`}`, borderRadius: '5px', color: coursePct === 100 ? '#4A9B7F' : color, fontSize: '0.7rem', letterSpacing: '0.12em', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
                          {coursePct === 100 ? '✓ COMPLETO' : 'CONTINUAR →'}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* MIS NOTAS */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: G.goldDim, textTransform: 'uppercase' }}>📊 Mis Notas</div>
                {grades.length > 0 && (
                  <button onClick={() => setShowNotasDetail(p => !p)}
                    style={{ background: 'transparent', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '20px', padding: '0.25rem 0.75rem', color: G.gold, fontSize: '0.68rem', letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                    {showNotasDetail ? 'VER MENOS ↑' : 'VER DETALLE ↓'}
                  </button>
                )}
              </div>

              {grades.length === 0 && assignments.length === 0 ? (
                <div style={{ padding: '1.5rem', border: '1px dashed rgba(201,168,76,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Aún no tienes evaluaciones calificadas</p>
                  <Link href="/academico" style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: G.gold, textDecoration: 'none', fontFamily: 'Georgia, serif' }}>VER ACADÉMICO →</Link>
                </div>
              ) : (
                <>
                  {/* Summary cards per course */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {enrollments.map(e => {
                      const courseAssignments = assignments.filter(a => a.courseId === e.courseId)
                      const courseGrades = grades.filter(g => g.assignment.course.id === e.courseId)
                      const color = categoryColor[e.course.category] ?? G.gold
                      // Weighted average
                      let ws = 0, tw = 0
                      courseGrades.forEach(g => {
                        const a = courseAssignments.find(a => a.id === g.assignmentId)
                        if (a) { ws += g.score * (a.weight / 100); tw += a.weight / 100 }
                      })
                      const avg = tw > 0 ? Math.round((ws / tw) * 10) / 10 : null
                      const pending = courseAssignments.length - courseGrades.length

                      return (
                        <div key={e.id} style={{ border: `1px solid rgba(201,168,76,0.12)`, borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                          {/* Course header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.2rem', borderBottom: showNotasDetail && courseAssignments.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderLeft: `3px solid ${color}` }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', color, marginBottom: '0.15rem', textTransform: 'uppercase' }}>{e.course.category}</div>
                              <div style={{ fontSize: '0.9rem', color: G.parchment }}>{e.course.title}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                              {pending > 0 && <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'rgba(245,237,216,0.3)' }}>{pending}</div>
                                <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: 'rgba(245,237,216,0.25)' }}>PENDIENTES</div>
                              </div>}
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: avg !== null ? scoreColor(avg) : 'rgba(245,237,216,0.2)', lineHeight: 1 }}>
                                  {avg !== null ? avg : '—'}
                                </div>
                                <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: avg !== null ? scoreColor(avg) : 'rgba(245,237,216,0.25)' }}>
                                  {avg !== null ? scoreLabel(avg).toUpperCase() : 'SIN NOTAS'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Detail rows - only when expanded */}
                          {showNotasDetail && courseAssignments.length > 0 && (
                            <div>
                              {courseAssignments.map((a, i) => {
                                const g = courseGrades.find(g => g.assignmentId === a.id)
                                return (
                                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px', gap: '0.5rem', padding: '0.6rem 1.2rem', alignItems: 'center', borderBottom: i < courseAssignments.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ fontSize: '0.82rem', color: 'rgba(245,237,216,0.65)' }}>{a.title}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'rgba(245,237,216,0.3)', textAlign: 'center' }}>{a.weight}%</div>
                                    <div style={{ textAlign: 'center' }}>
                                      {g ? (
                                        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: scoreColor(g.score) }}>{g.score}</span>
                                      ) : (
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(245,237,216,0.2)', fontStyle: 'italic' }}>—</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                              {/* Course average row */}
                              {avg !== null && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px', gap: '0.5rem', padding: '0.6rem 1.2rem', background: `${color}08`, borderTop: `1px solid ${color}20` }}>
                                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color }}>PROMEDIO PONDERADO</div>
                                  <div />
                                  <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: scoreColor(avg) }}>{avg}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: '0.85rem', textAlign: 'right' }}>
                    <Link href="/academico" style={{ fontSize: '0.72rem', letterSpacing: '0.15em', color: 'rgba(201,168,76,0.5)', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
                      VER PORTAL ACADÉMICO COMPLETO →
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Recent forum activity */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: G.goldDim, marginBottom: '1.2rem', textTransform: 'uppercase' }}>Mi Actividad en el Foro</div>
              {posts.length === 0 ? (
                <div style={{ padding: '1.5rem', border: '1px dashed rgba(201,168,76,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Aún no has publicado en la comunidad</p>
                  <Link href="/comunidad" style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: G.gold, textDecoration: 'none', fontFamily: 'Georgia, serif' }}>IR AL FORO →</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {posts.map(post => (
                    <Link key={post.id} href="/comunidad"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.1rem', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', textDecoration: 'none', transition: 'border-color 0.2s' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', color: G.parchment, marginBottom: '0.2rem' }}>{post.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(245,237,216,0.3)' }}>💬 {post._count.comments} respuestas · {timeAgo(post.createdAt)}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(201,168,76,0.4)', letterSpacing: '0.1em' }}>VER →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Ver más cursos', href: '/cursos', icon: '📖' },
                { label: 'Ir al foro', href: '/comunidad', icon: '🕊' },
                { label: 'Biblioteca sagrada', href: '/biblioteca', icon: '📚' },
              ].map(l => (
                <Link key={l.label} href={l.href}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 1rem', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '7px', background: 'rgba(255,255,255,0.01)', textDecoration: 'none', transition: 'border-color 0.2s' }}>
                  <span style={{ fontSize: '1.1rem' }}>{l.icon}</span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(245,237,216,0.55)', letterSpacing: '0.08em' }}>{l.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
