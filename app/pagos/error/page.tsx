import Link from 'next/link'
export default function ErrorPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#021A38', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✕</div>
        <h1 style={{ fontSize: '1.3rem', letterSpacing: '0.2em', color: '#E05555', marginBottom: '0.5rem' }}>PAGO NO PROCESADO</h1>
        <p style={{ color: 'rgba(245,237,216,0.45)', fontStyle: 'italic', marginBottom: '2rem' }}>El pago fue rechazado o cancelado. No se realizó ningún cargo.</p>
        <Link href="/precios" style={{ display: 'block', padding: '0.85rem', background: '#C9A84C', color: '#021A38', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', letterSpacing: '0.2em', fontSize: '0.85rem' }}>INTENTAR DE NUEVO →</Link>
      </div>
    </div>
  )
}
