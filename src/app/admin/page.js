import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { todayIST, addDays, toDbDate, fromDbDate, formatDate } from "@/lib/datetime";

export const metadata = { title: "Admin - DineEase" };

function Stat({ label, value, href, highlight }) {
  const body = (
    <div className={`rounded-xl border p-4 text-center ${highlight ? "border-yellow-400 bg-yellow-50" : ""}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminOverviewPage() {
  const today = todayIST();
  const openTickets = await prisma.supportTicket.count({ where: { status: "OPEN" } });
  const weekEnd = addDays(today, 6);

  const [usersByRole, restByStatus, bookByStatus, todayCount, perDay, top] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.restaurant.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.count({ where: { date: toDbDate(today), isActive: true } }),
    prisma.booking.groupBy({
      by: ["date"],
      where: { date: { gte: toDbDate(today), lte: toDbDate(weekEnd) }, isActive: true },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["restaurantId"],
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _count: { _all: true },
      orderBy: { _count: { restaurantId: "desc" } },
      take: 5,
    }),
  ]);

  const topRestaurants = await prisma.restaurant.findMany({
    where: { id: { in: top.map((t) => t.restaurantId) } },
    select: { id: true, name: true, city: { select: { name: true } } },
  });
  const nameMap = Object.fromEntries(topRestaurants.map((r) => [r.id, r]));

  const countOf = (rows, key, value) => rows.find((r) => r[key] === value)?._count._all || 0;

  const customers = countOf(usersByRole, "role", "CUSTOMER");
  const owners = countOf(usersByRole, "role", "RESTAURANT");
  const pending = countOf(restByStatus, "status", "PENDING");
  const approved = countOf(restByStatus, "status", "APPROVED");
  const blocked = countOf(restByStatus, "status", "BLOCKED");

  const totalBookings = bookByStatus.reduce((s, b) => s + b._count._all, 0);
  const cancelled = countOf(bookByStatus, "status", "CANCELLED");
  const noShow = countOf(bookByStatus, "status", "NO_SHOW");
  const cancelRate = totalBookings ? Math.round((cancelled / totalBookings) * 100) : 0;

  // Bookings for the next 7 days
  const dayMap = Object.fromEntries(perDay.map((d) => [fromDbDate(d.date), d._count._all]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDays(today, i);
    return { dateStr, count: dayMap[dateStr] || 0 };
  });
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  return (
    <div>
      {pending > 0 && (
        <Link href="/admin/restaurants?status=PENDING" className="mb-6 block rounded-lg border border-yellow-400 bg-yellow-50 p-4 text-yellow-900">
          ⏳ <b>{pending}</b> restaurant{pending === 1 ? "" : "s"} are waiting for approval. Click to view →
        </Link>
      )}

      {openTickets > 0 && (
        <Link href="/admin/tickets" className="mb-4 block rounded-lg border border-blue-300 bg-blue-50 p-4 text-blue-900">
          🎫 <b>{openTickets}</b> support ticket{openTickets === 1 ? "" : "s"} open hain. Dekhne ke liye click karo →
        </Link>
      )}

      <h2 className="mb-3 text-xl font-semibold">Platform Overview</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Customers" value={customers} href="/admin/users?role=CUSTOMER" />
        <Stat label="Restaurant owners" value={owners} href="/admin/users?role=RESTAURANT" />
        <Stat label="Live restaurants" value={approved} href="/admin/restaurants?status=APPROVED" />
        <Stat label="Pending approval" value={pending} href="/admin/restaurants?status=PENDING" highlight={pending > 0} />
        <Stat label="Blocked restaurants" value={blocked} href="/admin/restaurants?status=BLOCKED" />
        <Stat label="Total bookings" value={totalBookings} />
        <Stat label="Today's bookings" value={todayCount} />
        <Stat label="Cancellation rate" value={`${cancelRate}%`} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Bookings for the Next 7 Days</h2>
          <ul className="space-y-2">
            {days.map((d) => (
              <li key={d.dateStr} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 text-gray-600">{formatDate(d.dateStr)}</span>
                <div className="h-5 flex-1 rounded bg-gray-100">
                  <div className="h-5 rounded bg-orange-500" style={{ width: `${(d.count / maxDay) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-semibold">{d.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Most Popular Restaurants</h2>
          {top.length === 0 ? (
            <p className="text-gray-500">No bookings yet.</p>
          ) : (
            <ol className="space-y-2">
              {top.map((t, i) => {
                const r = nameMap[t.restaurantId];
                return (
                  <li key={t.restaurantId} className="flex items-center justify-between rounded-lg border p-3">
                    <span>
                      <b>{i + 1}.</b> {r?.name || "Deleted"}{" "}
                      <span className="text-sm text-gray-500">{r?.city?.name}</span>
                    </span>
                    <span className="text-sm font-semibold">{t._count._all} bookings</span>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-3 text-xs text-gray-500">Total no-show bookings so far: {noShow}</p>
        </section>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Revenue analytics are not available yet because the platform does not support payments (we skipped Razorpay).
      </p>
    </div>
  );
}