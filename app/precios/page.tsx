'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'

const G = { gold: '#C9A84C', goldLight: '#E8C97A', ink: '#021A38', parchment: '#F5EDD8' }

export default function PreciosPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)

  const checkout = async (type: 'subscription', courseId?: string) => {
    if (!session) { window.location.href = '/auth/signin'; return }
    setLoading(type)
    const r = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, courseId })
    })
    const data = await r.json()
    if (data.checkoutUrl) window.location.href = data.checkoutUrl
    else { alert(data.error ?? 'Error al procesar pago'); setLoading(null) }
  }

  const plans = [
    {
      id: 'free',
      name: 'VISITANTE',
      price: 'Gratis',
      period: '',
      color: '#6B7280',
      icon: '🕊',
      features: [
        'Acceso a cursos gratuitos',
        'Biblioteca básica',
        'Foro de la comunidad',
        'Dashboard de progreso',
      ],
      cta: 'COMENZAR GRATIS',
      action: () => window.location.href = '/auth/registro',
    },
    {
      id: 'subscription',
      name: 'DISCÍPULO',
      price: 'USD $19.99',
      period: '/ mes',
      color: G.gold,
      icon: '✠',
      featured: true,
      features: [
        'Acceso a TODOS los cursos',
        'Biblioteca sagrada completa',
        'Foro ilimitado',
        'Dashboard avanzado',
        'Nuevos cursos incluidos',
        'Soporte del Rector',
      ],
      cta: 'SUSCRIBIRME',
      action: () => checkout('subscription'),
    },
    {
      id: 'course',
      name: 'POR CURSO',
      price: 'Desde USD $9',
      period: '/ curso',
      color: '#7B6DB5',
      icon: '📖',
      features: [
        'Acceso permanente al curso',
        'Sin suscripción mensual',
        'Material descargable',
        'Certificado de completitud',
        'Pago único',
      ],
      cta: 'VER CURSOS',
      action: () => window.location.href = '/cursos',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: G.ink, color: G.parchment, fontFamily: 'Georgia, serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <Link href="/" style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: 'rgba(201,168,76,0.4)', textDecoration: 'none', display: 'block', marginBottom: '1.5rem' }}>← SEMINARIO WYCLIFFE</Link>
          <div style={{display:"flex",justifyContent:"center"}}><Emblem size={60}/></div>
          <h1 style={{ fontSize: '2rem', letterSpacing: '0.25em', color: G.gold, marginBottom: '0.75rem' }}>PLANES DE FORMACIÓN</h1>
          <p style={{ color: 'rgba(245,237,216,0.5)', fontStyle: 'italic', fontSize: '1.05rem' }}>
            Elige el camino que mejor se adapte a tu vocación espiritual
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ padding: '2rem', border: `1px solid ${plan.featured ? plan.color : `${plan.color}30`}`, borderRadius: '12px', background: plan.featured ? `${plan.color}06` : 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(to right, ${plan.color}, ${G.goldLight})` }} />
              )}
              {plan.featured && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.6rem', letterSpacing: '0.2em', padding: '0.2rem 0.6rem', background: `${plan.color}20`, border: `1px solid ${plan.color}40`, borderRadius: '20px', color: plan.color }}>POPULAR</div>
              )}

              <div style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>{plan.icon}</div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: plan.color, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{plan.name}</div>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.6rem', color: G.parchment, fontWeight: 'bold' }}>{plan.price}</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(245,237,216,0.4)' }}>{plan.period}</span>
              </div>

              <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <span style={{ color: plan.color, fontSize: '0.75rem', marginTop: '0.1rem', flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: '0.83rem', color: 'rgba(245,237,216,0.6)', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button onClick={plan.action} disabled={loading === plan.id}
                style={{ width: '100%', padding: '0.85rem', background: plan.featured ? plan.color : 'transparent', color: plan.featured ? G.ink : plan.color, border: `1px solid ${plan.color}${plan.featured ? '' : '50'}`, borderRadius: '6px', fontSize: '0.75rem', letterSpacing: '0.2em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: plan.featured ? 'bold' : 'normal', transition: 'all 0.2s', opacity: loading === plan.id ? 0.6 : 1 }}>
                {loading === plan.id ? 'PROCESANDO...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid rgba(201,168,76,0.1)', borderRadius: '10px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            {[
              { icon: '🔒', label: 'Pago seguro', sub: 'Mercado Pago' },
              { icon: '🌐', label: 'Internacional', sub: 'USD · Tarjetas globales' },
              { icon: '↩', label: 'Reembolso', sub: '7 días garantía' },
              { icon: '📧', label: 'Soporte', sub: 'Respuesta en 24h' },
            ].map(t => (
              <div key={t.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{t.icon}</div>
                <div style={{ fontSize: '0.78rem', color: G.parchment, letterSpacing: '0.1em' }}>{t.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(245,237,216,0.35)' }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
