import { v2 as cloudinary } from 'cloudinary'

/**
 * Configuración de Cloudinary.
 *
 * Las credenciales viven SOLO en variables de entorno. Nunca en el código:
 * este repositorio es público y cualquier clave escrita aquí queda expuesta
 * de forma permanente en el historial de git.
 */

// Marcadores de plantilla que se cuelan al copiar y pegar bloques .env
const PLACEHOLDER = /^(pega_aqui|pega-aqui|changeme|placeholder|todo|xxx+)$/i

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || PLACEHOLDER.test(trimmed)) return undefined
  return trimmed
}

let configured = false

/**
 * Lee las credenciales aceptando los dos formatos posibles:
 *   a) Tres variables sueltas: CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET
 *   b) Una sola: CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
 *      (es la línea que la consola de Cloudinary ofrece copiar tal cual)
 */
export function readCredentials(): {
  cloud_name?: string
  api_key?: string
  api_secret?: string
  source: 'variables' | 'CLOUDINARY_URL' | 'ninguna'
} {
  const cloud_name = clean(process.env.CLOUDINARY_CLOUD_NAME)
  const api_key = clean(process.env.CLOUDINARY_API_KEY)
  const api_secret = clean(process.env.CLOUDINARY_API_SECRET)

  if (cloud_name && api_key && api_secret) {
    return { cloud_name, api_key, api_secret, source: 'variables' }
  }

  // Respaldo: CLOUDINARY_URL (admite que venga con el prefijo "CLOUDINARY_URL=" pegado por error)
  const raw = clean(process.env.CLOUDINARY_URL)?.replace(/^CLOUDINARY_URL=/i, '').replace(/^["']|["']$/g, '')
  const m = raw?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/)
  if (m) {
    return { api_key: m[1].trim(), api_secret: m[2].trim(), cloud_name: m[3].trim(), source: 'CLOUDINARY_URL' }
  }

  return { cloud_name, api_key, api_secret, source: 'ninguna' }
}

export function getCloudinary() {
  if (!configured) {
    const { cloud_name, api_key, api_secret } = readCredentials()

    const missing = [
      !cloud_name && 'CLOUDINARY_CLOUD_NAME',
      !api_key && 'CLOUDINARY_API_KEY',
      !api_secret && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean)

    if (missing.length) {
      throw new Error(
        `Cloudinary sin configurar: ${missing.join(', ')} falta o sigue con el valor de plantilla. ` +
        `Corrígelo en Vercel → Settings → Environment Variables y vuelve a desplegar. ` +
        `También sirve una única variable CLOUDINARY_URL con el valor cloudinary://api_key:api_secret@cloud_name.`
      )
    }

    cloudinary.config({ cloud_name, api_key, api_secret, secure: true })
    configured = true
  }
  return cloudinary
}

/**
 * Borra de Cloudinary el archivo al que apunta una URL de entrega.
 *
 * Deriva el public_id y el resource_type desde la propia URL, de modo que
 * no hace falta guardar esos campos en la base de datos. Si la URL no es
 * de Cloudinary (p. ej. un enlace externo de YouTube) no hace nada.
 *
 * Nunca lanza: un fallo al borrar el binario no debe impedir que el
 * registro desaparezca de la plataforma.
 */
export async function destroyByUrl(url: string): Promise<void> {
  try {
    if (!url.includes('res.cloudinary.com')) return

    // https://res.cloudinary.com/<cloud>/<resource_type>/upload/v123/carpeta/archivo.ext
    const match = url.match(
      /res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/
    )
    if (!match) return

    const resourceType = match[1] as 'image' | 'video' | 'raw'
    let publicId = decodeURIComponent(match[2])

    // En image/video la extensión NO forma parte del public_id; en raw sí.
    if (resourceType !== 'raw') {
      publicId = publicId.replace(/\.[^./]+$/, '')
    }

    await getCloudinary().uploader.destroy(publicId, { resource_type: resourceType })
  } catch (e) {
    console.error('[Cloudinary] No se pudo borrar el archivo remoto:', e)
  }
}

export default getCloudinary
