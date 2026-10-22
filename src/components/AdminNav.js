"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "📊 Overview" },
  { href: "/admin/restaurants", label: "🏪 Restaurants" },
  { href: "/admin/bookings", label: "📅 Bookings" },
  { href: "/admin/users", label: "👥 Users" },
  { href: "/admin/reviews", label: "⭐ Reviews" },
  { href: "/admin/tickets", label: "🎫 Tickets" },
  { href: "/admin/cities", label: "📍 Cities" },
];

export default function AdminNav() {
  const path = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b pb-3">
      {ITEMS.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              active ? "bg-orange-600 text-white" : "border hover:bg-gray-50"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}