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
    const payments = await prisma.payment.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    const total = payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + p.amount, 0)
    return NextResponse.json({ payments, total })
  } catch {
    return NextResponse.json({ payments: [], total: 0 })
  }
}
