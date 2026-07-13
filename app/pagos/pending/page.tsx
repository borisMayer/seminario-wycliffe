import Link from 'next/link'
export default function PendingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#021A38', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', letterSpacing: '0.2em', color: '#C9A84C', marginBottom: '0.75rem' }}>PAGO EN PROCESO</h1>
        <p style={{ color: 'rgba(245,237,216,0.5)', fontStyle: 'italic', marginBottom: '2rem' }}>Tu pago está siendo verificado. Te notificaremos cuando se confirme y tu acceso será activado automáticamente.</p>
        <Link href="/dashboard" style={{ display: 'block', padding: '0.85rem', background: '#C9A84C', color: '#021A38', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 'bold' }}>IR A MI DASHBOARD</Link>
      </div>
    </div>
  )
}
