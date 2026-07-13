'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'

function SuccessContent() {
  const params = useSearchParams()
  const courseId = params.get('courseId')
  const type = params.get('type')

  return (
    <div style={{ minHeight: '100vh', background: '#021A38', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem' }}>
        <div style={{display:"flex",justifyContent:"center"}}><Emblem size={70}/></div>
        <h1 style={{ fontSize: '1.5rem', letterSpacing: '0.2em', color: '#4A9B7F', marginBottom: '0.75rem' }}>¡PAGO APROBADO!</h1>
        <p style={{ color: 'rgba(245,237,216,0.6)', fontStyle: 'italic', marginBottom: '0.5rem' }}>Tu acceso ha sido activado</p>
        <p style={{ color: 'rgba(245,237,216,0.35)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {type === 'subscription' ? 'Suscripción mensual activa — acceso completo al seminario' : 'Matrícula confirmada en el curso'}
        </p>
        <div style={{ padding: '1.2rem', border: '1px solid rgba(74,155,127,0.2)', borderRadius: '8px', background: 'rgba(74,155,127,0.04)', marginBottom: '2rem' }}>
          <p style={{ color: 'rgba(245,237,216,0.5)', fontStyle: 'italic', fontSize: '0.88rem', lineHeight: 1.7 }}>
            "El camino del rector es como la luz de la aurora,<br />que va en aumento hasta que el día es perfecto."
          </p>
          <p style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.72rem', marginTop: '0.5rem' }}>— Proverbios 4:18</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courseId && (
            <Link href={`/cursos/${courseId}`} style={{ display: 'block', padding: '0.85rem', background: '#4A9B7F', color: '#021A38', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 'bold' }}>
              COMENZAR EL CURSO →
            </Link>
          )}
          <Link href="/dashboard" style={{ display: 'block', padding: '0.85rem', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.2em' }}>
            IR A MI DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
