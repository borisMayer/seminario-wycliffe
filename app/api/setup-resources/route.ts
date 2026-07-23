import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STATEMENTS: string[] = ["CREATE TABLE IF NOT EXISTS \"LessonResource\" (\n  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,\n  \"lessonId\"     TEXT NOT NULL REFERENCES \"Lesson\"(id) ON DELETE CASCADE,\n  title          TEXT NOT NULL,\n  type           TEXT NOT NULL DEFAULT 'pdf',\n  url            TEXT NOT NULL,\n  description    TEXT,\n  \"fileSize\"     INTEGER,\n  duration       INTEGER,\n  downloadable   BOOLEAN NOT NULL DEFAULT true,\n  \"isPremium\"    BOOLEAN NOT NULL DEFAULT false,\n  \"order\"        INTEGER NOT NULL DEFAULT 0,\n  \"createdAt\"    TIMESTAMP NOT NULL DEFAULT NOW()\n)", "CREATE INDEX IF NOT EXISTS \"LessonResource_lessonId_idx\" ON \"LessonResource\"(\"lessonId\")", "CREATE TABLE IF NOT EXISTS \"ResourceCompletion\" (\n  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,\n  \"userId\"      TEXT NOT NULL REFERENCES \"User\"(id) ON DELETE CASCADE,\n  \"resourceId\"  TEXT NOT NULL REFERENCES \"LessonResource\"(id) ON DELETE CASCADE,\n  \"completedAt\" TIMESTAMP NOT NULL DEFAULT NOW(),\n  UNIQUE(\"userId\", \"resourceId\")\n)", "CREATE INDEX IF NOT EXISTS \"ResourceCompletion_userId_idx\" ON \"ResourceCompletion\"(\"userId\")"]

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('key') !== "1a6c861b7d65ac4905c74b25b6a9462f038bab638db4feb6") {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const failed: { i: number; error: string }[] = []
  for (let i = 0; i < STATEMENTS.length; i++) {
    try {
      await prisma.$executeRawUnsafe(STATEMENTS[i])
    } catch (e: unknown) {
      failed.push({ i, error: String(e).slice(0, 250) })
    }
  }
  const cols = await prisma.$queryRawUnsafe<{ table_name: string; column_name: string }[]>(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('LessonResource','ResourceCompletion') ORDER BY table_name, ordinal_position"
  )
  return NextResponse.json({ executed: STATEMENTS.length, failed, columns: cols })
}
