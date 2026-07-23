import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/lessons/[lessonId]/resources
// Devuelve los recursos de la lección y, si hay sesión, cuáles ya completó el alumno.
export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  try {
    const resources = await prisma.lessonResource.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' }
    })

    const session = await getServerSession(authOptions)
    let completedIds: string[] = []
    if (session) {
      const completions = await prisma.resourceCompletion.findMany({
        where: {
          userId: (session.user as any).id,
          resourceId: { in: resources.map((r: { id: string }) => r.id) }
        },
        select: { resourceId: true }
      })
      completedIds = completions.map((c: { resourceId: string }) => c.resourceId)
    }

    return NextResponse.json({ resources, completedIds })
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json({ resources: [], completedIds: [] })
  }
}

// POST /api/lessons/[lessonId]/resources  — alta de recurso (solo RECTOR)
export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { lessonId } = await params
  try {
    const body = await req.json()
    const resource = await prisma.lessonResource.create({
      data: {
        lessonId,
        title: body.title,
        type: body.type ?? 'pdf',
        url: body.url,
        description: body.description ?? null,
        fileSize: body.fileSize ?? null,
        duration: body.duration ?? null,
        downloadable: body.downloadable ?? true,
        isPremium: body.isPremium ?? false,
        order: body.order ?? 0
      }
    })
    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json({ error: 'Error creating resource' }, { status: 500 })
  }
}
