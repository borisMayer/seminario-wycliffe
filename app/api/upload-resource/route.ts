import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCloudinary } from '@/lib/cloudinary'

/**
 * Subida de materiales de lección a Cloudinary.
 *
 * Cloudinary aplica límites distintos según cómo clasifique el archivo:
 *   video/audio  → resource_type 'video' → 100 MB en el plan Free
 *   imágenes     → resource_type 'image' →  10 MB
 *   el resto     → resource_type 'raw'   →  10 MB
 *
 * Por eso el audio de una clase se sube como 'video': si fuera 'raw' se
 * quedaría en 10 MB, insuficiente para una grabación de una hora.
 */

const AUDIO_MIME = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac']
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const DOC_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/epub+zip',
  'text/plain',
  'text/markdown',
]

const MB = 1024 * 1024

function classify(mime: string, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''

  if (AUDIO_MIME.includes(mime) || ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) {
    return { cloudinaryType: 'video' as const, resourceType: 'audio', maxBytes: 100 * MB }
  }
  if (VIDEO_MIME.includes(mime) || ['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
    return { cloudinaryType: 'video' as const, resourceType: 'video', maxBytes: 100 * MB }
  }
  if (IMAGE_MIME.includes(mime) || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) {
    return { cloudinaryType: 'image' as const, resourceType: 'image', maxBytes: 10 * MB }
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return { cloudinaryType: 'raw' as const, resourceType: 'pdf', maxBytes: 10 * MB }
  }
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) {
    return { cloudinaryType: 'raw' as const, resourceType: 'slides', maxBytes: 10 * MB }
  }
  if (DOC_MIME.includes(mime) || ['doc', 'docx', 'txt', 'md', 'epub'].includes(ext)) {
    return { cloudinaryType: 'raw' as const, resourceType: 'text', maxBytes: 10 * MB }
  }
  // Hojas de cálculo, otros formatos de documento y archivos comprimidos
  if (
    ['xls', 'xlsx', 'csv', 'rtf', 'odt', 'ods', 'odp', 'zip'].includes(ext) ||
    ['application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'text/csv',
     'application/rtf', 'text/rtf',
     'application/vnd.oasis.opendocument.text',
     'application/vnd.oasis.opendocument.spreadsheet',
     'application/vnd.oasis.opendocument.presentation',
     'application/zip', 'application/x-zip-compressed'].includes(mime)
  ) {
    return { cloudinaryType: 'raw' as const, resourceType: 'text', maxBytes: 10 * MB }
  }
  return null
}

function humanMB(bytes: number) {
  return `${Math.round(bytes / MB)} MB`
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const lessonId = (formData.get('lessonId') as string | null) ?? 'sin-leccion'
    if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })

    const kind = classify(file.type, file.name)
    if (!kind) {
      return NextResponse.json(
        { error: 'Formato no admitido. Se aceptan PDF, Word, Excel, PowerPoint, CSV, RTF, ODT, ZIP, TXT, EPUB, audio (mp3, wav, m4a), video (mp4, webm, mov) e imágenes.' },
        { status: 400 }
      )
    }

    if (file.size > kind.maxBytes) {
      return NextResponse.json(
        { error: `El archivo pesa ${humanMB(file.size)} y el límite para este formato es ${humanMB(kind.maxBytes)} en el plan actual de Cloudinary.` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_')

    const result = await new Promise<any>((resolve, reject) => {
      getCloudinary().uploader.upload_stream(
        {
          folder: `seminario-wycliffe/materiales/${lessonId}`,
          resource_type: kind.cloudinaryType,
          public_id: `${Date.now()}-${baseName}`,
          use_filename: true,
          unique_filename: false,
        },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      ).end(buffer)
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      // Sugerencias para prellenar el formulario de material
      suggestedTitle: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim(),
      type: kind.resourceType,
      fileSize: result.bytes ?? file.size,
      duration: result.duration ? Math.round(result.duration) : null,
      format: result.format ?? null,
    })
  } catch (e: any) {
    console.error('[API ERROR] upload-resource', e)
    return NextResponse.json({ error: e?.message ?? 'Error al subir el archivo' }, { status: 500 })
  }
}
