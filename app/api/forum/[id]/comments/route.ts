import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })
    const comment = await prisma.forumComment.create({
      data: { postId: id, userId: (session.user as any).id, content },
      include: { user: { select: { id: true, name: true, role: true, image: true } } }
    })
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('[API ERROR]', error) return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { commentId } = await req.json()
    const comment = await prisma.forumComment.findUnique({ where: { id: commentId } })
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const isOwner = comment.userId === (session.user as any).id
    const isRector = (session.user as any).role === 'RECTOR'
    if (!isOwner && !isRector) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.forumComment.delete({ where: { id: commentId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API ERROR]', error) return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
