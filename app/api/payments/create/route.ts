import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    console.error('MP_ACCESS_TOKEN not set')
    return NextResponse.json({ error: 'Pasarela de pago no configurada. Contacta al administrador.' }, { status: 500 })
  }

  try {
    const { type, courseId } = await req.json()
    const userId = (session.user as any).id
    const baseUrl = process.env.NEXTAUTH_URL ?? 'https://wycliffe-chile.com'

    let items: any[] = []
    let amount = 0

    if (type === 'course' && courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
      if (course.isFree) return NextResponse.json({ error: 'Este curso es gratuito, ve a matricularte directamente' }, { status: 400 })
      const existing = await prisma.payment.findFirst({ where: { userId, courseId, status: 'approved' } })
      if (existing) return NextResponse.json({ error: 'Ya tienes acceso a este curso' }, { status: 409 })
      amount = course.price
      items = [{ id: course.id, title: course.title, quantity: 1, unit_price: course.price, currency_id: 'USD' }]
    } else if (type === 'subscription') {
      amount = 19.99
      items = [{ id: 'sub-monthly', title: 'Seminario Wycliffe — Suscripción Mensual', quantity: 1, unit_price: 19.99, currency_id: 'USD' }]
    } else {
      return NextResponse.json({ error: 'Tipo de pago inválido' }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: { userId, courseId: courseId ?? null, type, amount, currency: 'USD', status: 'pending' }
    })

    const client = new MercadoPagoConfig({ accessToken })
    const preference = new Preference(client)
    const response = await preference.create({
      body: {
        items,
        payer: { email: session.user?.email ?? '' },
        back_urls: {
          success: `${baseUrl}/pagos/success?paymentId=${payment.id}&type=${type}${courseId ? `&courseId=${courseId}` : ''}`,
          failure: `${baseUrl}/pagos/failure?paymentId=${payment.id}`,
          pending: `${baseUrl}/pagos/pending?paymentId=${payment.id}`,
        },
        auto_return: 'approved',
        external_reference: payment.id,
      }
    })

    return NextResponse.json({ checkoutUrl: response.init_point, paymentId: payment.id })
  } catch (err: any) {
    console.error('MP Error:', err?.message ?? err)
    return NextResponse.json({ error: `Error al crear pago: ${err?.message ?? 'desconocido'}` }, { status: 500 })
  }
}
