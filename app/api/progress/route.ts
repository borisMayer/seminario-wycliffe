import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([])
  try {
    const progress = await prisma.progress.findMany({
      where: { userId: (session.user as any).id }
    })
    return NextResponse.json(progress)
  } catch { return NextResponse.json([]) }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { lessonId, completed } = await req.json()
    const progress = await prisma.progress.upsert({
      where: { userId_lessonId: { userId: (session.user as any).id, lessonId } },
      update: { completed },
      create: { userId: (session.user as any).id, lessonId, completed }
    })
    return NextResponse.json(progress)
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
