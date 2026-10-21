import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import { todayIST, toDbDate, fromDbDate } from "@/lib/datetime";
import DashboardNav from "@/components/DashboardNav";
import HolidaysManager from "@/components/HolidaysManager";

export default async function HolidaysPage({ params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) redirect("/login");
  const restaurant = await getOwnedRestaurant(id, owner.id);
  if (!restaurant) notFound();

  const today = todayIST();
  const rows = await prisma.closedDate.findMany({
    where: { restaurantId: id, date: { gte: toDbDate(today) } },
    orderBy: { date: "asc" },
  });
  const closedDates = rows.map((c) => ({
    id: c.id,
    dateStr: fromDbDate(c.date),
    reason: c.reason,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← My restaurants</Link>
      <h1 className="mt-2 mb-4 text-3xl font-bold">{restaurant.name}</h1>
      <DashboardNav restaurantId={id} />
      <HolidaysManager restaurantId={id} minDate={today} closedDates={closedDates} />
    </main>
  );
}