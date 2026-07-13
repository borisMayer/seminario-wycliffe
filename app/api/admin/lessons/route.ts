import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkRector() {
  const session = await getServerSession(authOptions)
  return session && (session.user as any).role === 'RECTOR'
}

export async function GET(req: Request) {
  if (!await checkRector()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  try {
    const lessons = await prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(lessons)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  if (!await checkRector()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    // Get max order for this course
    const last = await prisma.lesson.findFirst({
      where: { courseId: body.courseId },
      orderBy: { order: 'desc' }
    })
    const lesson = await prisma.lesson.create({
      data: { ...body, order: (last?.order ?? 0) + 1 }
    })
    return NextResponse.json(lesson, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error creating lesson' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!await checkRector()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, ...data } = await req.json()
    const lesson = await prisma.lesson.update({ where: { id }, data })
    return NextResponse.json(lesson)
  } catch {
    return NextResponse.json({ error: 'Error updating lesson' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!await checkRector()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json()
    await prisma.lesson.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error deleting lesson' }, { status: 500 })
  }
}
