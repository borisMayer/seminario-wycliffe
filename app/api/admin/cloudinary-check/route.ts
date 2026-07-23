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

  const vars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY?.trim(),
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET?.trim(),
  }

  const missing = Object.entries(vars).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) {
    return NextResponse.json({
      ok: false,
      stage: 'variables',
      missing,
      message:
        `Faltan variables de entorno en Vercel: ${missing.join(', ')}. ` +
        `Añádelas en Vercel → Settings → Environment Variables (Production, Preview y Development) y vuelve a desplegar.`,
    })
  }

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
