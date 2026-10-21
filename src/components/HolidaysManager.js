"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";
import { formatDate } from "@/lib/datetime";

export default function HolidaysManager({ restaurantId, minDate, closedDates }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function add(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, data } = await callApi(`/api/dashboard/restaurants/${restaurantId}/closed-dates`, "POST", { date, reason });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to add closure date");
      return;
    }
    setDate("");
    setReason("");
    router.refresh();
  }

  async function remove(id) {
    const { ok, data } = await callApi(`/api/dashboard/closed-dates/${id}`, "DELETE");
    if (!ok) alert(data.error || "Failed to reopen");
    router.refresh();
  }

  const input = "rounded-lg border p-2";

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-gray-50 p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Closure Date</span>
          <input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className={input} required />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block font-medium">Reason (optional)</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} placeholder="E.g., Diwali, renovation" className={`${input} w-full`} />
        </label>
        <button disabled={loading} className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "Adding..." : "Close Restaurant"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      {closedDates.length === 0 ? (
        <p className="text-center text-gray-500">No upcoming holidays set.</p>
      ) : (
        <ul className="space-y-2">
          {closedDates.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{formatDate(c.dateStr)}</p>
                {c.reason && <p className="text-sm text-gray-500">{c.reason}</p>}
              </div>
              <button onClick={() => remove(c.id)} className="rounded border px-3 py-1 text-xs">
                Reopen
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
