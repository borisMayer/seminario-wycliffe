'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'
import { signIn } from 'next-auth/react'

export default function RegistroPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'success'>('form')

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.email || !form.password) { setError('Todos los campos son requeridos'); return }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Error al registrarse'); setLoading(false); return }

    // Auto login after register
    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    setStep('success')
    setLoading(false)
  }

  if (step === 'success') return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(201,168,76,0.07)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative z-10 text-center max-w-sm">
        <div className="text-5xl mb-4" style={{filter:'drop-shadow(0 0 16px rgba(201,168,76,0.6))'}}>✠</div>
        <h1 className="font-cinzel text-2xl text-[#C9A84C] tracking-widest mb-2">BIENVENIDO</h1>
        <p className="text-[#F5EDD8]/60 italic mb-1">Bienvenido a Seminario Wycliffe</p>
        <p className="text-[#F5EDD8]/40 text-sm mb-8">{form.name}</p>
        <div className="border border-[#C9A84C]/15 rounded-lg p-6 bg-white/[0.02] mb-6 text-left">
          <p className="text-[#F5EDD8]/60 text-sm leading-relaxed italic">
            "El camino del rector es como la luz de la aurora, que va en aumento hasta que el día es perfecto."
          </p>
          <p className="text-[#C9A84C]/50 text-xs mt-2 text-right font-cinzel">— Proverbios 4:18</p>
        </div>
        <Link href="/cursos" className="block w-full py-3 bg-[#C9A84C] text-[#021A38] font-cinzel font-semibold tracking-widest text-sm rounded hover:bg-[#E8C97A] transition-colors text-center mb-3">
          VER CURSOS →
        </Link>
        <Link href="/" className="block text-center text-xs font-cinzel tracking-widest text-[#F5EDD8]/30 hover:text-[#F5EDD8]/50 transition-colors">
          IR AL INICIO
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(201,168,76,0.07)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-3" style={{filter:'drop-shadow(0 0 12px rgba(201,168,76,0.5))'}}>✠</span>
          <h1 className="font-cinzel text-2xl text-[#C9A84C] tracking-widest">ÚNETE AL SEMINARIO</h1>
          <p className="text-[#F5EDD8]/50 text-sm mt-2 italic">Crea tu cuenta de discípulo</p>
        </div>

        <div className="border border-[#C9A84C]/20 rounded-lg p-8 bg-white/[0.02]">
          <div className="space-y-4">
            {[
              { label: 'NOMBRE COMPLETO', key: 'name', type: 'text', placeholder: 'Tu nombre' },
              { label: 'EMAIL', key: 'email', type: 'email', placeholder: 'tu@email.com' },
              { label: 'CONTRASEÑA', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'CONFIRMAR CONTRASEÑA', key: 'confirm', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="font-cinzel text-xs tracking-widest text-[#C9A84C]/70 block mb-2">{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full bg-white/5 border border-[#C9A84C]/20 rounded px-4 py-3 text-[#F5EDD8] text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 text-center">
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 bg-[#C9A84C] text-[#021A38] font-cinzel font-semibold tracking-widest text-sm rounded hover:bg-[#E8C97A] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'CREANDO CUENTA...' : 'CREAR CUENTA →'}
            </button>

            <p className="text-center text-xs text-[#F5EDD8]/35 pt-2">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/signin" className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors font-cinzel tracking-wider">
                INICIA SESIÓN
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
