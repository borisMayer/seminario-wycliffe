-- ============================================================
-- SEMINARIO WYCLIFFE — Limpieza y verificación en Neon
-- Ejecutar en: console.neon.tech → tu proyecto → SQL Editor
-- Ejecuta los bloques UNO POR UNO, en orden. Es seguro y reversible
-- hasta el bloque 3 (el 3 borra de verdad).
-- ============================================================


-- ------------------------------------------------------------
-- BLOQUE 1 · ¿Existen las tablas de materiales?
-- Deben aparecer las dos filas. Si falta alguna, ejecuta primero
-- el archivo neon-resources-migration.sql del repositorio.
-- ------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('LessonResource', 'ResourceCompletion')
ORDER BY table_name;


-- ------------------------------------------------------------
-- BLOQUE 2 · Ver qué materiales hay hoy y de dónde salieron
-- La columna "origen" te dice si el archivo vive en Cloudinary
-- o si es un registro sembrado con una URL inventada.
-- ------------------------------------------------------------
SELECT
  r.id,
  r.title                                  AS material,
  r.type                                   AS formato,
  l.title                                  AS leccion,
  c.title                                  AS curso,
  CASE
    WHEN r.url LIKE '%res.cloudinary.com%' THEN 'Cloudinary (archivo real)'
    WHEN r.url LIKE '%youtube%' OR r.url LIKE '%youtu.be%'
      OR r.url LIKE '%vimeo%'              THEN 'Enlace externo de video'
    ELSE                                        'DEMOSTRACION (url ficticia)'
  END                                      AS origen,
  r.url,
  r."createdAt"
FROM "LessonResource" r
JOIN "Lesson" l ON l.id = r."lessonId"
JOIN "Course" c ON c.id = l."courseId"
ORDER BY c.title, l."order", r."order";


-- ------------------------------------------------------------
-- BLOQUE 3 · BORRAR los materiales de demostración
-- Elimina todo material cuyo título empiece por "PRUEBA".
-- Las marcas de "revisado" de los alumnos caen solas por
-- ON DELETE CASCADE, no hace falta borrarlas aparte.
--
-- Revisa antes el resultado del BLOQUE 2: solo debe borrar
-- los tres registros PRUEBA. Devuelve lo que eliminó.
-- ------------------------------------------------------------
DELETE FROM "LessonResource"
WHERE title ILIKE 'PRUEBA%'
   OR description ILIKE '%material de prueba%'
   OR description ILIKE '%segundo material de prueba%'
RETURNING id, title;


-- ------------------------------------------------------------
-- BLOQUE 4 · Confirmar que tu usuario tiene rol RECTOR
-- Sin este rol, la subida de materiales devuelve 401 y no
-- llega nunca a Cloudinary. Cambia el correo por el tuyo.
-- ------------------------------------------------------------
SELECT id, name, email, role
FROM "User"
ORDER BY "createdAt";

-- Si tu cuenta NO aparece como RECTOR, ejecuta esta línea
-- (sustituye el correo por el tuyo):
-- UPDATE "User" SET role = 'RECTOR' WHERE email = 'tu-correo@ejemplo.com' RETURNING email, role;


-- ------------------------------------------------------------
-- BLOQUE 5 · Verificación final
-- Debe quedar 0 materiales de demostración.
-- ------------------------------------------------------------
SELECT
  COUNT(*) FILTER (WHERE title ILIKE 'PRUEBA%')                  AS demostracion_restante,
  COUNT(*) FILTER (WHERE url LIKE '%res.cloudinary.com%')        AS archivos_en_cloudinary,
  COUNT(*)                                                       AS total_materiales
FROM "LessonResource";
