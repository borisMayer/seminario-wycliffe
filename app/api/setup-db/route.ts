import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STATEMENTS: string[] = ["DO $$ BEGIN
  CREATE TYPE \"Role\" AS ENUM ('RECTOR', 'STUDENT', 'VISITOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;", "CREATE TABLE IF NOT EXISTS \"User\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  image TEXT,
  role \"Role\" NOT NULL DEFAULT 'STUDENT',
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
  \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);", "CREATE TABLE IF NOT EXISTS \"Course\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  \"imageUrl\" TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  \"order\" INT NOT NULL DEFAULT 0,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
  \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);", "CREATE TABLE IF NOT EXISTS \"Lesson\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  \"courseId\" TEXT NOT NULL REFERENCES \"Course\"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  \"videoUrl\" TEXT,
  \"order\" INT NOT NULL DEFAULT 0,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);", "CREATE TABLE IF NOT EXISTS \"Enrollment\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  \"userId\" TEXT NOT NULL REFERENCES \"User\"(id) ON DELETE CASCADE,
  \"courseId\" TEXT NOT NULL REFERENCES \"Course\"(id) ON DELETE CASCADE,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(\"userId\", \"courseId\")
);", "CREATE TABLE IF NOT EXISTS \"Progress\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  \"userId\" TEXT NOT NULL REFERENCES \"User\"(id) ON DELETE CASCADE,
  \"lessonId\" TEXT NOT NULL REFERENCES \"Lesson\"(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(\"userId\", \"lessonId\")
);", "CREATE TABLE IF NOT EXISTS \"SacredText\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'he',
  \"fileUrl\" TEXT,
  description TEXT,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);", "CREATE TABLE IF NOT EXISTS \"ForumPost\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  \"userId\" TEXT NOT NULL REFERENCES \"User\"(id) ON DELETE CASCADE,
  \"courseId\" TEXT REFERENCES \"Course\"(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
  \"updatedAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);", "CREATE TABLE IF NOT EXISTS \"ForumComment\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  \"postId\" TEXT NOT NULL REFERENCES \"ForumPost\"(id) ON DELETE CASCADE,
  \"userId\" TEXT NOT NULL REFERENCES \"User\"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);", "INSERT INTO \"User\" (id, name, email, password, role) VALUES
  ('rector-001', 'Rector', 'boris@wycliffe-chile.com', '$2b$10$placeholder', 'RECTOR')
ON CONFLICT (email) DO NOTHING;", "INSERT INTO \"Course\" (id, title, description, category, published, \"order\") VALUES
  ('course-001', 'Introducción al Antiguo Testamento', 'Panorama canónico, histórico y teológico de las Escrituras hebreas', 'Estudios Bíblicos', true, 1),
  ('course-002', 'Teología Sistemática I: Prolegómenos y Doctrina de Dios', 'Fundamentos de la teología reformada: revelación, Escritura y el Dios trino', 'Teología', true, 2),
  ('course-003', 'Griego Koiné I', 'Introducción a la morfología y sintaxis del griego del Nuevo Testamento', 'Idiomas Bíblicos', true, 3),
  ('course-004', 'Historia de la Reforma', 'De Wycliffe y Hus a Lutero, Calvino y los puritanos: la recuperación del Evangelio', 'Historia', true, 4)
ON CONFLICT (id) DO NOTHING;", "INSERT INTO \"Lesson\" (id, \"courseId\", title, content, \"order\") VALUES
  ('lesson-001', 'course-001', 'El Canon del Antiguo Testamento', 'Historia de la formación del canon hebreo: Ley, Profetas y Escritos. Criterios de canonicidad, testimonio de Qumrán y la Septuaginta, y la recepción del canon en la Iglesia...', 1),
  ('lesson-002', 'course-001', 'El Pentateuco: Composición y Teología', 'Análisis crítico y teológico de la Torá: estructura literaria, hipótesis documentaria y su evaluación desde la erudición evangélica, y la teología del pacto...', 2),
  ('lesson-003', 'course-001', 'Los Profetas: Historia y Mensaje', 'Profetismo en Israel: contexto histórico de los profetas anteriores y posteriores, géneros proféticos y su cumplimiento cristológico...', 3)
