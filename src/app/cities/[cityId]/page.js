import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RestaurantImage from "@/components/RestaurantImage";

export default async function CityRestaurantsPage({ params, searchParams }) {
  const { cityId } = await params;
  const { q = "" } = await searchParams;
  const search = q.trim();

  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) notFound();

  const restaurants = await prisma.restaurant.findMany({
    where: {
      cityId,
      status: "APPROVED",
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { cuisine: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { name: "asc" },
  });

  // Har restaurant ki average rating (hidden reviews ginti mein nahi)
  const ratings = await prisma.review.groupBy({
    by: ["restaurantId"],
    where: { isHidden: false, restaurantId: { in: restaurants.map((r) => r.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingMap = Object.fromEntries(ratings.map((r) => [r.restaurantId, r]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/cities" className="text-sm text-orange-700 hover:underline">
        ← Choose another city
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Restaurants in {city.name}</h1>

      <form className="mt-5 flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by name or cuisine (e.g., Chinese)"
          className="flex-1 rounded-lg border p-3"
        />
        <button className="rounded-lg bg-orange-600 px-5 font-semibold text-white">
          Search
        </button>
      </form>

      {restaurants.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">
          No restaurants found.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => {
            const rating = ratingMap[r.id];
            return (
              <Link
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md"
              >
                <RestaurantImage url={r.photoUrl} name={r.name} className="h-44 w-full" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold">{r.name}</h2>
                    {rating ? (
                      <span className="rounded bg-green-600 px-2 py-0.5 text-sm font-semibold text-white">
                        ★ {rating._avg.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">New</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{r.cuisine}</p>
                  <p className="mt-1 text-sm text-gray-500">{r.address}</p>
                  {r.costForTwo && (
                    <p className="mt-1 text-sm text-gray-500">₹{r.costForTwo} for two</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
