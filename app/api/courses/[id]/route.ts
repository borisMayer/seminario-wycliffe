import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } }
      }
    })
    if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check enrollment if logged in
    const session = await getServerSession(authOptions)
    let enrolled = false
    if (session) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: (session.user as any).id, courseId: id } }
      })
      enrolled = !!enrollment
    }
    return NextResponse.json({ ...course, enrolled })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
