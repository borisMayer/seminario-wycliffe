import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Prueba de funcionamiento de extremo a extremo (solo RECTOR).
 *
 * Sube un archivo real y diminuto a Cloudinary, comprueba que la URL
 * devuelta responde, y lo borra. Si esto pasa, la carga de materiales
 * funciona; si falla, devuelve exactamente en qué paso se rompió.
 */

type Paso = { paso: string; ok: boolean; detalle: string }

export async function POST() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  if (!session) {
    return NextResponse.json(
      { ok: false, pasos: [{ paso: 'Sesión', ok: false, detalle: 'No hay sesión iniciada. Entra con tu cuenta de Rector.' }] },
      { status: 401 }
    )
  }
  if (role !== 'RECTOR') {
    return NextResponse.json(
      { ok: false, pasos: [{ paso: 'Permisos', ok: false, detalle: `Tu cuenta tiene el rol "${role ?? 'sin rol'}", y la carga de materiales exige rol RECTOR. Cambia el rol de tu usuario en la pestaña Estudiantes del panel.` }] },
      { status: 403 }
    )
  }

  const pasos: Paso[] = [{ paso: 'Sesión y permisos', ok: true, detalle: 'Sesión válida con rol RECTOR.' }]

  // 1 · Variables de entorno
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
  const faltan = [!cloudName && 'CLOUDINARY_CLOUD_NAME', !apiKey && 'CLOUDINARY_API_KEY', !apiSecret && 'CLOUDINARY_API_SECRET'].filter(Boolean)

  if (faltan.length) {
    pasos.push({ paso: 'Variables de entorno', ok: false, detalle: `Faltan en Vercel: ${faltan.join(', ')}. Añádelas en Settings → Environment Variables (Production, Preview y Development) y vuelve a desplegar.` })
    return NextResponse.json({ ok: false, pasos })
  }
  pasos.push({ paso: 'Variables de entorno', ok: true, detalle: `Cloud "${cloudName}", API key terminada en …${apiKey!.slice(-4)}, secreto de ${apiSecret!.length} caracteres.` })

  // Aviso: los secretos de Cloudinary tienen 27 caracteres
  if (apiSecret!.length !== 27) {
    pasos.push({ paso: 'Formato del secreto', ok: false, detalle: `El API Secret tiene ${apiSecret!.length} caracteres y deberían ser 27. Está incompleto o mal copiado: cópialo otra vez desde console.cloudinary.com → Settings → API Keys.` })
  }

  let cloudinary: any
  try {
    const mod = await import('@/lib/cloudinary')
    cloudinary = mod.getCloudinary()
  } catch (e: any) {
    pasos.push({ paso: 'Configuración del cliente', ok: false, detalle: e?.message ?? 'error desconocido' })
    return NextResponse.json({ ok: false, pasos })
  }

  // 2 · Autenticación contra Cloudinary
  try {
    await cloudinary.api.ping()
    pasos.push({ paso: 'Autenticación con Cloudinary', ok: true, detalle: 'Credenciales aceptadas.' })
  } catch (e: any) {
    const detalle = e?.error?.message ?? e?.message ?? 'error desconocido'
    pasos.push({
      paso: 'Autenticación con Cloudinary',
      ok: false,
      detalle: `Cloudinary rechazó las credenciales: ${detalle}. Revisa el API Secret (distingue "l" minúscula de "I" mayúscula) y que no lleve comillas ni espacios.`,
    })
    return NextResponse.json({ ok: false, pasos })
  }

  // 3 · Subida real de un documento de texto
  const contenido = Buffer.from(
    `Seminario Wycliffe de Teologia\nPrueba de carga de materiales\nFecha: ${new Date().toISOString()}\n`,
    'utf8'
  )
  let subido: any
  try {
    subido = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'seminario-wycliffe/materiales/_verificacion',
            resource_type: 'raw',
            public_id: `verificacion-${Date.now()}.txt`,
          },
          (error: any, res: any) => (error ? reject(error) : resolve(res))
        )
        .end(contenido)
    })
    pasos.push({ paso: 'Subida de archivo', ok: true, detalle: `Archivo creado en la carpeta seminario-wycliffe/materiales/_verificacion (${subido.bytes} bytes).` })
  } catch (e: any) {
    const detalle = e?.error?.message ?? e?.message ?? 'error desconocido'
    pasos.push({ paso: 'Subida de archivo', ok: false, detalle })
    return NextResponse.json({ ok: false, pasos })
  }

  // 4 · Comprobar que la URL entregada es accesible públicamente
  try {
    const r = await fetch(subido.secure_url, { method: 'GET' })
    if (r.ok) {
      pasos.push({ paso: 'Descarga pública', ok: true, detalle: 'La URL entregada responde correctamente. Los alumnos podrán abrir y descargar los materiales.' })
    } else {
      pasos.push({
        paso: 'Descarga pública',
        ok: false,
        detalle: `La URL respondió con código ${r.status}. Si es 401, activa en console.cloudinary.com → Settings → Security la opción «PDF and ZIP files delivery».`,
      })
    }
  } catch (e: any) {
    pasos.push({ paso: 'Descarga pública', ok: false, detalle: e?.message ?? 'no se pudo comprobar' })
  }

  // 5 · Limpieza
  try {
    await cloudinary.uploader.destroy(subido.public_id, { resource_type: 'raw', invalidate: true })
    pasos.push({ paso: 'Borrado del archivo de prueba', ok: true, detalle: 'El archivo de verificación se eliminó de Cloudinary.' })
  } catch {
    pasos.push({ paso: 'Borrado del archivo de prueba', ok: false, detalle: `Quedó un archivo suelto en seminario-wycliffe/materiales/_verificacion. Puedes borrarlo a mano.` })
  }

  const ok = pasos.every(p => p.ok)
  return NextResponse.json({ ok, pasos, url: subido.secure_url })
}
