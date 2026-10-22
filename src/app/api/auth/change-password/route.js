import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { minutesLeft, registerFailure, clearFailures } from "@/lib/lockout";

const schema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(100)
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
});

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.isBlocked) {
    return NextResponse.json({ error: "Please log in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const left = minutesLeft(user);
  if (left > 0) {
    return NextResponse.json({ error: `Too many failed attempts. Try again in ${left} minutes` }, { status: 429 });
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    await registerFailure(user.id);
    return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
  }
  await clearFailures(user);

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "New password must be different from the current password" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return NextResponse.json({ ok: true });
}