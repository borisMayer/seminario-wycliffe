/**
 * Utilidades de descarga de materiales. Sin dependencias de servidor:
 * este módulo se usa desde componentes de cliente.
 */

/** Extensión real del archivo a partir de la URL de entrega. */
export function extensionFromUrl(url: string): string | null {
  const path = url.split('?')[0].split('#')[0]
  const last = path.split('/').pop() ?? ''
  const ext = last.includes('.') ? last.split('.').pop()! : ''
  return /^[a-zA-Z0-9]{2,5}$/.test(ext) ? ext.toLowerCase() : null
}

/**
 * Convierte una URL de Cloudinary en una URL de descarga forzada.
 *
 * El atributo `download` de HTML se ignora cuando el archivo vive en otro
 * dominio, así que el navegador abría el material en vez de guardarlo. El
 * marcador `fl_attachment` hace que Cloudinary responda con
 * Content-Disposition: attachment y el nombre que le indiquemos.
 *
 * Si la URL no es de Cloudinary, se devuelve intacta.
 */
export function toDownloadUrl(url: string, fileName?: string): string {
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/)(.*)$/)
  if (!m) return url

  const base = (fileName ?? '')
    .replace(/\.[^./]+$/, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${m[1]}${base ? `fl_attachment:${base}` : 'fl_attachment'}/${m[2]}`
}
