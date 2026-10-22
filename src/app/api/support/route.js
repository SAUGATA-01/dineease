import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PHONE_REGEX } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(60),
  email: z.string().trim().email("Invalid email address").max(100),
  phone: z.union([z.literal(""), z.string().regex(PHONE_REGEX, "Please enter a valid 10-digit phone number")]),
  subject: z.string().trim().min(3, "Please enter a subject").max(100),
  message: z.string().trim().min(10, "Message must be at least 10 characters long").max(1000),
});

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;

  // Prevent spam: a maximum of 3 tickets per email per hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const mine = await prisma.supportTicket.count({
    where: { email: { equals: d.email, mode: "insensitive" }, createdAt: { gt: hourAgo } },
  });
  if (mine >= 3) {
    return NextResponse.json({ error: "You have sent too many messages. Please try again later." }, { status: 429 });
  }

  // Apply a platform-wide limit to prevent abuse through multiple email addresses
  const all = await prisma.supportTicket.count({ where: { createdAt: { gt: hourAgo } } });
  if (all >= 50) {
    return NextResponse.json({ error: "We are receiving too many messages right now. Please try again later." }, { status: 429 });
  }

  const session = await getSession();

  await prisma.supportTicket.create({
    data: {
      userId: session?.userId || null,
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject,
      message: d.message,
    },
  });

  return NextResponse.json({ ok: true });
}