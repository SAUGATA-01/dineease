"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookingActions({ bookingId, canMark }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function update(status) {
    if (status === "CANCELLED" && !confirm("Are you sure you want to cancel the customer's booking?")) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/dashboard/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    router.refresh();
  }

  const btn = "rounded border px-2 py-1 text-xs disabled:opacity-50";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {canMark && (
          <>
            <button disabled={loading} onClick={() => update("COMPLETED")} className={`${btn} border-green-600 text-green-700`}>
              Completed
            </button>
            <button disabled={loading} onClick={() => update("NO_SHOW")} className={`${btn} border-gray-500 text-gray-700`}>
              No-show
            </button>
          </>
        )}
        <button disabled={loading} onClick={() => update("CANCELLED")} className={`${btn} border-red-500 text-red-600`}>
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
