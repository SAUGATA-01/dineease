import { prisma } from "@/lib/prisma";
import CitiesManager from "@/components/CitiesManager";

export const metadata = { title: "Cities - Admin" };

export default async function AdminCitiesPage() {
  const rows = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { restaurants: true } } },
  });
  const cities = rows.map((c) => ({ id: c.id, name: c.name, count: c._count.restaurants }));

  return <CitiesManager cities={cities} />;
}