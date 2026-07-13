import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { feedback } = await req.json()
    const sub = await prisma.submission.update({
      where: { id },
      data: { feedback, feedbackAt: new Date() },
      include: { user: { select: { id: true, name: true, email: true } }, assignment: { select: { title: true, type: true, weight: true } } }
    })
    return NextResponse.json(sub)
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
