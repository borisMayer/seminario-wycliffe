-- ============================================
-- Seminario Wycliffe — Database Migration
-- Run this in Neon SQL Editor
-- ============================================

CREATE TYPE IF NOT EXISTS "Role" AS ENUM ('RECTOR', 'STUDENT', 'VISITOR');

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  image TEXT,
  role "Role" NOT NULL DEFAULT 'STUDENT',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Course" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  "imageUrl" TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  "order" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Lesson" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseId" TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "videoUrl" TEXT,
  "order" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Enrollment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "courseId")
);

CREATE TABLE IF NOT EXISTS "Progress" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "lessonId" TEXT NOT NULL REFERENCES "Lesson"(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "lessonId")
);

CREATE TABLE IF NOT EXISTS "SacredText" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'he',
  "fileUrl" TEXT,
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ForumPost" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "courseId" TEXT REFERENCES "Course"(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ForumComment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "postId" TEXT NOT NULL REFERENCES "ForumPost"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Seed data inicial
-- ============================================

-- Rector admin user (password: Rector2026!)
INSERT INTO "User" (id, name, email, password, role) VALUES
  ('rector-001', 'Rector', 'boris@wycliffe-chile.com', '$2b$10$placeholder', 'RECTOR')
ON CONFLICT (email) DO NOTHING;

-- Cursos iniciales
INSERT INTO "Course" (id, title, description, category, published, "order") VALUES
  ('course-001', 'Introducción al Antiguo Testamento', 'Panorama canónico, histórico y teológico de las Escrituras hebreas', 'Estudios Bíblicos', true, 1),
  ('course-002', 'Teología Sistemática I: Prolegómenos y Doctrina de Dios', 'Fundamentos de la teología reformada: revelación, Escritura y el Dios trino', 'Teología', true, 2),
  ('course-003', 'Griego Koiné I', 'Introducción a la morfología y sintaxis del griego del Nuevo Testamento', 'Idiomas Bíblicos', true, 3),
  ('course-004', 'Historia de la Reforma', 'De Wycliffe y Hus a Lutero, Calvino y los puritanos: la recuperación del Evangelio', 'Historia', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Lecciones para el primer curso
INSERT INTO "Lesson" (id, "courseId", title, content, "order") VALUES
  ('lesson-001', 'course-001', 'El Canon del Antiguo Testamento', 'Historia de la formación del canon hebreo: Ley, Profetas y Escritos. Criterios de canonicidad, testimonio de Qumrán y la Septuaginta, y la recepción del canon en la Iglesia...', 1),
  ('lesson-002', 'course-001', 'El Pentateuco: Composición y Teología', 'Análisis crítico y teológico de la Torá: estructura literaria, hipótesis documentaria y su evaluación desde la erudición evangélica, y la teología del pacto...', 2),
  ('lesson-003', 'course-001', 'Los Profetas: Historia y Mensaje', 'Profetismo en Israel: contexto histórico de los profetas anteriores y posteriores, géneros proféticos y su cumplimiento cristológico...', 3)
ON CONFLICT (id) DO NOTHING;

-- Textos sagrados
INSERT INTO "SacredText" (id, title, author, category, language, description) VALUES
  ('text-001', 'Institución de la Religión Cristiana', 'Juan Calvino', 'Teología Reformada', 'ES', 'La obra cumbre de la teología reformada, publicada en su forma final en 1559'),
  ('text-002', 'Sobre la Verdad de la Sagrada Escritura', 'Juan Wycliffe', 'Teología Reformada', 'LA/ES', 'De Veritate Sacrae Scripturae — la defensa de la autoridad suprema de la Escritura por el Reformador de Oxford'),
  ('text-003', 'Teología Sistemática', 'Louis Berkhof', 'Teología Sistemática', 'ES', 'Manual clásico de dogmática reformada, referencia de seminarios en todo el mundo'),
  ('text-004', 'Comentario al Nuevo Testamento Griego', 'B. F. Westcott y F. J. A. Hort', 'Nuevo Testamento', 'GR/ES', 'Alta crítica textual del Nuevo Testamento en la tradición académica de Cambridge y Oxford'),
  ('text-005', 'Confesiones', 'Agustín de Hipona', 'Historia y Patrística', 'ES', 'La autobiografía espiritual fundacional de la teología occidental'),
  ('text-006', 'La Confesión de Westminster', 'Asamblea de Westminster', 'Teología Reformada', 'ES', 'Confesión de fe reformada del siglo XVII')
ON CONFLICT (id) DO NOTHING;

-- Post inicial del foro
INSERT INTO "ForumPost" (id, "userId", title, content) VALUES
  ('post-001', 'rector-001', 'Bienvenidos al Seminario Wycliffe', 'Bienvenidos al Seminario Wycliffe de Teología. En la tradición de Juan Wycliffe de Oxford, aquí cultivamos el rigor académico, la fidelidad bíblica y la teología reformada al servicio de la Iglesia global. Veritas, Fides, Sapientia.')
ON CONFLICT (id) DO NOTHING;

SELECT 'Migration completed successfully ✓' as status;
