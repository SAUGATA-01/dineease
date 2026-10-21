import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { PHONE_REGEX } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long").max(60),
  phone: z.string().regex(PHONE_REGEX, "Please enter a valid 10-digit phone number"),
  email: z.union([z.literal(""), z.string().trim().email("Please enter a valid email address")]),
  password: z.string().min(8, "Password must be at least 8 characters long").max(100),
  role: z.enum(["CUSTOMER", "RESTAURANT"]),
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

  const { name, phone, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing?.isVerified) {
    return NextResponse.json(
      { error: "This phone number is already registered, please login" },
      { status: 409 }
    );
  }

  if (email) {
    const emailUser = await prisma.user.findUnique({ where: { email } });
    if (emailUser && emailUser.phone !== phone) {
      return NextResponse.json(
        { error: "This email address is already in use" },
        { status: 409 }
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Unverified user dobara signup kare to details update ho jaayengi
  await prisma.user.upsert({
    where: { phone },
    update: { name, email: email || null, passwordHash, role },
    create: { name, phone, email: email || null, passwordHash, role },
  });

  const result = await createAndSendOtp(phone, "SIGNUP");
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({ ok: true, demoOtp: result.demoOtp });
}
