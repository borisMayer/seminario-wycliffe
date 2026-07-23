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
Ver `.env.example`: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `RESEND_API_KEY`.

## Materiales de lección (Cloudinary)

**Flujo:** Panel Rector → pestaña *Lecciones* de un curso → botón *Materiales* de la lección → arrastrar el archivo o pegar un enlace externo → *Añadir material*. El alumno lo ve al instante en la lección (`/cursos/[id]`), con filtros por tipo, marcado de revisado y «Descargar todo» (ZIP).

**Carpetas en Cloudinary** (se crean solas en la primera subida):
- `seminario-wycliffe/materiales/<lessonId>/` — materiales de cada lección
- `seminario-wycliffe/trabajos/<userId>/` — entregas de alumnos

**Formatos y límites (plan Free de Cloudinary):**
- Audio y video (mp3, wav, m4a, mp4, webm, mov): hasta 100 MB
- PDF, Word, Excel, PowerPoint, CSV, RTF, ODT, ZIP, EPUB, TXT, imágenes: hasta 10 MB

**Importante — entrega de PDF/ZIP:** en cuentas nuevas de Cloudinary la descarga pública de PDF y ZIP viene deshabilitada. Actívala una sola vez en **console.cloudinary.com → Settings → Security → "PDF and ZIP files delivery" → Allow delivery**. Sin esto, los PDF suben bien pero el alumno recibe un error al abrirlos.

Al eliminar un material desde el Panel Rector, el archivo también se borra de Cloudinary automáticamente.

— Seminario Wycliffe de Teología · www.wycliffe-chile.com
