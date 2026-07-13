import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Admin hardcoded fallback
        if (
          credentials.email === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          // Also ensure admin exists in DB
          try {
            const admin = await prisma.user.upsert({
              where: { email: credentials.email },
              update: {},
              create: { email: credentials.email, name: 'Rector', role: 'RECTOR', password: credentials.password }
            })
            return { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
          } catch {
            return { id: 'rector-001', name: 'Rector', email: credentials.email, role: 'RECTOR' }
          }
        }

        // DB student login
        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } })
          if (user && user.password === credentials.password) {
            return { id: user.id, name: user.name, email: user.email, role: user.role }
          }
        } catch { /* DB not ready */ }

        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.role = (user as any).role; token.id = user.id }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: { signIn: '/auth/signin' },
  session: { strategy: 'jwt' },
}
