"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";
import { formatTime } from "@/lib/datetime";

function SlotRow({ s }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function call(method, body) {
    setLoading(true);
    setError("");
    const { ok, data } = await callApi(`/api/dashboard/slots/${s.id}`, method, body);
    setLoading(false);
    if (!ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.refresh();
  }

  function remove() {
    if (!confirm(`Are you sure you want to delete the slot for ${formatTime(s.time)}?`)) return;
    call("DELETE");
  }

  const btn = "rounded border px-2 py-1 text-xs disabled:opacity-50";

  return (
    <li className={`rounded-lg border p-3 ${s.isActive ? "" : "bg-gray-50 opacity-70"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">
          {formatTime(s.time)}
          {!s.isActive && <span className="ml-2 text-xs font-normal text-red-600">Inactive</span>}
        </span>
        <div className="flex gap-2">
          <button disabled={loading} onClick={() => call("PATCH", { isActive: !s.isActive })} className={btn}>
            {s.isActive ? "Deactivate" : "Activate"}
          </button>
          <button disabled={loading} onClick={remove} className={`${btn} border-red-500 text-red-600`}>
            Delete
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}

export default function SlotsManager({ restaurantId, slots, openingTime, closingTime }) {
  const router = useRouter();
  const [time, setTime] = useState("19:00");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function add(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, data } = await callApi(`/api/dashboard/restaurants/${restaurantId}/slots`, "POST", { time });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to add slot");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">
        Operating hours: {formatTime(openingTime)} to {formatTime(closingTime)}. Slots must fall within this window.
      </p>

      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-gray-50 p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">New Time Slot</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border p-2" required />
        </label>
        <button disabled={loading} className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "Adding..." : "Add Slot"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      {slots.length === 0 ? (
        <p className="text-center text-gray-500">No slots added yet.</p>
      ) : (
        <ul className="space-y-2">
          {slots.map((s) => (
            <SlotRow key={s.id} s={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
