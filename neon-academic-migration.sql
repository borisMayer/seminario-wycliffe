CREATE TABLE IF NOT EXISTS "Assignment" (
  "id"          TEXT NOT NULL,
  "courseId"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "type"        TEXT NOT NULL,
  "weight"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dueDate"     TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Submission" (
  "id"           TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "fileUrl"      TEXT,
  "content"      TEXT,
  "submittedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "feedback"     TEXT,
  "feedbackAt"   TIMESTAMP(3),
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Submission_assignmentId_userId_key" UNIQUE ("assignmentId", "userId"),
  CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE,
  CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Grade" (
  "id"           TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "score"        DOUBLE PRECISION NOT NULL,
  "comment"      TEXT,
  "gradedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gradedBy"     TEXT NOT NULL,
  CONSTRAINT "Grade_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Grade_assignmentId_userId_key" UNIQUE ("assignmentId", "userId"),
  CONSTRAINT "Grade_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE,
  CONSTRAINT "Grade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "LiveSession" (
  "id"           TEXT NOT NULL,
  "courseId"     TEXT,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "meetingUrl"   TEXT NOT NULL,
  "platform"     TEXT NOT NULL DEFAULT 'zoom',
  "scheduledAt"  TIMESTAMP(3) NOT NULL,
  "duration"     INTEGER NOT NULL DEFAULT 60,
  "recordingUrl" TEXT,
  "materials"    TEXT,
  "isGlobal"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiveSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL
);
