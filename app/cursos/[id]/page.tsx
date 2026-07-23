'use client'
import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import LessonResources from '@/app/components/LessonResources'

type Lesson = { id: string; title: string; content: string; videoUrl: string | null; order: number }
type Course = { id: string; title: string; description: string; category: string; lessons: Lesson[]; enrolled: boolean; _count: { enrollments: number } }
type Progress = { lessonId: string; completed: boolean }

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map())
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [courseTab, setCourseTab] = useState<'lecciones' | 'sincronicas'>('lecciones')
  const [liveSessions, setLiveSessions] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then(r => r.json())
      .then(data => {
        setCourse(data)
        if (data.lessons?.length) setActiveLesson(data.lessons[0])
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (session) {
      fetch('/api/progress').then(r => r.json()).then((data: Progress[]) => {
        setProgress(new Map(data.map(p => [p.lessonId, p.completed])))
      })
    }
  }, [session])

  const markComplete = async (lessonId: string, completed: boolean) => {
    if (!session) return
    setCompleting(true)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, completed })
    })
    setProgress(p => new Map(p).set(lessonId, completed))
    setCompleting(false)

    // Auto-advance to next lesson when marked complete
    if (completed && course) {
      const idx = course.lessons.findIndex(l => l.id === lessonId)
      if (idx < course.lessons.length - 1) {
        setTimeout(() => setActiveLesson(course.lessons[idx + 1]), 600)
      }
    }
  }

  const completedCount = course ? course.lessons.filter(l => progress.get(l.id)).length : 0
  const totalCount = course?.lessons.length ?? 0
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getVideoEmbed = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()
      return `https://www.youtube.com/embed/${id}`
    }
    if (url.includes('vimeo.com')) {
      const id = url.split('/').pop()
      return `https://player.vimeo.com/video/${id}`
    }
    return url
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-4" style={{filter:'drop-shadow(0 0 12px rgba(201,168,76,0.5))'}}>✠</div>
        <p className="font-cinzel text-xs tracking-[0.3em] text-[#C9A84C]/60 animate-pulse">CARGANDO...</p>
      </div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="font-cinzel text-[#C9A84C]">Curso no encontrado</p>
        <Link href="/cursos" className="text-[#F5EDD8]/40 text-sm mt-4 block hover:text-[#F5EDD8]/60">← Volver a cursos</Link>
      </div>
    </div>
  )

  if (!course.enrolled && session) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-3xl mb-4">🔒</div>
        <h2 className="font-cinzel text-xl text-[#C9A84C] tracking-widest mb-3">CURSO PRIVADO</h2>
        <p className="text-[#F5EDD8]/50 italic mb-6">Debes matricularte para acceder a las lecciones</p>
        <Link href="/cursos" className="block py-3 bg-[#C9A84C] text-[#021A38] font-cinzel font-semibold tracking-widest text-sm rounded hover:bg-[#E8C97A] transition-colors text-center">
          VER CURSOS →
        </Link>
      </div>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-3xl mb-4">✠</div>
        <h2 className="font-cinzel text-xl text-[#C9A84C] tracking-widest mb-3">ACCESO RESTRINGIDO</h2>
        <p className="text-[#F5EDD8]/50 italic mb-6">Inicia sesión para ver las lecciones</p>
        <Link href="/auth/signin" className="block py-3 bg-[#C9A84C] text-[#021A38] font-cinzel font-semibold tracking-widest text-sm rounded hover:bg-[#E8C97A] transition-colors text-center mb-3">
          INICIAR SESIÓN →
        </Link>
        <Link href="/auth/registro" className="block py-2 text-center font-cinzel text-xs tracking-widest text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors">
          CREAR CUENTA
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#021A38', color: '#F5EDD8', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/cursos" style={{ fontFamily: 'Georgia, serif', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(245,237,216,0.35)', textDecoration: 'none' }}>← CURSOS</Link>
          <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', color: '#C9A84C', letterSpacing: '0.1em' }}>{course.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '80px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? '#4A9B7F' : '#C9A84C', borderRadius: '2px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.7rem', color: progressPct === 100 ? '#4A9B7F' : '#C9A84C', letterSpacing: '0.1em' }}>{progressPct}%</span>
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.7rem', color: 'rgba(245,237,216,0.3)' }}>{completedCount}/{totalCount} lecciones</span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar — lesson list */}
        <aside style={{ width: '280px', borderRight: '1px solid rgba(201,168,76,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
          {/* Tab switcher: Asíncrono / En Vivo */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,168,76,0.08)', flexShrink: 0 }}>
            {([['lecciones', '📹 Asíncrono'], ['sincronicas', '🎥 En Vivo']] as [string,string][]).map(([id, label]) => (
              <button key={id} onClick={() => setCourseTab(id as any)}
                style={{ flex: 1, padding: '0.65rem 0.4rem', background: courseTab === id ? 'rgba(201,168,76,0.08)' : 'transparent', border: 'none', borderBottom: `2px solid ${courseTab === id ? '#C9A84C' : 'transparent'}`, color: courseTab === id ? '#C9A84C' : 'rgba(245,237,216,0.4)', fontSize: '0.65rem', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'all 0.15s' }}>
                {label}
                {id === 'sincronicas' && liveSessions.filter((s: any) => new Date(s.scheduledAt) > new Date()).length > 0 && (
                  <span style={{ marginLeft: '0.25rem', fontSize: '0.58rem', background: 'rgba(224,85,85,0.2)', color: '#E05555', padding: '0.05rem 0.3rem', borderRadius: '10px' }}>
                    {liveSessions.filter((s: any) => new Date(s.scheduledAt) > new Date()).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {courseTab === 'lecciones' ? (
          <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '1.2rem 1.2rem 0.75rem', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>CONTENIDO DEL CURSO</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.72rem', color: 'rgba(245,237,216,0.4)' }}>{totalCount} lecciones</div>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            {course.lessons.map((lesson, i) => {
              const done = progress.get(lesson.id) ?? false
              const active = activeLesson?.id === lesson.id
              return (
                <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
                  style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: active ? 'rgba(201,168,76,0.08)' : 'transparent', borderLeft: `2px solid ${active ? '#C9A84C' : 'transparent'}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {/* Status icon */}
                  <div style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', border: `1px solid ${done ? '#4A9B7F' : active ? '#C9A84C' : 'rgba(245,237,216,0.15)'}`, background: done ? 'rgba(74,155,127,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: done ? '#4A9B7F' : active ? '#C9A84C' : 'rgba(245,237,216,0.3)', marginTop: '1px' }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: active ? '#E8C97A' : done ? 'rgba(245,237,216,0.6)' : 'rgba(245,237,216,0.5)', lineHeight: 1.4, marginBottom: '0.2rem' }}>{lesson.title}</div>
                    {lesson.videoUrl && <div style={{ fontSize: '0.65rem', color: 'rgba(74,155,127,0.6)' }}>🎥 Video</div>}
                  </div>
                </button>
              )
            })}
          </div>
          </div>
          ) : (
          /* 🎥 LIVE SESSIONS panel */
          <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.25em', color: '#7a6230', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Clases en Vivo</div>
            {liveSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic', lineHeight: 1.5 }}>Sin clases en vivo para este curso</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[...liveSessions].sort((a: any,b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map((s: any) => {
                  const live = (() => { const st=new Date(s.scheduledAt).getTime(); return Date.now()>=st && Date.now()<=st+s.duration*60000 })()
                  const past = new Date(s.scheduledAt) < new Date() && !live
                  const mats = s.materials ? JSON.parse(s.materials) : []
                  return (
                    <div key={s.id} style={{ padding: '0.85rem', border: `1px solid ${live ? 'rgba(224,85,85,0.4)' : 'rgba(201,168,76,0.12)'}`, borderRadius: '7px', background: live ? 'rgba(224,85,85,0.04)' : 'rgba(255,255,255,0.02)' }}>
                      {live && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E05555' }} /><span style={{ fontSize: '0.58rem', letterSpacing: '0.15em', color: '#E05555' }}>EN VIVO</span></div>}
                      <div style={{ fontSize: '0.82rem', color: '#F5EDD8', marginBottom: '0.25rem', lineHeight: 1.3 }}>{s.title}</div>
                      {s.description && <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.45)', marginBottom: '0.3rem', lineHeight: 1.4 }}>{s.description}</div>}
                      <div style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.35)', marginBottom: '0.5rem' }}>
                        {new Date(s.scheduledAt).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {new Date(s.scheduledAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} · {s.duration}min
                      </div>
                      {mats.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>{mats.map((m: any, i: number) => <a key={i} href={m.url} target='_blank' rel='noopener noreferrer' style={{ fontSize: '0.62rem', color: '#C9A84C', textDecoration: 'none', padding: '0.1rem 0.4rem', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px' }}>📎 {m.name}</a>)}</div>}
                      {!past ? (
                        <a href={s.meetingUrl} target='_blank' rel='noopener noreferrer' style={{ display: 'block', textAlign: 'center', padding: '0.45rem', background: live ? '#E05555' : '#C9A84C', color: '#021A38', borderRadius: '5px', textDecoration: 'none', fontSize: '0.68rem', letterSpacing: '0.1em', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
                          {live ? '▶ UNIRSE' : '🔗 ENLACE'}
                        </a>
                      ) : s.recordingUrl ? (
                        <a href={s.recordingUrl} target='_blank' rel='noopener noreferrer' style={{ display: 'block', textAlign: 'center', padding: '0.45rem', background: 'rgba(123,109,181,0.12)', border: '1px solid rgba(123,109,181,0.25)', color: '#7B6DB5', borderRadius: '5px', textDecoration: 'none', fontSize: '0.68rem', fontFamily: 'Georgia, serif' }}>🎬 Grabación</a>
                      ) : <div style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.2)', fontStyle: 'italic', textAlign: 'center' }}>Sin grabación</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          )}
        </aside>

        {/* Main lesson viewer */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3rem', maxWidth: '800px' }}>
          {activeLesson ? (
            <div>
              {/* Lesson header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'rgba(201,168,76,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Lección {activeLesson.order} de {totalCount}
                </div>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', color: '#E8C97A', lineHeight: 1.3, marginBottom: '1rem', letterSpacing: '0.05em' }}>
                  {activeLesson.title}
                </h1>
                <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(201,168,76,0.3), transparent)' }} />
              </div>

              {/* Video embed */}
              {activeLesson.videoUrl && (
                <div style={{ marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(201,168,76,0.15)', aspectRatio: '16/9', background: '#000' }}>
                  <iframe
                    src={getVideoEmbed(activeLesson.videoUrl)}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {/* Lesson content */}
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', lineHeight: 1.9, color: 'rgba(245,237,216,0.78)', whiteSpace: 'pre-wrap' }}>
                {activeLesson.content}
              </div>

              {/* Materiales multiformato de la lección */}
              <LessonResources
                key={activeLesson.id}
                lessonId={activeLesson.id}
                lessonTitle={activeLesson.title}
              />

              {/* Navigation & completion */}
              <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                {/* Prev */}
                <button
                  onClick={() => { const idx = course.lessons.findIndex(l => l.id === activeLesson.id); if (idx > 0) setActiveLesson(course.lessons[idx - 1]) }}
                  disabled={course.lessons.findIndex(l => l.id === activeLesson.id) === 0}
                  style={{ fontFamily: 'Georgia, serif', fontSize: '0.75rem', letterSpacing: '0.15em', padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid rgba(245,237,216,0.15)', borderRadius: '5px', color: 'rgba(245,237,216,0.4)', cursor: 'pointer', opacity: course.lessons.findIndex(l => l.id === activeLesson.id) === 0 ? 0.3 : 1 }}>
                  ← ANTERIOR
                </button>

                {/* Mark complete button */}
                <button
                  onClick={() => markComplete(activeLesson.id, !(progress.get(activeLesson.id) ?? false))}
                  disabled={completing}
                  style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', letterSpacing: '0.15em', padding: '0.7rem 1.8rem', background: progress.get(activeLesson.id) ? 'rgba(74,155,127,0.15)' : '#C9A84C', border: progress.get(activeLesson.id) ? '1px solid rgba(74,155,127,0.4)' : 'none', borderRadius: '5px', color: progress.get(activeLesson.id) ? '#4A9B7F' : '#021A38', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  {completing ? '...' : progress.get(activeLesson.id) ? '✓ COMPLETADA' : 'MARCAR COMPLETA →'}
                </button>

                {/* Next */}
                <button
                  onClick={() => { const idx = course.lessons.findIndex(l => l.id === activeLesson.id); if (idx < course.lessons.length - 1) setActiveLesson(course.lessons[idx + 1]) }}
                  disabled={course.lessons.findIndex(l => l.id === activeLesson.id) === course.lessons.length - 1}
                  style={{ fontFamily: 'Georgia, serif', fontSize: '0.75rem', letterSpacing: '0.15em', padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '5px', color: '#C9A84C', cursor: 'pointer' }}>
                  SIGUIENTE →
                </button>
              </div>

              {/* Course complete banner */}
              {progressPct === 100 && (
                <div style={{ marginTop: "2rem", padding: '1.5rem', border: '1px solid rgba(74,155,127,0.3)', borderRadius: '8px', background: 'rgba(74,155,127,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✠</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', letterSpacing: '0.2em', color: '#4A9B7F', marginBottom: '0.3rem' }}>CURSO COMPLETADO</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: 'rgba(245,237,216,0.45)', fontStyle: 'italic' }}>
                    "Has recorrido fielmente el curso entero"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
              <p style={{ fontFamily: 'Georgia, serif', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>Selecciona una lección para comenzar</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
