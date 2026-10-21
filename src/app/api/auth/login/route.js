import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { PHONE_REGEX } from "@/lib/constants";

const schema = z.object({
  phone: z.string().regex(PHONE_REGEX, "Please enter a valid 10-digit phone number"),
  password: z.string().min(1, "Password is required"),
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

  const { phone, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { phone } });

  // Same message dono cases mein, taaki koi pata na laga sake ki number registered hai ya nahi
  const wrong = NextResponse.json(
    { error: "Invalid phone number or password" },
    { status: 401 }
  );

  if (!user) return wrong;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return wrong;

  if (user.isBlocked) {
    return NextResponse.json(
      { error: "Your account is blocked. Please contact support" },
      { status: 403 }
    );
  }
  if (!user.isVerified) {
    return NextResponse.json(
      { error: "Phone number is not verified. Please verify from the Sign up page first" },
      { status: 403 }
    );
  }

  const result = await createAndSendOtp(phone, "LOGIN");
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({ ok: true, demoOtp: result.demoOtp });
}
