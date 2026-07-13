import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, role: true, image: true } },
        comments: {
          include: { user: { select: { id: true, name: true, role: true, image: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const post = await prisma.forumPost.findUnique({ where: { id } })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const isOwner = post.userId === (session.user as any).id
    const isRector = (session.user as any).role === 'RECTOR'
    if (!isOwner && !isRector) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.forumPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
