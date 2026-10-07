CREATE TABLE "Student" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "phone" TEXT, "guardianName" TEXT, "guardianPhone" TEXT);
CREATE TABLE "Workshop" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "date" TEXT NOT NULL, "teacher" TEXT NOT NULL, "materials" TEXT NOT NULL);
CREATE TABLE "Artwork" ("id" TEXT PRIMARY KEY, "studentId" TEXT NOT NULL REFERENCES "Student"("id"), "title" TEXT NOT NULL, "medium" TEXT NOT NULL, "date" TEXT NOT NULL, "imageUrl" TEXT, "feedback" TEXT, "status" TEXT NOT NULL);
CREATE TABLE "Exhibition" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "date" TEXT NOT NULL, "venue" TEXT NOT NULL, "memo" TEXT);
CREATE TABLE "Notice" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "date" TEXT NOT NULL, "content" TEXT NOT NULL);
