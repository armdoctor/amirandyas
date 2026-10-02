
-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isPrimaryContact" BOOLEAN NOT NULL DEFAULT true,
    "primaryGuestId" TEXT,
    "invitedToNikah" BOOLEAN NOT NULL DEFAULT false,
    "invitedToYasminFamily" BOOLEAN NOT NULL DEFAULT false,
    "invitedToYasminFriends" BOOLEAN NOT NULL DEFAULT false,
    "invitedToAmirFriends" BOOLEAN NOT NULL DEFAULT false,
    "invitedToAmirFamily" BOOLEAN NOT NULL DEFAULT false,
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
    "hasResponded" BOOLEAN NOT NULL DEFAULT false,
    "attendingNikah" BOOLEAN,
    "attendingYasminFamily" BOOLEAN,
    "attendingYasminFriends" BOOLEAN,
    "attendingAmirFriends" BOOLEAN,
    "attendingAmirFamily" BOOLEAN,
    "dietaryRestrictions" TEXT,
    "plusOneAttending" BOOLEAN,
    "plusOneName" TEXT,
    "plusOneDietary" TEXT,
    "message" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "guestId" TEXT,
    "guestName" TEXT,
    "before" JSONB,
    "after" JSONB,
    "refLogId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_fullName_key" ON "Guest"("fullName");

-- CreateIndex
CREATE INDEX "Guest_primaryGuestId_idx" ON "Guest"("primaryGuestId");

-- CreateIndex
CREATE INDEX "AuditLog_guestId_idx" ON "AuditLog"("guestId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_primaryGuestId_fkey" FOREIGN KEY ("primaryGuestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

