'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'

type User = { id: string; name: string | null; role: string; image: string | null }
type Comment = { id: string; content: string; createdAt: string; user: User }
type Post = { id: string; title: string; content: string; createdAt: string; user: User; _count: { comments: number }; comments?: Comment[] }

const G = { gold: '#C9A84C', goldLight: '#E8C97A', ink: '#021A38', parchment: '#F5EDD8' }

const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`
  return `hace ${Math.floor(diff/86400)}d`
}

const RoleBadge = ({ role }: { role: string }) => {
  const color = role === 'RECTOR' ? G.gold : role === 'STUDENT' ? '#4A9B7F' : '#6B7280'
  const label = role === 'RECTOR' ? '✠ Rector' : role === 'STUDENT' ? 'Discípulo' : 'Visitante'
  return <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', padding: '0.12rem 0.5rem', borderRadius: '20px', border: `1px solid ${color}35`, color, background: `${color}10` }}>{label}</span>
}

const Avatar = ({ name, size = 32 }: { name: string | null; size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, color: G.gold, flexShrink: 0, fontFamily: 'Georgia, serif' }}>
    {name?.[0]?.toUpperCase() ?? '?'}
  </div>
)

export default function ComunidadPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPost, setLoadingPost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [newComment, setNewComment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchPosts = async () => {
    const r = await fetch('/api/forum')
    if (r.ok) setPosts(await r.json())
    setLoading(false)
  }

  const openPost = async (post: Post) => {
    setLoadingPost(true)
    setActivePost(null) // clear first to avoid partial render
    const r = await fetch(`/api/forum/${post.id}`)
    if (r.ok) {
      const data = await r.json()
      setActivePost(data)
    } else {
      setActivePost(post) // fallback to list data
    }
    setLoadingPost(false)
    setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => { fetchPosts() }, [])

  // Poll for new comments every 10s when a post is open
  const activePostId = activePost?.id ?? null
  useEffect(() => {
    if (!activePostId) return
    const interval = setInterval(async () => {
      const r = await fetch(`/api/forum/${activePostId}`)
      if (r.ok) setActivePost(await r.json())
    }, 10000)
    return () => clearInterval(interval)
  }, [activePostId])

  const submitPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) { showToast('Completa título y contenido'); return }
    setSubmitting(true)
    const r = await fetch('/api/forum', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPost) })
    if (r.ok) {
      const post = await r.json()
      setPosts(p => [post, ...p])
      setNewPost({ title: '', content: '' })
      setShowForm(false)
      showToast('Post publicado ✓')
      openPost(post)
    } else { const d = await r.json(); showToast(d.error ?? 'Error') }
    setSubmitting(false)
  }

  const submitComment = async () => {
    if (!newComment.trim() || !activePost) return
    setSubmitting(true)
    const postId = activePost.id
    const r = await fetch(`/api/forum/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment })
    })
    if (r.ok) {
      setNewComment('')
      // Reload the full post to get updated comments with user data
      const refresh = await fetch(`/api/forum/${postId}`)
      if (refresh.ok) {
        const updated = await refresh.json()
        setActivePost(updated)
        setPosts(p => p.map(post => post.id === postId ? { ...post, _count: { comments: updated._count?.comments ?? post._count.comments + 1 } } : post))
      }
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    }
    setSubmitting(false)
  }

  const deletePost = async (id: string) => {
    if (!confirm('¿Eliminar este post?')) return
    const r = await fetch(`/api/forum/${id}`, { method: 'DELETE' })
    if (r.ok) { setPosts(p => p.filter(post => post.id !== id)); setActivePost(null); showToast('Post eliminado') }
  }

  const deleteComment = async (commentId: string) => {
    if (!activePost) return
    const postId = activePost.id
    const r = await fetch(`/api/forum/${postId}/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId })
    })
    if (r.ok) {
      // Reload full post instead of partial state mutation
      const refresh = await fetch(`/api/forum/${postId}`)
      if (refresh.ok) {
        const updated = await refresh.json()
        setActivePost(updated)
        setPosts(p => p.map(post => post.id === postId ? { ...post, _count: { comments: updated._count?.comments ?? 0 } } : post))
      }
      showToast('Comentario eliminado')
    }
  }

  const userId = (session?.user as any)?.id
  const isRector = (session?.user as any)?.role === 'RECTOR'

  return (
    <div style={{ minHeight: '100vh', background: G.ink, color: G.parchment, fontFamily: 'Georgia, serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1608', border: '1px solid rgba(201,168,76,0.5)', color: G.gold, padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast}</div>}

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(245,237,216,0.35)', textDecoration: 'none' }}>← INICIO</Link>
          <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: G.gold }}>🕊 COMUNIDAD</span>
        </div>
        {session ? (
          <button onClick={() => { setShowForm(true); setActivePost(null) }}
            style={{ padding: '0.5rem 1.2rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
            + NUEVO POST
          </button>
        ) : (
          <Link href="/auth/signin" style={{ padding: '0.5rem 1.2rem', border: '1px solid rgba(201,168,76,0.35)', color: G.gold, borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.15em', textDecoration: 'none' }}>
            INICIAR SESIÓN
          </Link>
        )}
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 53px)', position: 'relative', zIndex: 1 }}>

        {/* Posts sidebar */}
        <aside style={{ width: '340px', borderRight: '1px solid rgba(201,168,76,0.08)', overflowY: 'auto', flexShrink: 0 }}>

          {/* New post form */}
          {showForm && (
            <div style={{ padding: '1.2rem', borderBottom: '1px solid rgba(201,168,76,0.12)', background: 'rgba(201,168,76,0.03)' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.25em', color: G.gold, marginBottom: '0.75rem' }}>NUEVO POST</div>
              <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                placeholder="Título..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', marginBottom: '0.6rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }} />
              <textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                placeholder="Comparte tu reflexión, pregunta o enseñanza..."
                rows={4}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.8rem', color: G.parchment, fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'Georgia, serif', marginBottom: '0.6rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={submitPost} disabled={submitting}
                  style={{ flex: 1, padding: '0.55rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
                  {submitting ? '...' : 'PUBLICAR'}
                </button>
                <button onClick={() => setShowForm(false)}
                  style={{ padding: '0.55rem 0.8rem', background: 'transparent', border: '1px solid rgba(245,237,216,0.12)', borderRadius: '5px', color: 'rgba(245,237,216,0.4)', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}

          {/* Posts list */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(245,237,216,0.3)', fontStyle: 'italic', fontSize: '0.85rem' }}>Cargando...</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🕊</div>
              <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic', fontSize: '0.85rem' }}>Sé el primero en compartir</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} onClick={() => openPost(post)}
              style={{ padding: '1.1rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: activePost?.id === post.id ? 'rgba(201,168,76,0.06)' : 'transparent', borderLeft: `2px solid ${activePost?.id === post.id ? G.gold : 'transparent'}`, transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Avatar name={post.user.name} size={22} />
                <span style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.45)' }}>{post.user.name ?? 'Anónimo'}</span>
                <RoleBadge role={post.user.role} />
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.25)', marginLeft: 'auto' }}>{timeAgo(post.createdAt)}</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: activePost?.id === post.id ? G.goldLight : G.parchment, marginBottom: '0.3rem', lineHeight: 1.35 }}>{post.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.3)' }}>💬 {post._count.comments} respuestas</div>
            </div>
          ))}
        </aside>

        {/* Post detail */}
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!activePost && !showForm ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
              <div style={{display:"flex",justifyContent:"center"}}><Emblem size={70}/></div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', letterSpacing: '0.2em', color: 'rgba(201,168,76,0.4)' }}>SEMINARIO WYCLIFFE</p>
              <p style={{ color: 'rgba(245,237,216,0.25)', fontStyle: 'italic', fontSize: '0.88rem' }}>Selecciona un post para leer o crea uno nuevo</p>
            </div>
          ) : activePost && activePost.user && (
            <div style={{ flex: 1, padding: '2rem 2.5rem', maxWidth: '700px' }}>

              {/* Post header */}
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Avatar name={activePost.user.name} size={36} />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: G.parchment }}>{activePost.user.name ?? 'Anónimo'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <RoleBadge role={activePost.user.role} />
                      <span style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.3)' }}>{timeAgo(activePost.createdAt)}</span>
                    </div>
                  </div>
                  {(activePost.user.id === userId || isRector) && (
                    <button onClick={() => deletePost(activePost.id)}
                      style={{ marginLeft: 'auto', padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid rgba(220,60,60,0.25)', borderRadius: '4px', color: 'rgba(220,60,60,0.5)', fontSize: '0.68rem', cursor: 'pointer' }}>
                      ELIMINAR
                    </button>
                  )}
                </div>
                <h1 style={{ fontSize: '1.4rem', color: G.goldLight, letterSpacing: '0.05em', lineHeight: 1.3, marginBottom: '1rem' }}>{activePost.title}</h1>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.85, color: 'rgba(245,237,216,0.72)', whiteSpace: 'pre-wrap' }}>{activePost.content}</div>
              </div>

              {/* Comments */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.65rem', letterSpacing: '0.25em', color: 'rgba(201,168,76,0.5)', marginBottom: '1.2rem' }}>
                  RESPUESTAS · {activePost._count?.comments ?? 0}
                </div>
                {loadingPost ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(245,237,216,0.25)', fontStyle: 'italic', fontSize: '0.85rem' }}>Cargando...</div>
                ) : activePost.comments?.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed rgba(201,168,76,0.1)', borderRadius: '8px' }}>
                    <p style={{ color: 'rgba(245,237,216,0.25)', fontStyle: 'italic', fontSize: '0.85rem' }}>Sé el primero en responder</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activePost.comments?.map(comment => (
                      <div key={comment.id} style={{ display: 'flex', gap: '0.75rem' }}>
                        <Avatar name={comment.user.name} size={28} />
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,168,76,0.08)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: G.parchment }}>{comment.user.name ?? 'Anónimo'}</span>
                            <RoleBadge role={comment.user.role} />
                            <span style={{ fontSize: '0.65rem', color: 'rgba(245,237,216,0.25)', marginLeft: 'auto' }}>{timeAgo(comment.createdAt)}</span>
                            {(comment.user.id === userId || isRector) && (
                              <button onClick={() => deleteComment(comment.id)}
                                style={{ padding: '0.1rem 0.4rem', background: 'transparent', border: 'none', color: 'rgba(220,60,60,0.4)', fontSize: '0.65rem', cursor: 'pointer' }}>✕</button>
                            )}
                          </div>
                          <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(245,237,216,0.65)', whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}
              </div>

              {/* Comment input */}
              {session ? (
                <div style={{ position: 'sticky', bottom: 0, background: 'rgba(13,11,8,0.95)', borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <Avatar name={(session.user as any)?.name} size={28} />
                    <div style={{ flex: 1 }}>
                      <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                        placeholder="Escribe tu respuesta... (Enter para enviar)"
                        rows={2}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '6px', padding: '0.7rem 1rem', color: G.parchment, fontSize: '0.88rem', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }} />
                    </div>
                    <button onClick={submitComment} disabled={submitting || !newComment.trim()}
                      style={{ padding: '0.6rem 1rem', background: newComment.trim() ? G.gold : 'rgba(201,168,76,0.2)', color: newComment.trim() ? G.ink : 'rgba(201,168,76,0.4)', border: 'none', borderRadius: '6px', fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', transition: 'all 0.2s', flexShrink: 0 }}>
                      ENVIAR
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.2rem', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '8px', background: 'rgba(201,168,76,0.02)' }}>
                  <Link href="/auth/signin" style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.15em', color: G.gold, textDecoration: 'none' }}>
                    INICIA SESIÓN PARA RESPONDER →
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
