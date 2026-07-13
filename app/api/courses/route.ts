import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        _count: { select: { lessons: true, enrollments: true } }
      },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(courses)
  } catch {
    return NextResponse.json({ error: 'DB not ready' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const course = await prisma.course.create({ data: body })
    return NextResponse.json(course, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error creating course' }, { status: 500 })
  }
}
