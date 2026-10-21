import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-gray-900 text-gray-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 text-xl font-bold text-white">🍽️ DineEase</h3>
          <p className="text-sm">
            Book tables at your favorite restaurants without waiting in lines.
          </p>
        </div>

        <div>
          <h4 className="mb-2 font-semibold text-white">Quick Links</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/cities" className="hover:text-white">Restaurants</Link></li>
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/signup" className="hover:text-white">Add Your Restaurant</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-semibold text-white">Contact</h4>
          <ul className="space-y-1 text-sm">
            <li>support@dineease.com</li>
            <li>+91 99999 99999</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4 text-center text-xs">
        © {new Date().getFullYear()} DineEase. College project.
      </div>
    </footer>
  );
}
