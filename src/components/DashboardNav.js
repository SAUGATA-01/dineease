"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardNav({ restaurantId }) {
  const path = usePathname();
  const base = `/dashboard/${restaurantId}`;

  const items = [
    { href: base, label: "📅 Bookings" },
    { href: `${base}/menu`, label: "🍛 Menu" },
    { href: `${base}/tables`, label: "🪑 Tables" },
    { href: `${base}/slots`, label: "🕒 Slots" },
    { href: `${base}/holidays`, label: "🚫 Holidays" },
    { href: `${base}/photo`, label: "📷 Photo" },
    { href: `${base}/edit`, label: "✏️ Details" },
  ];

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b pb-3">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            path === i.href ? "bg-orange-600 text-white" : "border hover:bg-gray-50"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}