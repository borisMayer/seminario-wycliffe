-- ============================================================
-- SEMINARIO WYCLIFFE — Recursos multiformato por lección
-- Ejecutar en el SQL Editor de Neon. Idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS "LessonResource" (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "lessonId"     TEXT NOT NULL REFERENCES "Lesson"(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'pdf',
  url            TEXT NOT NULL,
  description    TEXT,
  "fileSize"     INTEGER,
  duration       INTEGER,
  downloadable   BOOLEAN NOT NULL DEFAULT true,
  "isPremium"    BOOLEAN NOT NULL DEFAULT false,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LessonResource_lessonId_idx" ON "LessonResource"("lessonId");

CREATE TABLE IF NOT EXISTS "ResourceCompletion" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "resourceId"  TEXT NOT NULL REFERENCES "LessonResource"(id) ON DELETE CASCADE,
  "completedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "resourceId")
);

CREATE INDEX IF NOT EXISTS "ResourceCompletion_userId_idx" ON "ResourceCompletion"("userId");

-- Verificación
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('LessonResource', 'ResourceCompletion');
