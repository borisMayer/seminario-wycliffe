import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Ruta temporal de demostración: inserta materiales de prueba en una lección.
export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('key') !== '6814296c90047d8a15b33f3276b6e84c22bcecc5') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const lessonId = url.searchParams.get('lessonId')
  if (!lessonId) return NextResponse.json({ error: 'falta lessonId' }, { status: 400 })

  const demos = [
    { title: 'PRUEBA — Emblema del Seminario', type: 'image', url: 'https://seminariowycliffe.com/emblem.svg', description: 'Material de prueba. Puedes eliminarlo desde el Panel Rector.', fileSize: 620, duration: null, order: 0 },
    { title: 'PRUEBA — Ficha tecnica de la plataforma', type: 'text', url: 'https://seminariowycliffe.com/manifest.json', description: 'Segundo material de prueba para verificar filtros y descarga.', fileSize: 2400, duration: null, order: 1 },
    { title: 'PRUEBA — Enlace externo de video', type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', description: 'Enlace externo: se abre, no se descarga ni entra al ZIP.', fileSize: null, duration: 213, order: 2 },
  ]

  const created = []
  for (const d of demos) {
    created.push(await prisma.lessonResource.create({ data: { lessonId, ...d } }))
  }
  const total = await prisma.lessonResource.count({ where: { lessonId } })
  return NextResponse.json({ creados: created.length, totalEnLeccion: total, ids: created.map(c => c.id) })
}
