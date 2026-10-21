import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import DashboardNav from "@/components/DashboardNav";
import TablesManager from "@/components/TablesManager";

export default async function TablesPage({ params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) redirect("/login");
  const restaurant = await getOwnedRestaurant(id, owner.id);
  if (!restaurant) notFound();

  const rows = await prisma.restaurantTable.findMany({
    where: { restaurantId: id },
    orderBy: { tableNumber: "asc" },
  });
  const tables = rows.map((t) => ({
    id: t.id,
    tableNumber: t.tableNumber,
    capacity: t.capacity,
    isActive: t.isActive,
  }));
  const nextNumber = tables.length ? Math.max(...tables.map((t) => t.tableNumber)) + 1 : 1;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← My restaurants</Link>
      <h1 className="mt-2 mb-4 text-3xl font-bold">{restaurant.name}</h1>
      <DashboardNav restaurantId={id} />
      <TablesManager restaurantId={id} tables={tables} nextNumber={nextNumber} />
    </main>
  );
}