ON CONFLICT (id) DO NOTHING;", "INSERT INTO \"SacredText\" (id, title, author, category, language, description) VALUES
  ('text-001', 'Institución de la Religión Cristiana', 'Juan Calvino', 'Teología Reformada', 'ES', 'La obra cumbre de la teología reformada, publicada en su forma final en 1559'),
  ('text-002', 'Sobre la Verdad de la Sagrada Escritura', 'Juan Wycliffe', 'Teología Reformada', 'LA/ES', 'De Veritate Sacrae Scripturae — la defensa de la autoridad suprema de la Escritura por el Reformador de Oxford'),
  ('text-003', 'Teología Sistemática', 'Louis Berkhof', 'Teología Sistemática', 'ES', 'Manual clásico de dogmática reformada, referencia de seminarios en todo el mundo'),
  ('text-004', 'Comentario al Nuevo Testamento Griego', 'B. F. Westcott y F. J. A. Hort', 'Nuevo Testamento', 'GR/ES', 'Alta crítica textual del Nuevo Testamento en la tradición académica de Cambridge y Oxford'),
  ('text-005', 'Confesiones', 'Agustín de Hipona', 'Historia y Patrística', 'ES', 'La autobiografía espiritual fundacional de la teología occidental'),
  ('text-006', 'La Confesión de Westminster', 'Asamblea de Westminster', 'Teología Reformada', 'ES', 'Confesión de fe reformada del siglo XVII')
ON CONFLICT (id) DO NOTHING;", "INSERT INTO \"ForumPost\" (id, \"userId\", title, content) VALUES
  ('post-001', 'rector-001', 'Bienvenidos al Seminario Wycliffe', 'Bienvenidos al Seminario Wycliffe de Teología. En la tradición de Juan Wycliffe de Oxford, aquí cultivamos el rigor académico, la fidelidad bíblica y la teología reformada al servicio de la Iglesia global. Veritas, Fides, Sapientia.')
