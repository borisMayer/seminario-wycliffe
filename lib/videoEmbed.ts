/**
 * Convierte la URL de un video en una URL incrustable.
 *
 * Devuelve:
 *   { kind: 'iframe', src }  → reproductor de la plataforma (YouTube, Vimeo, Drive…)
 *   { kind: 'file',   src }  → archivo directo, se usa <video src>
 *   { kind: 'link',   src }  → no se puede incrustar, solo abrir en pestaña nueva
 */

export type VideoEmbed = { kind: 'iframe' | 'file' | 'link'; src: string }

function id(match: RegExpMatchArray | null, group = 1): string | null {
  return match?.[group] ?? null
}

export function getVideoEmbed(rawUrl: string): VideoEmbed {
  const url = (rawUrl ?? '').trim()
  if (!url) return { kind: 'link', src: url }

  // ── YouTube: watch, youtu.be, shorts, live, embed ──
  const yt = id(
    url.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    )
  )
  if (yt) {
    // Respeta el minuto de inicio si viene en la URL (?t=90 o &start=90)
    const t = id(url.match(/[?&](?:t|start)=(\d+)/))
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt}${t ? `?start=${t}` : ''}` }
  }

  // ── Vimeo (incluye enlaces privados vimeo.com/123/abc) ──
  const vimeo = id(url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/))
  if (vimeo) {
    const hash = id(url.match(/vimeo\.com\/\d+\/([A-Za-z0-9]+)/))
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo}${hash ? `?h=${hash}` : ''}` }
  }

  // ── Google Drive ──
  const drive = id(url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([A-Za-z0-9_-]+)/))
  if (drive) return { kind: 'iframe', src: `https://drive.google.com/file/d/${drive}/preview` }

  // ── Loom ──
  const loom = id(url.match(/loom\.com\/(?:share|embed)\/([A-Za-z0-9]+)/))
  if (loom) return { kind: 'iframe', src: `https://www.loom.com/embed/${loom}` }

  // ── Dailymotion ──
  const dm = id(url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([A-Za-z0-9]+)/))
  if (dm) return { kind: 'iframe', src: `https://www.dailymotion.com/embed/video/${dm}` }

  // ── Twitch (VOD) ──
  const twitch = id(url.match(/twitch\.tv\/videos\/(\d+)/))
  if (twitch) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'seminariowycliffe.com'
    return { kind: 'iframe', src: `https://player.twitch.tv/?video=${twitch}&parent=${host}&autoplay=false` }
  }

  // ── Streamable ──
  const streamable = id(url.match(/streamable\.com\/(?:e\/)?([A-Za-z0-9]+)/))
  if (streamable) return { kind: 'iframe', src: `https://streamable.com/e/${streamable}` }

  // ── Facebook / Rumble / Odysee: reproductores genéricos ──
  if (/facebook\.com\/.+\/videos\/|fb\.watch\//.test(url)) {
    return { kind: 'iframe', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false` }
  }
  const rumble = id(url.match(/rumble\.com\/embed\/([A-Za-z0-9]+)/))
  if (rumble) return { kind: 'iframe', src: `https://rumble.com/embed/${rumble}/` }

  // ── Archivo de video directo (incluye Cloudinary) ──
  if (/\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i.test(url)) return { kind: 'file', src: url }
  if (/res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url)) return { kind: 'file', src: url }

  // ── Ya es una URL de incrustación conocida ──
  if (/\/embed\/|player\./.test(url)) return { kind: 'iframe', src: url }

  return { kind: 'link', src: url }
}

/** ¿La URL apunta a un video alojado en una plataforma externa (no descargable)? */
export function isExternalPlatformVideo(url: string): boolean {
  return getVideoEmbed(url).kind === 'iframe'
}
