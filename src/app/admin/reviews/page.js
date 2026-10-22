import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReviewActions from "@/components/ReviewActions";

export const metadata = { title: "Reviews - Admin" };

const TABS = [
  { value: "ALL", label: "All" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "LOW", label: "Low rating (1-2 ★)" },
];

export default async function AdminReviewsPage({ searchParams }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.value === sp?.view) ? sp.view : "ALL";

  const reviews = await prisma.review.findMany({
    where:
      tab === "HIDDEN" ? { isHidden: true } : tab === "LOW" ? { rating: { lte: 2 } } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true, phone: true } },
      restaurant: { select: { name: true } },
    },
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/reviews?view=${t.value}`}
            className={`rounded-full px-4 py-1 text-sm ${
              tab === t.value ? "bg-gray-900 text-white" : "border hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl border p-10 text-center text-gray-500">No reviews found.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className={`rounded-xl border p-4 ${r.isHidden ? "bg-gray-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.restaurant.name}</p>
                  <p className="text-sm text-gray-600">
                    {r.customer.name} (+91 {r.customer.phone}) · {r.createdAt.toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-700">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                  {r.isHidden && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      Hidden (not visible to the public)
                    </span>
                  )}
                </div>
              </div>
              {r.comment ? (
                <p className="mt-2 text-gray-800">{r.comment}</p>
              ) : (
                <p className="mt-2 text-sm text-gray-400">Rating only, no comment.</p>
              )}
              <div className="mt-3">
                <ReviewActions reviewId={r.id} isHidden={r.isHidden} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}