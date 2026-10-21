import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fromDbDate, formatDate, formatTime, isPastSlot } from "@/lib/datetime";
import CancelButton from "@/components/CancelButton";
import ReviewForm from "@/components/ReviewForm";

export const metadata = { title: "My Bookings - DineEase" };

const STATUS = {
  CONFIRMED: { label: "Confirmed", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", cls: "bg-blue-100 text-blue-800" },
  NO_SHOW: { label: "No show", cls: "bg-gray-200 text-gray-700" },
};

function BookingCard({ b, review }) {
  const st = STATUS[b.status];
  const canCancel = b.status === "CONFIRMED" && !b.past;
  const canReview = b.status === "COMPLETED" || (b.status === "CONFIRMED" && b.past);

  return (
    <li className="rounded-xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/restaurants/${b.restaurant.id}`} className="text-lg font-semibold hover:text-orange-600">
            {b.restaurant.name}
          </Link>
          <p className="text-sm text-gray-500">{b.restaurant.address}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
      </div>

      <div className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
        <p>📅 {formatDate(b.dateStr)}</p>
        <p>🕒 {formatTime(b.slot.time)}</p>
        <p>👥 {b.guests} {b.guests === 1 ? "person" : "people"}</p>
        <p>🪑 Table #{b.table.tableNumber}</p>
      </div>
      {b.specialRequest && <p className="mt-2 text-sm text-gray-500">Request: {b.specialRequest}</p>}

      <div className="mt-3">
        {canCancel && <CancelButton bookingId={b.id} />}
        {canReview && (
          <ReviewForm
            restaurantId={b.restaurant.id}
            initialRating={review?.rating || 0}
            initialComment={review?.comment || ""}
          />
        )}
      </div>
    </li>
  );
}

export default async function MyBookingsPage() {
  const session = await getSession();

  const [bookings, reviews] = await Promise.all([
    prisma.booking.findMany({
      where: { customerId: session.userId },
      include: {
        restaurant: { select: { id: true, name: true, address: true } },
        slot: true,
        table: true,
      },
    }),
    prisma.review.findMany({ where: { customerId: session.userId } }),
  ]);

  const reviewMap = Object.fromEntries(reviews.map((r) => [r.restaurantId, r]));

  const items = bookings.map((b) => {
    const dateStr = fromDbDate(b.date);
    return { ...b, dateStr, past: isPastSlot(dateStr, b.slot.time) };
  });
  const key = (b) => b.dateStr + b.slot.time;

  const upcoming = items
    .filter((b) => b.status === "CONFIRMED" && !b.past)
    .sort((a, b) => key(a).localeCompare(key(b)));
  const history = items
    .filter((b) => !(b.status === "CONFIRMED" && !b.past))
    .sort((a, b) => key(b).localeCompare(key(a)));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Bookings</h1>

      <h2 className="mb-3 text-xl font-semibold">Upcoming Bookings</h2>
      {upcoming.length === 0 ? (
        <p className="mb-8 text-gray-500">
          No upcoming bookings found.{" "}
          <Link href="/cities" className="text-orange-700 underline">Book a Table</Link>
        </p>
      ) : (
        <ul className="mb-8 space-y-4">
          {upcoming.map((b) => (
            <BookingCard key={b.id} b={b} review={reviewMap[b.restaurant.id]} />
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-xl font-semibold">Booking History</h2>
      {history.length === 0 ? (
        <p className="text-gray-500">No past bookings found.</p>
      ) : (
        <ul className="space-y-4">
          {history.map((b) => (
            <BookingCard key={b.id} b={b} review={reviewMap[b.restaurant.id]} />
          ))}
        </ul>
      )}
    </main>
  );
}
