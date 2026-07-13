import Link from 'next/link'
import { Emblem } from '@/app/components/Emblem'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const isRector = (session?.user as any)?.role === 'RECTOR'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(201,168,76,0.07)_0%,transparent_60%)] pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-3 border-b border-[#C9A84C]/10 bg-[#021A38]/80 backdrop-blur-sm">
        <span className="font-cinzel text-xs tracking-[0.3em] text-[#C9A84C]">✠ SEMINARIO WYCLIFFE</span>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-xs text-[#F5EDD8]/40 italic hidden sm:block">{session.user?.name}</span>
              {isRector && (
                <Link href="/rector" className="font-cinzel text-xs tracking-widest px-4 py-1.5 bg-[#C9A84C] text-[#021A38] rounded hover:bg-[#E8C97A] transition-colors font-semibold">
                  ⚙ PANEL RECTOR
                </Link>
              )}
              <Link href="/api/auth/signout" className="font-cinzel text-xs tracking-widest px-3 py-1.5 border border-[#F5EDD8]/15 text-[#F5EDD8]/40 rounded hover:border-[#F5EDD8]/30 transition-colors">
                SALIR
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="font-cinzel text-xs tracking-widest px-4 py-1.5 border border-[#C9A84C]/40 text-[#C9A84C] rounded hover:border-[#C9A84C] transition-colors">
                INICIAR SESIÓN
              </Link>
              <Link href="/auth/registro" className="font-cinzel text-xs tracking-widest px-4 py-1.5 bg-[#C9A84C] text-[#021A38] rounded hover:bg-[#E8C97A] transition-colors font-semibold">
                REGISTRARSE
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="relative z-10 text-center max-w-3xl mx-auto mt-12">
        <div className="mb-6 flex justify-center" style={{filter:'drop-shadow(0 0 20px rgba(201,168,76,0.5))'}}><Emblem size={90}/></div>
        <h1 className="font-cinzel text-4xl md:text-6xl font-bold text-[#C9A84C] tracking-widest mb-2">SEMINARIO WYCLIFFE</h1>
        <p className="font-cinzel text-sm tracking-[0.4em] text-[#F5EDD8]/50 mb-6">SEMINARIO REFORMADO DE TEOLOGÍA · VERITAS · FIDES · SAPIENTIA</p>
        <p className="text-[#F5EDD8]/70 text-lg italic leading-relaxed mb-10">
          En la tradición de Juan Wycliffe de Oxford: rigor académico,<br />fidelidad bíblica y teología reformada para la Iglesia global.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cursos" className="px-8 py-3 bg-[#C9A84C] text-[#021A38] font-cinzel font-semibold tracking-widest text-sm rounded hover:bg-[#E8C97A] transition-colors">VER CURSOS</Link>
          <Link href="/biblioteca" className="px-8 py-3 border border-[#C9A84C]/40 text-[#C9A84C] font-cinzel tracking-widest text-sm rounded hover:border-[#C9A84C] transition-colors">BIBLIOTECA TEOLÓGICA</Link>
          <Link href="/comunidad" className="px-8 py-3 border border-[#F5EDD8]/20 text-[#F5EDD8]/60 font-cinzel tracking-widest text-sm rounded hover:border-[#F5EDD8]/40 transition-colors">COMUNIDAD</Link>
          <Link href="/precios" className="px-8 py-3 border border-[#C9A84C]/40 text-[#C9A84C] font-cinzel tracking-widest text-sm rounded hover:bg-[#C9A84C]/10 transition-colors">PRECIOS</Link>
          <Link href="/academico" className="px-8 py-3 border border-[#F5EDD8]/20 text-[#F5EDD8]/60 font-cinzel tracking-widest text-sm rounded hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-colors">ACADÉMICO</Link>
          <Link href="/clases-en-vivo" className="px-8 py-3 border border-[#F5EDD8]/20 text-[#F5EDD8]/60 font-cinzel tracking-widest text-sm rounded hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-colors">EN VIVO</Link>
        </div>
      </div>

      <div className="relative z-10 mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
        {[
          { icon: '📖', title: 'Aula Virtual', desc: 'Cursos y lecciones estructuradas', href: '/cursos' },
          { icon: '📚', title: 'Biblioteca', desc: 'Textos clásicos y comentarios', href: '/biblioteca' },
          { icon: '🕊', title: 'Comunidad', desc: 'Foro de discusión teológica', href: '/comunidad' },
          { icon: '🎓', title: 'Mi Progreso', desc: 'Seguimiento académico', href: '/dashboard' },
        ].map((item) => (
          <Link key={item.title} href={item.href} className="group p-5 border border-[#C9A84C]/15 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#C9A84C]/35 transition-all">
            <span className="text-2xl block mb-2">{item.icon}</span>
            <div className="font-cinzel text-xs tracking-widest text-[#E8C97A] mb-1">{item.title}</div>
            <div className="text-xs text-[#F5EDD8]/50">{item.desc}</div>
          </Link>
        ))}
      </div>

      {!session && (
        <div className="relative z-10 mt-10 text-center">
          <p className="text-[#F5EDD8]/30 text-sm italic mb-3">¿Listo para comenzar tu formación?</p>
          <Link href="/auth/registro" className="font-cinzel text-sm tracking-widest px-8 py-3 border border-[#C9A84C]/30 text-[#C9A84C]/70 rounded-full hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
            CREAR CUENTA GRATUITA →
          </Link>
        </div>
      )}

      {isRector && (
        <div className="relative z-10 mt-6">
          <Link href="/rector" className="flex items-center gap-2 font-cinzel text-xs tracking-widest text-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors border border-[#C9A84C]/12 hover:border-[#C9A84C]/30 px-5 py-2 rounded-full">
            ⚙ PANEL DE ADMINISTRACIÓN
          </Link>
        </div>
      )}
    </main>
  )
}
