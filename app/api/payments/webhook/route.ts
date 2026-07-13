import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.type !== 'payment') return NextResponse.json({ ok: true })

    const mpPayment = new Payment(client)
    const paymentData = await mpPayment.get({ id: body.data.id })

    const externalRef = paymentData.external_reference
    const status = paymentData.status // approved | rejected | pending
    if (!externalRef) return NextResponse.json({ ok: true })

    const payment = await prisma.payment.findUnique({ where: { id: externalRef } })
    if (!payment) return NextResponse.json({ ok: true })

    await prisma.payment.update({
      where: { id: externalRef },
      data: { status: status ?? 'pending', mpPaymentId: String(body.data.id) }
    })

    // If approved course payment — create enrollment automatically
    if (status === 'approved' && payment.type === 'course' && payment.courseId) {
      await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
        update: {},
        create: { userId: payment.userId, courseId: payment.courseId }
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
