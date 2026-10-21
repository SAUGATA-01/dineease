import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedRestaurant } from "@/lib/owner";

const schema = z.object({ photoUrl: z.string().url() });

export async function PUT(request, { params }) {
  const { id } = await params;
  const g = await requireOwnedRestaurant(id);
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid photo URL format" }, { status: 400 });
  }

  // Sirf hamare Cloudinary account aur isi restaurant ke folder ka link allowed hai
  const url = new URL(parsed.data.photoUrl);
  const okHost = url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  const okPath =
    url.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD_NAME}/`) &&
    url.pathname.includes(`/dineease/restaurants/${id}/`);

  if (!okHost || !okPath) {
    return NextResponse.json({ error: "This photo link is not allowed" }, { status: 400 });
  }

  await prisma.restaurant.update({
    where: { id },
    data: { photoUrl: parsed.data.photoUrl },
  });

  return NextResponse.json({ ok: true });
}
