import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/resource-progress → ids de todos los recursos completados por el alumno
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json([])
  try {
    const completions = await prisma.resourceCompletion.findMany({
      where: { userId: (session.user as any).id },
      select: { resourceId: true }
    })
    return NextResponse.json(completions.map((c: { resourceId: string }) => c.resourceId))
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json([])
  }
}

// POST /api/resource-progress { resourceId, completed }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { resourceId, completed } = await req.json()
    const userId = (session.user as any).id

    if (completed) {
      await prisma.resourceCompletion.upsert({
        where: { userId_resourceId: { userId, resourceId } },
        update: {},
        create: { userId, resourceId }
      })
    } else {
      await prisma.resourceCompletion.deleteMany({ where: { userId, resourceId } })
    }
    return NextResponse.json({ resourceId, completed })
  } catch (error) {
    console.error('[API ERROR]', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
