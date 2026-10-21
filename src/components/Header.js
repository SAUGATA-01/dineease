import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const session = await getSession();
  const role = session?.role;

  const links = [
    { href: "/", label: "Home" },
    { href: "/cities", label: "Restaurants" },
  ];

  if (role === "CUSTOMER") links.push({ href: "/my-bookings", label: "My Bookings" });
  if (role === "RESTAURANT") links.push({ href: "/dashboard", label: "Dashboard" });
  if (role === "ADMIN") links.push({ href: "/admin", label: "Admin Panel" });

  links.push({ href: "/about", label: "About" }, { href: "/contact", label: "Contact" });

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-2xl font-bold text-orange-600">
          🍽️ DineEase
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-orange-600">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {session ? (
            <>
              <span className="text-gray-600">Hi, {session.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50">
                Login
              </Link>
              <Link href="/signup" className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}