import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { setSession } from "@/lib/auth";
import { PHONE_REGEX, homePathFor } from "@/lib/constants";

const schema = z.object({
  phone: z.string().regex(PHONE_REGEX),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  purpose: z.enum(["SIGNUP", "LOGIN"]),
});

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { phone, otp, purpose } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || user.isBlocked) {
    return NextResponse.json({ error: "Account not found or blocked" }, { status: 403 });
  }

  const result = await verifyOtp(phone, purpose, otp);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (purpose === "SIGNUP" && !user.isVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  await setSession(user);

  return NextResponse.json({ ok: true, redirect: homePathFor(user.role) });
}
