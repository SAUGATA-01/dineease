import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { PHONE_REGEX } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(60),
  phone: z.string().regex(PHONE_REGEX, "Enter a valid 10-digit phone number"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(100),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(100)
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
  role: z.enum(["CUSTOMER", "RESTAURANT"]),
});

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, phone, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing?.isVerified) {
    return NextResponse.json(
      { error: "This phone number is already registered. Please log in" },
      { status: 409 }
    );
  }

  const emailUser = await prisma.user.findUnique({ where: { email } });
  if (emailUser && emailUser.phone !== phone) {
    if (emailUser.isVerified) {
      return NextResponse.json({ error: "This email address is already in use" }, { status: 409 });
    }
    // Someone started signing up with this email but did not verify it. The email should be available to its rightful owner.
    await prisma.user.delete({ where: { id: emailUser.id } });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { phone },
    update: { name, email, passwordHash, role },
    create: { name, phone, email, passwordHash, role },
  });

  const result = await createAndSendOtp(phone, "SIGNUP", email);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({ ok: true, demoOtp: result.demoOtp, sentTo: result.sentTo });
}