"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantForm({ cities, restaurant }) {
  const router = useRouter();
  const editing = Boolean(restaurant);

  const [form, setForm] = useState({
    name: restaurant?.name || "",
    cityId: restaurant?.cityId || "",
    address: restaurant?.address || "",
    cuisine: restaurant?.cuisine || "",
    description: restaurant?.description || "",
    openingTime: restaurant?.openingTime || "11:00",
    closingTime: restaurant?.closingTime || "23:00",
    costForTwo: restaurant?.costForTwo ?? "",
    mapLink: restaurant?.mapLink || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = editing
      ? `/api/dashboard/restaurants/${restaurant.id}`
      : "/api/dashboard/restaurants";

    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        costForTwo: form.costForTwo === "" ? null : Number(form.costForTwo),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to save changes");
      return;
    }
    router.push(`/dashboard/${data.id}`);
    router.refresh();
  }

  const input = "w-full rounded-lg border p-3";
  const label = "mb-1 block text-sm font-medium";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className={label}>Restaurant Name</label>
        <input name="name" value={form.name} onChange={update} className={input} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>City</label>
          <select name="cityId" value={form.cityId} onChange={update} className={input} required>
            <option value="">-- Select City --</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Cuisine</label>
          <input name="cuisine" value={form.cuisine} onChange={update} placeholder="E.g., North Indian" className={input} required />
        </div>
      </div>

      <div>
        <label className={label}>Address</label>
        <input name="address" value={form.address} onChange={update} className={input} required />
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea name="description" value={form.description} onChange={update} rows={3} maxLength={1000} className={input} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>Opening Time</label>
          <input type="time" name="openingTime" value={form.openingTime} onChange={update} className={input} required />
        </div>
        <div>
          <label className={label}>Closing Time</label>
          <input type="time" name="closingTime" value={form.closingTime} onChange={update} className={input} required />
        </div>
        <div>
          <label className={label}>Cost for Two (₹)</label>
          <input type="number" min="0" name="costForTwo" value={form.costForTwo} onChange={update} className={input} />
        </div>
      </div>

      <div>
        <label className={label}>Google Maps Link (optional)</label>
        <input name="mapLink" value={form.mapLink} onChange={update} placeholder="https://maps.google.com/..." className={input} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={loading}
        className="w-full rounded-lg bg-orange-600 p-3 text-lg font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : editing ? "Save Changes" : "Add Restaurant"}
      </button>
    </form>
  );
}
