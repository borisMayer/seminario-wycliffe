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
    const data = await req.json()
    const text = await prisma.sacredText.update({ where: { id }, data })
    return NextResponse.json(text)
  } catch (error) {
    console.error('[API ERROR]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await prisma.sacredText.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API ERROR]', error); return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
