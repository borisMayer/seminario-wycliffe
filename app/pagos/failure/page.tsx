import Link from 'next/link'
export default function FailurePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#021A38', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✕</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.2em', color: '#E05555', marginBottom: '0.75rem' }}>PAGO NO PROCESADO</h1>
        <p style={{ color: 'rgba(245,237,216,0.5)', fontStyle: 'italic', marginBottom: '2rem' }}>Hubo un problema con tu pago. Puedes intentarlo nuevamente.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/cursos" style={{ display: 'block', padding: '0.85rem', background: '#C9A84C', color: '#021A38', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 'bold' }}>VOLVER A CURSOS</Link>
          <Link href="/" style={{ display: 'block', padding: '0.85rem', border: '1px solid rgba(245,237,216,0.15)', color: 'rgba(245,237,216,0.4)', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.2em' }}>IR AL INICIO</Link>
        </div>
      </div>
    </div>
  )
}
