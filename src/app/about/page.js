export const metadata = { title: "About - DineEase" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">About DineEase</h1>
      <p className="mb-3 text-gray-700">
        DineEase is a restaurant table reservation platform. Customers can explore 
        restaurants in their city and book tables based on their preferred date and time slots.
      </p>
      <p className="mb-3 text-gray-700">
        Restaurant owners can manage their menus, table capacities, and incoming reservations 
        from a single dashboard, while the admin oversees the entire platform.
      </p>
      <p className="text-gray-700">
        This is a college project built using Next.js, PostgreSQL, and Prisma.
      </p>
    </main>
  );
}
