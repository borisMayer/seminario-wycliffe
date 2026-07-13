'use client'
import { Emblem } from '@/app/components/Emblem'
import { useState, useEffect } from 'react'

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true); return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('pwa-dismissed')
      if (!dismissed) setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShowBanner(false); setDeferredPrompt(null)
  }

  const dismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!showBanner || installed) return null

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 999, width: 'calc(100% - 3rem)', maxWidth: '420px', background: '#1a1608', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '12px', padding: '1rem 1.2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '2rem', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.5))' }}>✠</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', letterSpacing: '0.15em', color: '#C9A84C', marginBottom: '0.2rem' }}>INSTALAR APP</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(245,237,216,0.55)' }}>Agrega Seminario Wycliffe a tu pantalla de inicio</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
        <button onClick={install} style={{ padding: '0.4rem 0.9rem', background: '#C9A84C', color: '#021A38', border: 'none', borderRadius: '5px', fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>INSTALAR</button>
        <button onClick={dismiss} style={{ padding: '0.3rem', background: 'transparent', border: 'none', color: 'rgba(245,237,216,0.3)', fontSize: '0.68rem', cursor: 'pointer', textAlign: 'center' }}>Ahora no</button>
      </div>
    </div>
  )
}
