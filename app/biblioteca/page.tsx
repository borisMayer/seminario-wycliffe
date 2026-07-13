'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Text = { id: string; title: string; author: string | null; category: string; language: string; description: string | null; fileUrl: string | null; isPremium: boolean; createdAt: string }

const G = { gold: '#C9A84C', goldLight: '#E8C97A', goldDim: '#7a6230', ink: '#021A38', parchment: '#F5EDD8', purple: '#7B6DB5', green: '#4A9B7F' }
const CATEGORIES = ['Antiguo Testamento', 'Nuevo Testamento', 'Idiomas Bíblicos', 'Teología Sistemática', 'Teología Reformada', 'Historia y Patrística', 'Apologética', 'Homilética']
const LANGUAGES  = ['ES', 'HE', 'HE/ES', 'EN', 'EN/ES', 'GR', 'LA']
const catColor: Record<string, string> = {
  'Antiguo Testamento': '#C9A84C', 'Nuevo Testamento': '#B8860B', 'Idiomas Bíblicos': '#7B6DB5', 'Teología Sistemática': '#3E6FA8',
  'Teología Reformada': '#4A9B7F', 'Historia y Patrística': '#C47A3A',
  'Apologética': '#9B4A7F', 'Homilética': '#7A9B4A'
}
const EMPTY_FORM = { title: '', author: '', category: 'Antiguo Testamento', language: 'ES', description: '', fileUrl: '', isPremium: false }

