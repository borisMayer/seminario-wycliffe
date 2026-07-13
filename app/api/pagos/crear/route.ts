import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPreference } from '@/lib/mercadopago'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, type } = await req.json()
  const userId = (session.user as any).id
  const userEmail = session.user?.email ?? ''

  try {
    let title = '', price = 0

    if (type === 'COURSE' && courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
      title = course.title
      price = course.price ?? 49
    } else if (type === 'SUBSCRIPTION') {
      title = 'Suscripción Mensual — Seminario Wycliffe'
      price = 29
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: { userId, courseId: courseId ?? null, type, amount: price, status: 'PENDING' }
    })

    // Create MP preference
    const preference = await createPreference({ title, price, courseId, userId, userEmail, type })

    // Save preference ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: preference.id }
    })

    return NextResponse.json({ preferenceId: preference.id, initPoint: preference.init_point })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error creando pago' }, { status: 500 })
  }
}
