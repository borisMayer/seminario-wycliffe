'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true); setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) { setError('Email o contraseña incorrectos'); setLoading(false) }
    else window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(201,168,76,0.07)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-3" style={{filter:'drop-shadow(0 0 12px rgba(201,168,76,0.5))'}}>✠</span>
          <h1 className="font-cinzel text-2xl text-[#C9A84C] tracking-widest">SEMINARIO WYCLIFFE</h1>
          <p className="text-[#F5EDD8]/50 text-sm mt-2 italic">Ingresa al seminario</p>
        </div>
        <div className="border border-[#C9A84C]/20 rounded-lg p-8 bg-white/[0.02]">
          <div className="space-y-4">
            <div>
              <label className="font-cinzel text-xs tracking-widest text-[#C9A84C]/70 block mb-2">EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-white/5 border border-[#C9A84C]/20 rounded px-4 py-3 text-[#F5EDD8] text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="font-cinzel text-xs tracking-widest text-[#C9A84C]/70 block mb-2">CONTRASEÑA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-white/5 border border-[#C9A84C]/20 rounded px-4 py-3 text-[#F5EDD8] text-sm focus:outline-none focus:border-[#C9A84C]/50 transition-colors" placeholder="••••••••" />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2 text-center">{error}</div>}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 bg-[#C9A84C] text-[#021A38] font-cinzel font-semibold tracking-widest text-sm rounded hover:bg-[#E8C97A] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'VERIFICANDO...' : 'ENTRAR →'}
            </button>
            <div className="pt-2 space-y-2 text-center">
              <p className="text-xs text-[#F5EDD8]/35">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/registro" className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors font-cinzel tracking-wider">REGÍSTRATE</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