export default function BibliotecaPage() {
  const { data: session } = useSession()
  const isRector = (session?.user as any)?.role === 'RECTOR'

  const [texts, setTexts] = useState<Text[]>([])
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('TODOS')
  const [activeTab, setActiveTab] = useState<'basica' | 'sagrada'>('basica')
  const [search, setSearch] = useState('')
  const [selectedText, setSelectedText] = useState<Text | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchTexts = async () => {
    const r = await fetch('/api/biblioteca')
    if (r.ok) {
      const data = await r.json()
      setTexts(Array.isArray(data) ? data : (data.texts ?? []))
      setIsPremium(data.isPremium ?? false)
    }
    setLoading(false)
  }

  useEffect(() => { fetchTexts() }, [])

  // Separate basic and premium texts
  const basicTexts = texts.filter(t => !t.isPremium)
  const premiumTexts = texts.filter(t => t.isPremium)
  const displayTexts = activeTab === 'basica' ? basicTexts : premiumTexts

  const filtered = displayTexts.filter(t => {
    const matchCat = activeCategory === 'TODOS' || t.category === activeCategory
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.author ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const resetForm = () => { setForm({ ...EMPTY_FORM }); setShowForm(false); setEditingId(null) }

  const startEdit = (t: Text) => {
    setForm({ title: t.title, author: t.author ?? '', category: t.category, language: t.language, description: t.description ?? '', fileUrl: t.fileUrl ?? '', isPremium: t.isPremium })
    setEditingId(t.id); setShowForm(true)
  }

  const submit = async () => {
    if (!form.title.trim() || !form.category.trim()) { showToast('Título y categoría requeridos'); return }
    setSubmitting(true)
    const url = editingId ? `/api/biblioteca` : '/api/biblioteca'
    const method = editingId ? 'PATCH' : 'POST'
    const body = editingId ? { id: editingId, ...form } : form
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (r.ok) { await fetchTexts(); showToast(editingId ? 'Texto actualizado ✓' : 'Texto agregado ✓'); resetForm() }
    else { const d = await r.json(); showToast(d.error ?? 'Error') }
    setSubmitting(false)
  }

  const deleteText = async (id: string) => {
    if (!confirm('¿Eliminar este texto?')) return
    await fetch('/api/biblioteca', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await fetchTexts(); showToast('Texto eliminado')
    if (selectedText?.id === id) setSelectedText(null)
  }

  const inp = (extra = {}) => ({ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '5px', padding: '0.6rem 0.85rem', color: G.parchment, fontSize: '0.85rem', outline: 'none', fontFamily: 'Georgia, serif', boxSizing: 'border-box' as const, ...extra })

  return (
    <div style={{ minHeight: '100vh', background: G.ink, color: G.parchment, fontFamily: 'Georgia, serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
      {toast && <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100, background: '#1a1608', border: '1px solid rgba(201,168,76,0.5)', color: G.gold, padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{toast}</div>}

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'rgba(245,237,216,0.3)', textDecoration: 'none' }}>← INICIO</Link>
          <span style={{ color: 'rgba(201,168,76,0.25)' }}>·</span>
          <span style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: G.gold }}>📚 BIBLIOTECA</span>
        </div>
        {isRector && (
          <button onClick={() => { resetForm(); setShowForm(true) }}
            style={{ padding: '0.45rem 1.1rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.7rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
            + AGREGAR TEXTO
          </button>
        )}
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 53px)', position: 'relative', zIndex: 1 }}>

        {/* LEFT SIDEBAR */}
        <aside style={{ width: '260px', borderRight: '1px solid rgba(201,168,76,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'rgba(0,0,0,0.15)' }}>

          {/* TABS: Básica / Sagrada */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,168,76,0.08)', flexShrink: 0 }}>
            <button onClick={() => { setActiveTab('basica'); setActiveCategory('TODOS') }}
              style={{ flex: 1, padding: '0.8rem 0.5rem', background: activeTab === 'basica' ? 'rgba(201,168,76,0.07)' : 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === 'basica' ? G.gold : 'transparent'}`, color: activeTab === 'basica' ? G.gold : 'rgba(245,237,216,0.4)', fontSize: '0.65rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              📖 BÁSICA
              <div style={{ fontSize: '0.55rem', opacity: 0.6, marginTop: '0.1rem' }}>Acceso libre</div>
            </button>
            <button onClick={() => {
              if (!isPremium && !isRector) { showToast('Requiere Plan Discípulo'); return }
              setActiveTab('sagrada'); setActiveCategory('TODOS')
            }}
              style={{ flex: 1, padding: '0.8rem 0.5rem', background: activeTab === 'sagrada' ? 'rgba(123,109,181,0.1)' : 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === 'sagrada' ? G.purple : 'transparent'}`, color: activeTab === 'sagrada' ? G.purple : 'rgba(245,237,216,0.35)', fontSize: '0.65rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Georgia, serif', position: 'relative' }}>
              ✨ SAGRADA
              {!isPremium && !isRector && <span style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', fontSize: '0.55rem' }}>🔒</span>}
              <div style={{ fontSize: '0.55rem', opacity: 0.6, marginTop: '0.1rem' }}>Plan Discípulo</div>
            </button>
          </div>

          {/* Premium lock banner for sagrada tab */}
          {activeTab === 'sagrada' && !isPremium && !isRector && (
            <div style={{ padding: '1rem', background: 'rgba(123,109,181,0.08)', borderBottom: '1px solid rgba(123,109,181,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🔒</div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.45)', lineHeight: 1.5, marginBottom: '0.75rem' }}>La Biblioteca Sagrada está disponible para suscriptores del Plan Discípulo</p>
              <Link href="/precios" style={{ display: 'block', padding: '0.5rem', background: G.purple, color: G.parchment, borderRadius: '5px', textDecoration: 'none', fontSize: '0.68rem', letterSpacing: '0.12em' }}>VER PLANES →</Link>
            </div>
          )}

          {/* Search */}
          <div style={{ padding: '0.85rem', borderBottom: '1px solid rgba(201,168,76,0.07)' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar texto..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '5px', padding: '0.5rem 0.75rem', color: G.parchment, fontSize: '0.78rem', outline: 'none', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
          </div>

          {/* Category filters */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 0' }}>
            <div style={{ padding: '0.3rem 0.85rem', fontSize: '0.55rem', letterSpacing: '0.25em', color: G.goldDim, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Categorías</div>
            {['TODOS', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ width: '100%', textAlign: 'left', padding: '0.55rem 1rem', background: activeCategory === cat ? (activeTab === 'sagrada' ? 'rgba(123,109,181,0.1)' : 'rgba(201,168,76,0.08)') : 'transparent', borderLeft: `2px solid ${activeCategory === cat ? (activeTab === 'sagrada' ? G.purple : G.gold) : 'transparent'}`, border: 'none', color: activeCategory === cat ? (activeTab === 'sagrada' ? G.purple : G.gold) : 'rgba(245,237,216,0.45)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'all 0.15s' }}>
                {cat}
                <span style={{ float: 'right', fontSize: '0.65rem', opacity: 0.5 }}>
                  {cat === 'TODOS' ? displayTexts.length : displayTexts.filter(t => t.category === cat).length}
                </span>
              </button>
            ))}
          </div>

          {/* Stats footer */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(201,168,76,0.07)', fontSize: '0.62rem', color: 'rgba(245,237,216,0.25)' }}>
            <div>{basicTexts.length} textos básicos · {premiumTexts.length} sagrados</div>
            {isPremium && <div style={{ color: G.green, marginTop: '0.2rem' }}>✓ Acceso completo activo</div>}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Rector form */}
          {showForm && isRector && (
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(201,168,76,0.02)' }}>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.3em', color: G.gold, marginBottom: '1rem' }}>{editingId ? 'EDITAR TEXTO' : 'NUEVO TEXTO SAGRADO'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Título *" style={inp()} />
                <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="Autor" style={inp()} />
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ ...inp(), background: '#1a1608' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} style={{ ...inp(), background: '#1a1608' }}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input value={form.fileUrl} onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="URL del archivo (PDF, etc.)" style={inp()} />

                {/* NIVEL DE ACCESO */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setForm(p => ({ ...p, isPremium: false }))}
                    style={{ flex: 1, padding: '0.55rem', border: `1px solid ${!form.isPremium ? G.green : 'rgba(245,237,216,0.12)'}`, borderRadius: '5px', background: !form.isPremium ? 'rgba(74,155,127,0.1)' : 'transparent', color: !form.isPremium ? G.green : 'rgba(245,237,216,0.4)', cursor: 'pointer', fontSize: '0.68rem', letterSpacing: '0.12em', fontFamily: 'Georgia, serif' }}>
                    📖 BÁSICA
                  </button>
                  <button onClick={() => setForm(p => ({ ...p, isPremium: true }))}
                    style={{ flex: 1, padding: '0.55rem', border: `1px solid ${form.isPremium ? G.purple : 'rgba(245,237,216,0.12)'}`, borderRadius: '5px', background: form.isPremium ? 'rgba(123,109,181,0.12)' : 'transparent', color: form.isPremium ? G.purple : 'rgba(245,237,216,0.4)', cursor: 'pointer', fontSize: '0.68rem', letterSpacing: '0.12em', fontFamily: 'Georgia, serif' }}>
                    ✨ SAGRADA
                  </button>
                </div>
              </div>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descripción del texto..." rows={2} style={{ ...inp({ resize: 'vertical' }), marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={submit} disabled={submitting} style={{ padding: '0.6rem 1.4rem', background: G.gold, color: G.ink, border: 'none', borderRadius: '5px', fontSize: '0.7rem', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
                  {submitting ? '...' : editingId ? 'GUARDAR' : 'AGREGAR TEXTO'}
                </button>
                <button onClick={resetForm} style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid rgba(245,237,216,0.12)', borderRadius: '5px', color: 'rgba(245,237,216,0.4)', fontSize: '0.7rem', cursor: 'pointer' }}>CANCELAR</button>
              </div>
            </div>
          )}

          {/* Library header */}
          <div style={{ padding: '1.2rem 2rem', borderBottom: '1px solid rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: '0.82rem', letterSpacing: '0.2em', color: activeTab === 'sagrada' ? G.purple : G.gold, textTransform: 'uppercase' }}>
                {activeTab === 'basica' ? '📖 Biblioteca Básica' : '✨ Biblioteca Sagrada'}
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.35)', marginTop: '0.2rem' }}>
                {activeTab === 'basica'
                  ? 'Textos de acceso libre para todos los estudiantes'
                  : 'Colección completa · Acceso exclusivo Plan Discípulo'}
              </p>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(245,237,216,0.3)' }}>{filtered.length} textos</div>
          </div>

          {/* Text list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 2rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(245,237,216,0.25)', fontStyle: 'italic' }}>Cargando biblioteca...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed rgba(201,168,76,0.1)', borderRadius: '10px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</div>
                <p style={{ color: 'rgba(245,237,216,0.3)', fontStyle: 'italic' }}>
                  {activeTab === 'sagrada' && !isPremium && !isRector
                    ? 'Accede al Plan Discípulo para ver la Biblioteca Sagrada'
                    : 'No hay textos en esta categoría'}
                </p>
                {activeTab === 'sagrada' && !isPremium && !isRector && (
                  <Link href="/precios" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.5rem', background: G.purple, color: G.parchment, borderRadius: '5px', textDecoration: 'none', fontSize: '0.72rem', letterSpacing: '0.15em' }}>VER PLANES →</Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
                {filtered.map(t => {
                  const color = catColor[t.category] ?? G.gold
                  const isPrem = t.isPremium
                  return (
                    <div key={t.id}
                      onClick={() => setSelectedText(selectedText?.id === t.id ? null : t)}
                      style={{ padding: '1.1rem 1.3rem', border: `1px solid ${selectedText?.id === t.id ? (isPrem ? G.purple : G.gold) : 'rgba(201,168,76,0.1)'}`, borderRadius: '8px', background: selectedText?.id === t.id ? (isPrem ? 'rgba(123,109,181,0.07)' : 'rgba(201,168,76,0.05)') : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color, opacity: 0.6 }} />
                      {isPrem && <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', fontSize: '0.55rem', letterSpacing: '0.12em', padding: '0.1rem 0.4rem', borderRadius: '10px', background: 'rgba(123,109,181,0.2)', border: '1px solid rgba(123,109,181,0.3)', color: G.purple }}>✨ SAGRADA</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.58rem', letterSpacing: '0.14em', padding: '0.1rem 0.45rem', borderRadius: '20px', background: `${color}15`, border: `1px solid ${color}30`, color }}>{t.category}</span>
                        <span style={{ fontSize: '0.6rem', color: 'rgba(245,237,216,0.3)', letterSpacing: '0.1em' }}>{t.language}</span>
                      </div>
                      <h3 style={{ fontSize: '0.9rem', color: G.parchment, lineHeight: 1.3, marginBottom: '0.3rem' }}>{t.title}</h3>
                      {t.author && <p style={{ fontSize: '0.72rem', color: 'rgba(245,237,216,0.4)', marginBottom: '0.4rem', fontStyle: 'italic' }}>{t.author}</p>}
                      {t.description && selectedText?.id === t.id && (
                        <p style={{ fontSize: '0.78rem', color: 'rgba(245,237,216,0.5)', lineHeight: 1.6, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>{t.description}</p>
                      )}
                      {selectedText?.id === t.id && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {t.fileUrl && (
                            <a href={t.fileUrl} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.85rem', background: isPrem ? 'rgba(123,109,181,0.15)' : 'rgba(201,168,76,0.1)', border: `1px solid ${isPrem ? G.purple : G.gold}40`, borderRadius: '5px', color: isPrem ? G.purple : G.gold, fontSize: '0.7rem', textDecoration: 'none', letterSpacing: '0.1em' }}>
                              📄 ABRIR TEXTO
                            </a>
                          )}
                          {isRector && (
                            <>
                              <button onClick={e => { e.stopPropagation(); startEdit(t) }}
                                style={{ padding: '0.4rem 0.75rem', background: 'transparent', border: `1px solid ${G.gold}30`, borderRadius: '5px', color: G.gold, fontSize: '0.65rem', cursor: 'pointer' }}>EDITAR</button>
                              <button onClick={e => { e.stopPropagation(); deleteText(t.id) }}
                                style={{ padding: '0.4rem 0.75rem', background: 'transparent', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '5px', color: 'rgba(224,85,85,0.5)', fontSize: '0.65rem', cursor: 'pointer' }}>ELIMINAR</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
