import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.type !== 'payment') return NextResponse.json({ ok: true })

    const mp = new Payment(client)
    const paymentData = await mp.get({ id: body.data.id })

    const externalRef = paymentData.external_reference
    const status = paymentData.status ?? 'pending'
    if (!externalRef) return NextResponse.json({ ok: true })

    await prisma.payment.updateMany({
      where: { id: externalRef },
      data: { status, mpPaymentId: String(body.data.id) }
    })

    // If approved course payment — auto-enroll
    if (status === 'approved') {
      const payment = await prisma.payment.findUnique({ where: { id: externalRef } })
      if (payment?.type === 'course' && payment.courseId) {
        await prisma.enrollment.upsert({
          where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
          update: {},
          create: { userId: payment.userId, courseId: payment.courseId }
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
