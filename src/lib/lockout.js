import { prisma } from "./prisma";

export const MAX_FAILS = 5;
export const LOCK_MINUTES = 15;

export function minutesLeft(user) {
  if (!user.lockedUntil || user.lockedUntil <= new Date()) return 0;
  return Math.ceil((user.lockedUntil - new Date()) / 60000);
}

// Galat password pe call karo. true return kare to account ab lock ho gaya
export async function registerFailure(userId) {
  const u = await prisma.user.update({
    where: { id: userId },
    data: { failedLogins: { increment: 1 } },
    select: { failedLogins: true },
  });
  if (u.failedLogins >= MAX_FAILS) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLogins: 0,
        lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
      },
    });
    return true;
  }
  return false;
}

export async function clearFailures(user) {
  if (user.failedLogins > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null },
    });
  }
}