export const metadata = { title: "Privacy Policy - DineEase" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-gray-700">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="text-sm text-gray-500">This is a college project.</p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">Information We Collect</h2>
      <p>
        When creating an account, we collect your name, phone number, email (optional), and password. When making a booking, we collect the date, time, number of guests, and special requests. When writing a review, we collect your rating and comment. When submitting the contact form, we collect your name, email, phone number, and message.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">How We Use Your Information</h2>
      <p>
        Your information is used only for login, OTP verification, table bookings, and support. During a booking, the restaurant can see your name, phone number, and booking details. We do not sell your information.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">Password and Security</h2>
      <p>
        Your password is never stored in plain text; it is stored as a hash. Your login session is maintained in a secure cookie. However, no system on the internet is 100% secure.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">Third-Party Services</h2>
      <p>
        We use third-party services for database hosting, website hosting, and photo storage. Your data may be stored on these services' servers.
      </p>

      <h2 className="pt-2 text-xl font-semibold text-gray-900">Your Rights</h2>
      <p>
        You can contact us at support@dineease.com to view, update, or request the deletion of your data.
      </p>
    </main>
  );
}