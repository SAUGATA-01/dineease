import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { PHONE_REGEX } from "@/lib/constants";
import { minutesLeft, registerFailure, clearFailures, LOCK_MINUTES } from "@/lib/lockout";

const schema = z.object({
  phone: z.string().regex(PHONE_REGEX, "Please enter a valid 10-digit phone number"),
  password: z.string().min(1, "Please enter your password"),
});

// Run bcrypt even for unregistered numbers to prevent response timing from revealing whether a number is registered
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { phone, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { phone } });

  const wrong = NextResponse.json(
    { error: "Incorrect phone number or password" },
    { status: 401 }
  );

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return wrong;
  }

  const left = minutesLeft(user);
  if (left > 0) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${left} minutes` },
      { status: 429 }
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const locked = await registerFailure(user.id);
    if (locked) {
      return NextResponse.json(
        { error: `Too many failed attempts. Your account has been locked for ${LOCK_MINUTES} minutes` },
        { status: 429 }
      );
    }
    return wrong;
  }

  await clearFailures(user);

  if (user.isBlocked) {
    return NextResponse.json({ error: "Your account is blocked. Please contact the admin" }, { status: 403 });
  }
  if (!user.isVerified) {
    return NextResponse.json({ error: "Your phone number is not verified. Please verify it from the Sign Up page first" }, { status: 403 });
  }

  const result = await createAndSendOtp(phone, "LOGIN");
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({ ok: true, demoOtp: result.demoOtp });
}