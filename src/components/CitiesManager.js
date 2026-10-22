"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

function CityRow({ city }) {
  const router = useRouter();
  const [name, setName] = useState(city.name);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function call(method, body) {
    setLoading(true);
    setError("");
    const { ok, data } = await callApi(`/api/admin/cities/${city.id}`, method, body);
    setLoading(false);
    if (!ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    router.refresh();
  }

  function remove() {
    if (!confirm(`Are you sure you want to delete "${city.name}"?`)) return;
    call("DELETE");
  }

  const btn = "rounded border px-2 py-1 text-xs disabled:opacity-50";

  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="rounded border p-2"
          />
          <span className="text-sm text-gray-500">{city.count} restaurant{city.count === 1 ? "" : "s"}</span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={loading || name.trim() === city.name}
            onClick={() => call("PATCH", { name })}
            className={`${btn} border-orange-600 text-orange-700`}
          >
            Save Name
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

export default function CitiesManager({ cities }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function add(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, data } = await callApi("/api/admin/cities", "POST", { name });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to add city");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-gray-50 p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">New City</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="For example: Jaipur"
            className="rounded-lg border p-2"
            required
          />
        </label>
        <button disabled={loading} className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
          {loading ? "Adding..." : "Add City"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <ul className="space-y-2">
        {cities.map((c) => (
          <CityRow key={c.id} city={c} />
        ))}
      </ul>
    </div>
  );
}