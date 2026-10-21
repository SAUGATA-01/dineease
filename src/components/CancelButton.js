"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({ bookingId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Cancellation failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={cancel}
        disabled={loading}
        className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "Cancelling..." : "Cancel Booking"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
