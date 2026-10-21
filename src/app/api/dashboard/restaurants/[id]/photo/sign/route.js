import crypto from "crypto";
import { NextResponse } from "next/server";
import { requireOwnedRestaurant } from "@/lib/owner";

export async function POST(request, { params }) {
  const { id } = await params;
  const g = await requireOwnedRestaurant(id);
  if (g.error) return g.error;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: "Cloudinary is not configured yet" }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `dineease/restaurants/${id}`;
  const allowedFormats = "jpg,jpeg,png,webp";

  // Cloudinary ka rule: params alphabetical order mein, phir secret jod ke SHA-1
  const toSign = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(toSign + CLOUDINARY_API_SECRET)
    .digest("hex");

  return NextResponse.json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    folder,
    allowedFormats,
    signature,
  });
}
