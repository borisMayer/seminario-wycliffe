import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Diagnóstico de la conexión con Cloudinary (solo RECTOR).
 *
 * Responde qué falta y por qué, en lenguaje claro, para no tener que
 * adivinar mirando los logs de Vercel.
 */

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { cloud_name, api_key, api_secret, source } = (await import('@/lib/cloudinary')).readCredentials()

  const missing = [!cloud_name && 'CLOUDINARY_CLOUD_NAME', !api_key && 'CLOUDINARY_API_KEY', !api_secret && 'CLOUDINARY_API_SECRET'].filter(Boolean)
  if (missing.length) {
    return NextResponse.json({
      ok: false,
      stage: 'variables',
      missing,
      message:
        `No hay credenciales de Cloudinary en este despliegue. Opción A: añade las tres variables ${missing.join(', ')}. ` +
        `Opción B, más simple: añade una sola variable llamada CLOUDINARY_URL con el valor cloudinary://api_key:api_secret@cloud_name que copias de la consola de Cloudinary. ` +
        `En ambos casos marca Production, Preview y Development, y después haz Redeploy: las variables solo se aplican en un despliegue nuevo.`,
    })
  }

  const vars = { CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret }

  try {
    const { getCloudinary } = await import('@/lib/cloudinary')
    const cloudinary = getCloudinary()

    // ping() valida cloud_name + api_key + api_secret contra el servidor real
    await cloudinary.api.ping()

    // Comprueba si la entrega de PDF/ZIP está permitida en la cuenta
    let pdfDelivery: boolean | null = null
    try {
      const settings: any = await (cloudinary.api as any).config({ settings: true })
      const flag = settings?.settings?.secure_delivery?.pdf_and_zip_delivery ?? settings?.settings?.pdf_and_zip_delivery
      pdfDelivery = typeof flag === 'boolean' ? flag : null
    } catch {
      pdfDelivery = null
    }

    return NextResponse.json({
      ok: true,
      stage: 'conectado',
      cloudName: vars.CLOUDINARY_CLOUD_NAME,
      apiKeyTail: `…${vars.CLOUDINARY_API_KEY!.slice(-4)}`,
      source,
      pdfDelivery,
      message: 'Conexión con Cloudinary correcta. Ya puedes subir materiales.',
    })
  } catch (e: any) {
    const status = e?.error?.http_code ?? e?.http_code
    const detail = e?.error?.message ?? e?.message ?? 'error desconocido'
    const credencialesMal = status === 401 || /invalid signature|unknown api_key|api_secret/i.test(detail)

    return NextResponse.json({
      ok: false,
      stage: 'conexion',
      httpCode: status ?? null,
      detail,
      message: credencialesMal
        ? `Cloudinary rechazó las credenciales (${detail}). Cópialas de nuevo desde console.cloudinary.com → Settings → API Keys, sin espacios ni comillas, y vuelve a desplegar. Ojo: el API Secret distingue entre la letra "l" minúscula y la "I" mayúscula.`
        : `No se pudo contactar con Cloudinary: ${detail}`,
    })
  }
}
