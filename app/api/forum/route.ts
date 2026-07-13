import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const posts = await prisma.forumPost.findMany({
      include: {
        user: { select: { id: true, name: true, role: true, image: true } },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return NextResponse.json(posts)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { title, content, courseId } = await req.json()
    if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: 'Título y contenido requeridos' }, { status: 400 })
    const post = await prisma.forumPost.create({
      data: { title, content, userId: (session.user as any).id, courseId: courseId ?? null },
      include: {
        user: { select: { id: true, name: true, role: true, image: true } },
        _count: { select: { comments: true } }
      }
    })
    return NextResponse.json(post, { status: 201 })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
