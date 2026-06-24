-- AlterTable: Add tokenVersion to users table
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
