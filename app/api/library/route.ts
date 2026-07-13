import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  try {
    const texts = await prisma.sacredText.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(texts)
  } catch {
    return NextResponse.json({ error: 'DB not ready' }, { status: 500 })
  }
}
