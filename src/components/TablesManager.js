"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

function TableRow({ t }) {
  const router = useRouter();
  const [capacity, setCapacity] = useState(t.capacity);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function call(method, body) {
    setLoading(true);
    setError("");
    const { ok, data } = await callApi(`/api/dashboard/tables/${t.id}`, method, body);
    setLoading(false);
    if (!ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Are you sure you want to delete Table #${t.tableNumber}?`)) return;
    call("DELETE");
  }

  const btn = "rounded border px-2 py-1 text-xs disabled:opacity-50";

  return (
    <li className={`rounded-lg border p-3 ${t.isActive ? "" : "bg-gray-50 opacity-70"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold">
          Table #{t.tableNumber}
          {!t.isActive && <span className="ml-2 text-xs font-normal text-red-600">Inactive</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            type="number"
            min="1"
            max="20"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-16 rounded border p-1 text-center"
          />
          <span>seater</span>
          <button
            disabled={loading || capacity === t.capacity}
            onClick={() => call("PATCH", { capacity })}
            className={`${btn} border-orange-600 text-orange-700`}
          >
            Save
          </button>
          <button disabled={loading} onClick={() => call("PATCH", { isActive: !t.isActive })} className={btn}>
            {t.isActive ? "Deactivate" : "Activate"}
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

export default function TablesManager({ restaurantId, tables, nextNumber }) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState(nextNumber);
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function add(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, data } = await callApi(`/api/dashboard/restaurants/${restaurantId}/tables`, "POST", {
      tableNumber: Number(tableNumber),
      capacity: Number(capacity),
    });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to add table");
      return;
    }
    setTableNumber(Number(tableNumber) + 1);
    router.refresh();
  }

  const input = "w-24 rounded-lg border p-2";

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-gray-50 p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Table number</span>
          <input type="number" min="1" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className={input} required />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Capacity (guests)</span>
          <input type="number" min="1" max="20" value={capacity} onChange={(e) => setCapacity(e.target.value)} className={input} required />
        </label>
        <button disabled={loading} className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "Adding..." : "Add Table"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      {tables.length === 0 ? (
        <p className="text-center text-gray-500">No tables found. Customers will not be able to make bookings without tables configured.</p>
      ) : (
        <ul className="space-y-2">
          {tables.map((t) => (
            <TableRow key={t.id} t={t} />
          ))}
        </ul>
      )}
    </div>
  );
}
