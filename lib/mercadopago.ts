import { MercadoPagoConfig, Preference } from 'mercadopago'

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
})

export const createPreference = async ({
  title,
  price,
  courseId,
  userId,
  userEmail,
  type,
}: {
  title: string
  price: number
  courseId?: string
  userId: string
  userEmail: string
  type: 'COURSE' | 'SUBSCRIPTION'
}) => {
  const preference = new Preference(mp)
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://seminario-wycliffe.vercel.app'

  const result = await preference.create({
    body: {
      items: [{
        id: courseId ?? 'subscription',
        title,
        quantity: 1,
        unit_price: price,
        currency_id: 'USD',
      }],
      payer: { email: userEmail },
      back_urls: {
        success: `${baseUrl}/pagos/exito?type=${type}&courseId=${courseId ?? ''}`,
        failure: `${baseUrl}/pagos/error`,
        pending: `${baseUrl}/pagos/pendiente`,
      },
      auto_return: 'approved',
      metadata: { userId, courseId, type },
      notification_url: `${baseUrl}/api/pagos/webhook`,
      statement_descriptor: 'SEMINARIO WYCLIFFE',
    }
  })
  return result
}
