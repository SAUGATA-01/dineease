import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import DashboardNav from "@/components/DashboardNav";
import SlotsManager from "@/components/SlotsManager";

export default async function SlotsPage({ params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) redirect("/login");
  const restaurant = await getOwnedRestaurant(id, owner.id);
  if (!restaurant) notFound();

  const rows = await prisma.slot.findMany({
    where: { restaurantId: id },
    orderBy: { time: "asc" },
  });
  const slots = rows.map((s) => ({ id: s.id, time: s.time, isActive: s.isActive }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← My restaurants</Link>
      <h1 className="mt-2 mb-4 text-3xl font-bold">{restaurant.name}</h1>
      <DashboardNav restaurantId={id} />
      <SlotsManager
        restaurantId={id}
        slots={slots}
        openingTime={restaurant.openingTime}
        closingTime={restaurant.closingTime}
      />
    </main>
  );
}