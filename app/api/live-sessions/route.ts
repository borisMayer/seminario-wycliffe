import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const global = searchParams.get('global')
  try {
    const where: any = {}
    if (courseId) where.courseId = courseId
    if (global === 'true') where.isGlobal = true
    const sessions = await prisma.liveSession.findMany({
      where,
      include: { course: { select: { id: true, title: true, category: true } } },
      orderBy: { scheduledAt: 'asc' }
    })
    return NextResponse.json(sessions)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { courseId, title, description, meetingUrl, platform, scheduledAt, duration, isGlobal, materials } = await req.json()
    if (!title || !meetingUrl || !scheduledAt)
      return NextResponse.json({ error: 'Título, link y fecha requeridos' }, { status: 400 })
    const ls = await prisma.liveSession.create({
      data: {
        courseId: courseId || null,
        title, description: description || null,
        meetingUrl, platform: platform || 'other',
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration) || 60,
        isGlobal: isGlobal ?? false,
        materials: materials ? JSON.stringify(materials) : null
      },
      include: { course: { select: { id: true, title: true, category: true } } }
    })
    return NextResponse.json(ls, { status: 201 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
