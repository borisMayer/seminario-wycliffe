import { NextResponse } from 'next/server'

// Ruta temporal: informa si las variables existen, nunca su valor.
export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('key') !== '8d98734f07c7675654b0bddaab37cbd706ef10fc') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const names = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_URL']
  const report: Record<string, string> = {}
  for (const n of names) {
    const v = process.env[n]
    report[n] = v ? `presente (${v.length} caracteres)` : 'AUSENTE'
  }
  return NextResponse.json(report)
}
