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
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { enrollments: true, posts: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json([])
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, role } = await req.json()
    const user = await prisma.user.update({ where: { id }, data: { role } })
    return NextResponse.json(user)
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 })
  }
}
