import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const assignmentId = searchParams.get('assignmentId')
  const userId = (session.user as any).id
  const isRector = (session.user as any).role === 'RECTOR'
  try {
    const where: any = assignmentId ? { assignmentId } : {}
    if (!isRector) where.userId = userId
    const submissions = await prisma.submission.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } }, assignment: { select: { title: true, type: true, weight: true } } },
      orderBy: { submittedAt: 'desc' }
    })
    return NextResponse.json(submissions)
  } catch (error) {
    console.error('[API ERROR]', error) return NextResponse.json([]) }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { assignmentId, fileUrl, content } = await req.json()
    const userId = (session.user as any).id
    const sub = await prisma.submission.upsert({
      where: { assignmentId_userId: { assignmentId, userId } },
      update: { fileUrl, content, submittedAt: new Date() },
      create: { assignmentId, userId, fileUrl, content },
      include: { user: { select: { id: true, name: true, email: true } }, assignment: { select: { title: true, type: true, weight: true } } }
    })
    return NextResponse.json(sub, { status: 201 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
