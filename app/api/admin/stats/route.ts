import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const [users, courses, enrollments, posts] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.forumPost.count(),
    ])
    return NextResponse.json({ users, courses, enrollments, posts })
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json({ users: 0, courses: 0, enrollments: 0, posts: 0 })
  }
}
