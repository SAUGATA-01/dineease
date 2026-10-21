import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const OTP_MODE = process.env.OTP_MODE || "demo";

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digit
}

// Baad mein real SMS (MSG91) lagana ho to sirf yeh function badlo
async function sendOtp(phone, otp) {
  if (OTP_MODE === "demo") {
    console.log(`[DEMO OTP] ${phone} -> ${otp}`);
    return;
  }
  throw new Error("SMS provider abhi configure nahi hai");
}

export async function createAndSendOtp(phone, purpose) {
  const now = new Date();

  // Rate limit 1: 30 second mein dobara nahi
  const last = await prisma.otp.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (last && now - last.createdAt < 30 * 1000) {
    return { error: "30 second baad dobara try karo" };
  }

  // Rate limit 2: 1 ghante mein max 5 OTP
  const count = await prisma.otp.count({
    where: { phone, createdAt: { gt: new Date(now - 60 * 60 * 1000) } },
  });
  if (count >= 5) {
    return { error: "Bahut zyada OTP requests. 1 ghante baad try karo" };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await prisma.otp.create({
    data: {
      phone,
      otpHash,
      purpose,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minute
    },
  });

  await sendOtp(phone, otp);

  return { ok: true, demoOtp: OTP_MODE === "demo" ? otp : undefined };
}

export async function verifyOtp(phone, purpose, code) {
  const record = await prisma.otp.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "OTP nahi mila, dobara bhejo" };
  if (record.expiresAt < new Date()) {
    return { ok: false, error: "OTP expire ho gaya, naya mangao" };
  }
  if (record.attempts >= 3) {
    return { ok: false, error: "3 galat attempts ho gaye, naya OTP mangao" };
  }

  const match = await bcrypt.compare(code, record.otpHash);
  if (!match) {
    await prisma.otp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Galat OTP" };
  }

  await prisma.otp.deleteMany({ where: { phone, purpose } });
  return { ok: true };
}