import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is not set");
    }
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  await getTransporter().sendMail({
    from: `"DineEase" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}