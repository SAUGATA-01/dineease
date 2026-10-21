import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Choose City - DineEase" };

export default async function CitiesPage() {
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { restaurants: { where: { status: "APPROVED" } } } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-center text-3xl font-bold">Choose Your City</h1>
      <p className="mt-2 text-center text-gray-600">
        Select a city to explore its available restaurants.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.id}
            href={`/cities/${city.id}`}
            className="rounded-xl border p-6 text-center shadow-sm transition hover:border-orange-600 hover:shadow-md"
          >
            <div className="text-4xl">📍</div>
            <h2 className="mt-2 text-xl font-semibold">{city.name}</h2>
            <p className="text-sm text-gray-500">
              {city._count.restaurants} restaurant{city._count.restaurants === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
