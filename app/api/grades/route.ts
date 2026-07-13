import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  const targetUserId = searchParams.get('userId')
  const sessionUserId = (session.user as any).id
  const isRector = (session.user as any).role === 'RECTOR'

  const userId = isRector && targetUserId ? targetUserId : sessionUserId
  if (!isRector && userId !== sessionUserId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const where: any = {}
    if (!isRector || targetUserId) where.userId = userId
    if (courseId) where.assignment = { courseId }

    const grades = await prisma.grade.findMany({
      where,
      include: { assignment: { include: { course: { select: { id: true, title: true, category: true } } } } },
      orderBy: { gradedAt: 'desc' }
    })
    // Attach userId to each grade for frontend use
    return NextResponse.json(grades.map(g => ({ ...g, userId: g.userId })))
  } catch { return NextResponse.json([]) }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { assignmentId, userId, score, comment } = await req.json()
    const gradedBy = (session.user as any).id
    const grade = await prisma.grade.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      update: { score: parseFloat(score), comment, gradedAt: new Date(), gradedBy },
      create: { assignmentId, userId, score: parseFloat(score), comment, gradedBy },
      include: { assignment: { include: { course: { select: { id: true, title: true, category: true } } } } }
    })
    return NextResponse.json({ ...grade, userId: grade.userId })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
