import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RestaurantImage from "@/components/RestaurantImage";

export default async function RestaurantPage({ params }) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      city: true,
      menuItems: { where: { isAvailable: true }, orderBy: [{ category: "asc" }, { name: "asc" }] },
      slots: { where: { isActive: true }, orderBy: { time: "asc" } },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { name: true } } },
      },
    },
  });

  // Pending ya blocked restaurant public ko nahi dikhana
  if (!restaurant || restaurant.status !== "APPROVED") notFound();

  const reviewCount = restaurant.reviews.length;
  const avg = reviewCount
    ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : null;

  // Menu ko category ke hisaab se group karo
  const menuByCategory = {};
  for (const item of restaurant.menuItems) {
    (menuByCategory[item.category] ||= []).push(item);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href={`/cities/${restaurant.cityId}`} className="text-sm text-orange-700 hover:underline">
        ← Restaurants in {restaurant.city.name}
      </Link>

      <RestaurantImage
        url={restaurant.photoUrl}
        name={restaurant.name}
        className="mt-3 h-64 w-full rounded-xl sm:h-80"
      />

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-gray-600">{restaurant.cuisine}</p>
          <p className="mt-1 text-sm text-gray-500">📍 {restaurant.address}</p>
          <p className="text-sm text-gray-500">
            🕒 {restaurant.openingTime} to {restaurant.closingTime}
          </p>
          {restaurant.costForTwo && (
            <p className="text-sm text-gray-500">💰 ₹{restaurant.costForTwo} for two</p>
          )}
          {restaurant.mapLink && (
            <a href={restaurant.mapLink} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-700 underline">
              View on Google Maps
            </a>
          )}
        </div>

        <div className="text-right">
          {avg ? (
            <div className="inline-block rounded-lg bg-green-600 px-3 py-1 text-lg font-bold text-white">
              ★ {avg.toFixed(1)}
            </div>
          ) : (
            <span className="text-sm text-gray-400">No ratings yet</span>
          )}
          <p className="mt-1 text-xs text-gray-500">{reviewCount} review{reviewCount === 1 ? "" : "s"}</p>
        </div>
      </div>

      {restaurant.description && (
        <p className="mt-4 text-gray-700">{restaurant.description}</p>
      )}

      <Link
        href={`/restaurants/${restaurant.id}/book`}
        className="mt-6 inline-block rounded-lg bg-orange-600 px-8 py-3 text-lg font-semibold text-white hover:bg-orange-700"
      >
        Book a Table
      </Link>

      {/* Slots */}
      {restaurant.slots.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-2xl font-bold">Available time slots</h2>
          <div className="flex flex-wrap gap-2">
            {restaurant.slots.map((s) => (
              <span key={s.id} className="rounded-full border px-4 py-1 text-sm">
                {s.time}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Menu */}
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Menu</h2>
        {Object.keys(menuByCategory).length === 0 ? (
          <p className="text-gray-500">Menu has not been added yet.</p>
        ) : (
          Object.entries(menuByCategory).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="mb-2 border-b pb-1 text-lg font-semibold text-orange-700">{category}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <span
                        title={item.isVeg ? "Veg" : "Non-veg"}
                        className={`mt-1 inline-block h-4 w-4 shrink-0 rounded-sm border-2 ${
                          item.isVeg ? "border-green-600" : "border-red-600"
                        } flex items-center justify-center`}
                      >
                        <span className={`h-2 w-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                      </span>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                      </div>
                    </div>
                    <span className="font-medium">₹{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Reviews</h2>
        {reviewCount === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {restaurant.reviews.map((r) => (
              <li key={r.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.customer.name}</span>
                  <span className="text-sm text-green-700">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="mt-1 text-gray-700">{r.comment}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {r.createdAt.toLocaleDateString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
