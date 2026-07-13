# Seminario Wycliffe de Teología

**Veritas · Fides · Sapientia**

Plataforma virtual del Seminario Wycliffe de Teología (Fundación Teológica Chilena) — seminario reformado y evangélico en la tradición de Juan Wycliffe (1320–1384), erudito y reformador de Oxford.

## Programas
- Bachillerato en Teología (B.Th.) — 4 años, 128 unidades
- Licenciatura en Estudios Bíblicos (L.A.)
- Maestría en Divinidad (M.Div.) · Maestría en Teología (Th.M.) · Maestría en Consejería Bíblica (M.C.B.)
- Doctor en Ministerio (D.Min.) · Ph.D. en Teología

## Plataforma
- **Aula Virtual** — cursos, lecciones, tareas y calificaciones
- **Biblioteca Teológica** — dos niveles de acceso (general y premium)
- **Comunidad** — foro de discusión teológica
- **Clases en Vivo** — sesiones síncronas
- **Panel Rector** — administración académica completa
- **Pagos** — MercadoPago integrado

## Stack
Next.js 16 · React 19 · Prisma + Neon PostgreSQL · NextAuth · Cloudinary · Tailwind CSS 4 · PWA

## Desarrollo
```bash
npm install
cp .env.example .env   # configurar credenciales
npx prisma generate
npm run dev
```

## Variables de entorno requeridas
Ver `.env.example`: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CLOUDINARY_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `RESEND_API_KEY`.

— Seminario Wycliffe de Teología · www.wycliffe-chile.com
