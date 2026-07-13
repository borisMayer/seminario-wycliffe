import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { lessons: true, enrollments: true } },
        enrollments: { include: { user: { select: { id: true, name: true, email: true, role: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(courses)
  } catch (error) {
    console.error('[API ERROR]', error); return NextResponse.json([]) }
}
