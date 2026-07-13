import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  try {
    const assignments = await prisma.assignment.findMany({
      where: courseId ? { courseId } : {},
      include: { _count: { select: { submissions: true, grades: true } } },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error('[API ERROR]', error); return NextResponse.json([]) }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { courseId, title, description, type, weight, dueDate } = await req.json()
    if (!courseId || !title || !type) return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })
    const a = await prisma.assignment.create({
      data: { courseId, title, description, type, weight: parseFloat(weight) || 0, dueDate: dueDate ? new Date(dueDate) : null },
      include: { _count: { select: { submissions: true, grades: true } } }
    })
    return NextResponse.json(a, { status: 201 })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
