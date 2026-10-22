import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RestaurantStatusActions from "@/components/RestaurantStatusActions";

export const metadata = { title: "Restaurants - Admin" };

const TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Live" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "ALL", label: "All" },
];

const BADGE = {
  PENDING: { label: "Approval pending", cls: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Live", cls: "bg-green-100 text-green-800" },
  BLOCKED: { label: "Blocked", cls: "bg-red-100 text-red-700" },
};

export default async function AdminRestaurantsPage({ searchParams }) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp?.status) ? sp.status : "PENDING";

  const restaurants = await prisma.restaurant.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      city: true,
      owner: { select: { name: true, phone: true } },
      _count: { select: { tables: true, menuItems: true, bookings: true } },
    },
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/restaurants?status=${t.value}`}
            className={`rounded-full px-4 py-1 text-sm ${
              status === t.value ? "bg-gray-900 text-white" : "border hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {restaurants.length === 0 ? (
        <p className="rounded-xl border p-10 text-center text-gray-500">There are no restaurants in this category.</p>
      ) : (
        <ul className="space-y-4">
          {restaurants.map((r) => {
            const b = BADGE[r.status];
            return (
              <li key={r.id} className="rounded-xl border p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold">{r.name}</h2>
                    <p className="text-sm text-gray-600">{r.city.name} · {r.cuisine}</p>
                    <p className="text-sm text-gray-500">📍 {r.address}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${b.cls}`}>{b.label}</span>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                  <p>👤 Owner: {r.owner.name} (+91 {r.owner.phone})</p>
                  <p>🕒 {r.openingTime} to {r.closingTime}</p>
                  <p>🪑 Tables: {r._count.tables} · 🍛 Menu items: {r._count.menuItems}</p>
                  <p>📅 Total bookings: {r._count.bookings}</p>
                </div>

                {r.description && <p className="mt-2 text-sm text-gray-500">{r.description}</p>}

                {r.status === "PENDING" && r._count.tables === 0 && (
                  <p className="mt-2 text-sm text-yellow-700">
                    ⚠️ This restaurant does not have any tables yet. Customers will not be able to make bookings even after approval.
                  </p>
                )}
                {r.status === "BLOCKED" && r._count.bookings > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Note: Blocking a restaurant prevents new bookings, but existing confirmed bookings remain in the database.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <RestaurantStatusActions restaurantId={r.id} status={r.status} />
                  {r.status === "APPROVED" && (
                    <Link href={`/restaurants/${r.id}`} className="text-sm text-orange-700 underline">
                      View public page
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}