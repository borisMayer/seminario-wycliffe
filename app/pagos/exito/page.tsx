'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'

function ExitoContent() {
  const params = useSearchParams()
  const type = params.get('type')
  const [counted, setCounted] = useState(false)

  useEffect(() => {
    if (!counted) { setCounted(true) }
  }, [counted])

  return (
    <div style={{ minHeight: '100vh', background: '#021A38', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem' }}>
        <div style={{display:"flex",justifyContent:"center"}}><Emblem size={70}/></div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', letterSpacing: '0.2em', color: '#4A9B7F', marginBottom: '0.5rem' }}>¡PAGO EXITOSO!</h1>
        <p style={{ color: 'rgba(245,237,216,0.5)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
          {type === 'SUBSCRIPTION' ? 'Tu suscripción mensual está activa' : 'Tu matrícula ha sido confirmada'}
        </p>
        <p style={{ color: 'rgba(245,237,216,0.35)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          "El camino del rector es como la luz de la aurora"
        </p>
        <div style={{ padding: '1.2rem', border: '1px solid rgba(74,155,127,0.25)', borderRadius: '8px', background: 'rgba(74,155,127,0.05)', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'rgba(245,237,216,0.55)', lineHeight: 1.7 }}>
            {type === 'SUBSCRIPTION'
              ? 'Tienes acceso a todos los cursos del seminario durante 30 días. ¡Soli Deo Gloria!'
              : 'Ya puedes acceder a todas las lecciones del curso. ¡Que el estudio sea una bendición!'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/cursos" style={{ display: 'block', padding: '0.85rem', background: '#C9A84C', color: '#021A38', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', letterSpacing: '0.2em', fontSize: '0.85rem' }}>
            IR A MIS CURSOS →
          </Link>
          <Link href="/dashboard" style={{ display: 'block', padding: '0.85rem', border: '1px solid rgba(201,168,76,0.25)', color: 'rgba(201,168,76,0.7)', borderRadius: '6px', textDecoration: 'none', letterSpacing: '0.15em', fontSize: '0.8rem' }}>
            VER MI DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ExitoPage() {
  return <Suspense><ExitoContent /></Suspense>
}
