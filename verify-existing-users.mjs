/**
 * One-off migration script — run once after enabling requireEmailVerification
 * in lib/auth.ts, to avoid locking out accounts that were created before
 * email verification existed.
 *
 * Usage:
 *   node verify-existing-users.mjs
 *
 * This marks EVERY existing user as emailVerified = true. That's
 * appropriate for a one-time cutover (these accounts predate the feature
 * and were never asked to verify), but don't leave this script around or
 * re-run it casually — new signups going forward should go through the
 * real verification flow, not this script.
 *
 * Delete this file once you've run it.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = await prisma.user.updateMany({
  where: { emailVerified: false },
  data: { emailVerified: true },
});

console.log(`Marked ${result.count} existing user(s) as verified.`);

await prisma.$disconnect();
