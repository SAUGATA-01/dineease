export const metadata = { title: "Terms & Conditions - DineEase" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900">Terms &amp; Conditions</h1>
      <p className="text-sm text-gray-500">This is a college project.</p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">About the Service</h2>
      <p>
        DineEase connects restaurants and customers to make table booking easier. We do not operate
        the restaurants ourselves, so each restaurant is responsible for its food, service, and any
        other aspects of its operations.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">For Customers</h2>
      <p>
        Provide accurate information. You can cancel your booking before the scheduled time.
        Repeated no-shows may result in your account being blocked. Write reviews that are honest
        and respectful.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">For Restaurant Owners</h2>
      <p>
        Keep your menu, operating hours, and table information accurate. Honor confirmed bookings.
        Admins may block any restaurant for providing false information or due to complaints.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">Account Restrictions</h2>
      <p>
        In cases of misuse, spam, or fake reviews, admins may block an account or restaurant, or
        hide or delete a review.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">Changes</h2>
      <p>These terms may be changed at any time.</p>
    </main>
  );
}