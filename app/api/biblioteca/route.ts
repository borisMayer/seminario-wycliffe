import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Check if user has premium access (paid subscription or rector)
async function hasPremiumAccess(userId: string, role: string): Promise<boolean> {
  if (role === 'RECTOR') return true
  const payment = await prisma.payment.findFirst({
    where: { userId, type: 'subscription', status: 'approved' }
  })
  return !!payment
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id
    const role = (session?.user as any)?.role ?? 'STUDENT'

    let premium = false
    if (userId) premium = await hasPremiumAccess(userId, role)

    // Everyone sees basic texts (isPremium=false)
    // Premium users also see premium texts
    const texts = await prisma.sacredText.findMany({
      where: premium ? {} : { isPremium: false },
      orderBy: { createdAt: 'desc' }
    })

    // Always return all texts to rector/premium, mark isPremium for UI
    return NextResponse.json({ texts, isPremium: premium })
  } catch (error) {
    console.error('[API ERROR]', error); return NextResponse.json({ texts: [], isPremium: false }) }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { title, author, category, language, description, fileUrl, isPremium } = await req.json()
    if (!title?.trim() || !category?.trim())
      return NextResponse.json({ error: 'Título y categoría requeridos' }, { status: 400 })
    const text = await prisma.sacredText.create({
      data: {
        title, author: author ?? null, category,
        language: language ?? 'ES',
        description: description ?? null,
        fileUrl: fileUrl ?? null,
        isPremium: isPremium ?? false
      }
    })
    return NextResponse.json(text, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, ...data } = await req.json()
    const text = await prisma.sacredText.update({ where: { id }, data })
    return NextResponse.json(text)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'RECTOR')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json()
    await prisma.sacredText.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
