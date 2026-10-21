import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });

  const steps = [
    { icon: "📍", title: "Choose a City", text: "Select your city and browse available restaurants." },
    { icon: "🍛", title: "Choose a Restaurant", text: "Decide by checking menus, photos, and customer reviews." },
    { icon: "📅", title: "Book Your Table", text: "Specify the date, preferred time slot, and guest count." },
  ];

  const features = [
    { icon: "⚡", title: "Instant Booking", text: "View real-time table availability with zero risk of double booking." },
    { icon: "🔒", title: "Secure Authentication", text: "Hassle-free logins powered by secure password hashing and OTP verification." },
    { icon: "⭐", title: "Genuine Reviews", text: "Read verified feedback posted by customers after their dining experience." },
    { icon: "🏪", title: "Restaurant Dashboard", text: "Owners can effortlessly manage bookings, capacities, and menus." },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Your Favorite Restaurant,<br />
            <span className="text-orange-600">Your Preferred Table</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Pick a city, explore top dining spots, and book your table in just a few clicks.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/cities" className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700">
              Book a Table
            </Link>
            <Link href="/signup" className="rounded-lg border border-orange-600 bg-white px-6 py-3 font-semibold text-orange-700 hover:bg-orange-50">
              Restaurant Owner? Join Us
            </Link>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold">We Are Available in These Cities</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {cities.map((c) => (
            <Link key={c.id} href={`/cities/${c.id}`} className="rounded-full border bg-white px-5 py-2 text-sm font-medium shadow-sm hover:border-orange-600 hover:text-orange-600">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-8 text-center text-2xl font-bold">How Does It Work?</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-xl bg-white p-6 text-center shadow-sm">
                <div className="text-4xl">{s.icon}</div>
                <h3 className="mt-3 font-semibold">{i + 1}. {s.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold">Why Choose DineEase?</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border p-5">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
