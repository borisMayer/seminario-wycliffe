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

export function getCloudinary() {
  if (!configured) {
    const cloud_name = clean(process.env.CLOUDINARY_CLOUD_NAME)
    const api_key = clean(process.env.CLOUDINARY_API_KEY)
    const api_secret = clean(process.env.CLOUDINARY_API_SECRET)

    const missing = [
      !cloud_name && 'CLOUDINARY_CLOUD_NAME',
      !api_key && 'CLOUDINARY_API_KEY',
      !api_secret && 'CLOUDINARY_API_SECRET',
    ].filter(Boolean)

    if (missing.length) {
      throw new Error(
        `Cloudinary sin configurar: ${missing.join(', ')} falta o sigue con el valor de plantilla. ` +
        `Corrígelo en Vercel → Settings → Environment Variables y vuelve a desplegar.`
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