ON CONFLICT (id) DO NOTHING;", "CREATE TABLE IF NOT EXISTS \"Assignment\" (
  \"id\"          TEXT NOT NULL,
  \"courseId\"    TEXT NOT NULL,
  \"title\"       TEXT NOT NULL,
  \"description\" TEXT,
  \"type\"        TEXT NOT NULL,
  \"weight\"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  \"dueDate\"     TIMESTAMP(3),
  \"createdAt\"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \"Assignment_pkey\" PRIMARY KEY (\"id\"),
  CONSTRAINT \"Assignment_courseId_fkey\" FOREIGN KEY (\"courseId\") REFERENCES \"Course\"(\"id\") ON DELETE CASCADE
);", "CREATE TABLE IF NOT EXISTS \"Submission\" (
  \"id\"           TEXT NOT NULL,
  \"assignmentId\" TEXT NOT NULL,
  \"userId\"       TEXT NOT NULL,
  \"fileUrl\"      TEXT,
  \"content\"      TEXT,
  \"submittedAt\"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \"feedback\"     TEXT,
  \"feedbackAt\"   TIMESTAMP(3),
  CONSTRAINT \"Submission_pkey\" PRIMARY KEY (\"id\"),
  CONSTRAINT \"Submission_assignmentId_userId_key\" UNIQUE (\"assignmentId\", \"userId\"),
  CONSTRAINT \"Submission_assignmentId_fkey\" FOREIGN KEY (\"assignmentId\") REFERENCES \"Assignment\"(\"id\") ON DELETE CASCADE,
  CONSTRAINT \"Submission_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE CASCADE
);", "CREATE TABLE IF NOT EXISTS \"Grade\" (
  \"id\"           TEXT NOT NULL,
  \"assignmentId\" TEXT NOT NULL,
  \"userId\"       TEXT NOT NULL,
  \"score\"        DOUBLE PRECISION NOT NULL,
  \"comment\"      TEXT,
  \"gradedAt\"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \"gradedBy\"     TEXT NOT NULL,
  CONSTRAINT \"Grade_pkey\" PRIMARY KEY (\"id\"),
  CONSTRAINT \"Grade_assignmentId_userId_key\" UNIQUE (\"assignmentId\", \"userId\"),
  CONSTRAINT \"Grade_assignmentId_fkey\" FOREIGN KEY (\"assignmentId\") REFERENCES \"Assignment\"(\"id\") ON DELETE CASCADE,
  CONSTRAINT \"Grade_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE CASCADE
);", "CREATE TABLE IF NOT EXISTS \"LiveSession\" (
  \"id\"           TEXT NOT NULL,
  \"courseId\"     TEXT,
  \"title\"        TEXT NOT NULL,
  \"description\"  TEXT,
  \"meetingUrl\"   TEXT NOT NULL,
  \"platform\"     TEXT NOT NULL DEFAULT 'zoom',
  \"scheduledAt\"  TIMESTAMP(3) NOT NULL,
  \"duration\"     INTEGER NOT NULL DEFAULT 60,
  \"recordingUrl\" TEXT,
  \"materials\"    TEXT,
  \"isGlobal\"     BOOLEAN NOT NULL DEFAULT false,
  \"createdAt\"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \"LiveSession_pkey\" PRIMARY KEY (\"id\"),
  CONSTRAINT \"LiveSession_courseId_fkey\" FOREIGN KEY (\"courseId\") REFERENCES \"Course\"(\"id\") ON DELETE SET NULL
);", "ALTER TABLE \"Course\" ADD COLUMN IF NOT EXISTS \"price\" DOUBLE PRECISION NOT NULL DEFAULT 0;", "ALTER TABLE \"Course\" ADD COLUMN IF NOT EXISTS \"isFree\" BOOLEAN NOT NULL DEFAULT true;", "CREATE TABLE IF NOT EXISTS \"Payment\" (
  \"id\"          TEXT NOT NULL,
  \"userId\"      TEXT NOT NULL,
  \"courseId\"    TEXT,
  \"type\"        TEXT NOT NULL,
  \"amount\"      DOUBLE PRECISION NOT NULL,
  \"currency\"    TEXT NOT NULL DEFAULT 'USD',
  \"status\"      TEXT NOT NULL,
  \"mpPaymentId\" TEXT,
  \"createdAt\"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \"updatedAt\"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \"Payment_pkey\" PRIMARY KEY (\"id\"),
  CONSTRAINT \"Payment_userId_fkey\" FOREIGN KEY (\"userId\") REFERENCES \"User\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE
);", "CREATE INDEX IF NOT EXISTS \"Payment_userId_idx\" ON \"Payment\"(\"userId\");", "CREATE INDEX IF NOT EXISTS \"Payment_status_idx\" ON \"Payment\"(\"status\");", "CREATE TABLE IF NOT EXISTS \"Subscription\" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  \"userId\" TEXT NOT NULL UNIQUE REFERENCES \"User\"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'monthly',
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  \"startsAt\" TIMESTAMP NOT NULL DEFAULT NOW(),
  \"expiresAt\" TIMESTAMP NOT NULL,
  \"createdAt\" TIMESTAMP NOT NULL DEFAULT NOW()
);", "ALTER TABLE \"Payment\" ADD COLUMN IF NOT EXISTS \"mpPreferenceId\" TEXT;", "ALTER TABLE \"SacredText\" ADD COLUMN IF NOT EXISTS \"isPremium\" BOOLEAN NOT NULL DEFAULT false;"]

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('key') !== "bfde8b6f0c7365c0d602710518f41eb6d0e87df0743b03fb") {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const results: { i: number; ok: boolean; error?: string }[] = []
  for (let i = 0; i < STATEMENTS.length; i++) {
    try {
      await prisma.$executeRawUnsafe(STATEMENTS[i])
      results.push({ i, ok: true })
    } catch (e: unknown) {
      results.push({ i, ok: false, error: String(e).slice(0, 300) })
    }
  }
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  )
  return NextResponse.json({ executed: results.length, failed: results.filter(r => !r.ok), tables: tables.map(t => t.table_name) })
}
