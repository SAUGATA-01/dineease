import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendMail } from "./mailer";

const OTP_MODE = process.env.OTP_MODE || "demo";

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digits
}

export function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

// A single function determines where the OTP will be sent.
async function sendOtp(phone, email, otp) {
  if (OTP_MODE === "demo") {
    console.log(`[DEMO OTP] ${phone} -> ${otp}`);
    return;
  }

  if (OTP_MODE === "email") {
    await sendMail({
      to: email,
      subject: `DineEase OTP: ${otp}`,
      text: `Your DineEase OTP is ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:20px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#ea580c;margin:0 0 12px">🍽️ DineEase</h2>
          <p>Your verification code:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:12px 0">${otp}</p>
          <p style="color:#666;font-size:14px">This code is valid for 5 minutes. Do not share it with anyone.
          If you did not request this code, please ignore this email.</p>
        </div>`,
    });
    return;
  }

  throw new Error("Invalid OTP_MODE");
}

export async function createAndSendOtp(phone, purpose, email) {
  if (OTP_MODE === "email" && !email) {
    return { error: "This account does not have an email address, so an OTP cannot be sent" };
  }

  const now = new Date();
  const hourAgo = new Date(now - 60 * 60 * 1000);

  // Limit 1: Do not allow another OTP request for the same phone number within 30 seconds.
  const last = await prisma.otp.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (last && now - last.createdAt < 30 * 1000) {
    return { error: "Please try again after 30 seconds" };
  }

  // Limit 2: Allow a maximum of 5 OTP requests per phone number per hour.
  const phoneCount = await prisma.otp.count({ where: { phone, createdAt: { gt: hourAgo } } });
  if (phoneCount >= 5) {
    return { error: "Too many OTP requests. Please try again after an hour" };
  }

  // Limit 3: Allow a maximum of 5 OTP requests per email address per hour to prevent spam.
  if (email) {
    const emailCount = await prisma.otp.count({ where: { email, createdAt: { gt: hourAgo } } });
    if (emailCount >= 5) {
      return { error: "Too many OTPs have been sent to this email address. Please try again after an hour" };
    }
  }

  // Limit 4: Limit requests across the entire platform to protect Gmail's daily sending quota.
  const allCount = await prisma.otp.count({ where: { createdAt: { gt: hourAgo } } });
  if (allCount >= 60) {
    return { error: "There are too many requests right now. Please try again later" };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  const record = await prisma.otp.create({
    data: {
      phone,
      email: email || null,
      otpHash,
      purpose,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
    },
  });

  try {
    await sendOtp(phone, email, otp);
  } catch (e) {
    console.error("OTP sending failed:", e);
    // If the email could not be sent, do not count this record toward the request limit.
    await prisma.otp.delete({ where: { id: record.id } }).catch(() => {});
    return { error: "Failed to send the OTP email. Please try again later" };
  }

  return {
    ok: true,
    demoOtp: OTP_MODE === "demo" ? otp : undefined,
    sentTo: email ? maskEmail(email) : null,
  };
}

export async function verifyOtp(phone, purpose, code) {
  const record = await prisma.otp.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, error: "OTP not found. Please request a new one" };
  if (record.expiresAt < new Date()) {
    return { ok: false, error: "OTP has expired. Please request a new one" };
  }
  if (record.attempts >= 3) {
    return { ok: false, error: "You have made 3 incorrect attempts. Please request a new OTP" };
  }

  const match = await bcrypt.compare(code, record.otpHash);
  if (!match) {
    await prisma.otp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect OTP" };
  }

  await prisma.otp.deleteMany({ where: { phone, purpose } });
  return { ok: true };
}