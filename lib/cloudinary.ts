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

export default getCloudinary
