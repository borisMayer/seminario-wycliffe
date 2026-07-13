import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: (session.user as any).id },
      include: { course: { include: { _count: { select: { lessons: true } } } } }
    })
    return NextResponse.json(enrollments)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { courseId } = await req.json()
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: (session.user as any).id, courseId } }
    })
    if (existing) return NextResponse.json({ error: 'Ya estás matriculado' }, { status: 409 })
    const enrollment = await prisma.enrollment.create({
      data: { userId: (session.user as any).id, courseId }
    })
    return NextResponse.json(enrollment, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al matricularse' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { courseId } = await req.json()
    await prisma.enrollment.delete({
      where: { userId_courseId: { userId: (session.user as any).id, courseId } }
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al cancelar matrícula' }, { status: 500 })
  }
}
