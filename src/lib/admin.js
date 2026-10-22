import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSession } from "./auth";

// Database se check, taaki block hua admin turant ruk jaye
export async function getAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "ADMIN" || user.isBlocked || !user.isVerified) {
    return null;
  }
  return user;
}

// API routes mein use hota hai:
//   const g = await requireAdmin();
//   if (g.error) return g.error;
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) {
    return {
      error: NextResponse.json({ error: "Administrator login is required" }, { status: 401 }),
    };
  }
  return { admin };
}
