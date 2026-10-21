"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

const EMPTY = { name: "", description: "", category: "", price: "", isVeg: true, isAvailable: true };

export default function MenuManager({ restaurantId, items }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [...new Set(items.map((i) => i.category))];
  const grouped = {};
  for (const i of items) (grouped[i.category] ||= []).push(i);

  function update(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      price: String(item.price),
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const url = editingId
      ? `/api/dashboard/menu/${editingId}`
      : `/api/dashboard/restaurants/${restaurantId}/menu`;
    const { ok, data } = await callApi(url, editingId ? "PATCH" : "POST", {
      ...form,
      price: Number(form.price),
    });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to save");
      return;
    }
    reset();
    router.refresh();
  }

  async function toggleAvailable(item) {
    const { ok, data } = await callApi(`/api/dashboard/menu/${item.id}`, "PATCH", {
      name: item.name,
      description: item.description || "",
      category: item.category,
      price: item.price,
      isVeg: item.isVeg,
      isAvailable: !item.isAvailable,
    });
    if (!ok) alert(data.error || "Update failed");
    router.refresh();
  }

  async function remove(item) {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    const { ok, data } = await callApi(`/api/dashboard/menu/${item.id}`, "DELETE");
    if (!ok) alert(data.error || "Deletion failed");
    router.refresh();
  }

  const input = "w-full rounded-lg border p-3";

  return (
    <div>
      <form onSubmit={submit} className="mb-8 space-y-3 rounded-xl border bg-gray-50 p-4">
        <h2 className="font-semibold">{editingId ? "Edit Dish" : "Add New Dish"}</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" value={form.name} onChange={update} placeholder="Dish name" className={input} required />
          <input
            name="category"
            value={form.category}
            onChange={update}
            list="categories"
            placeholder="Category (e.g., Starters)"
            className={input}
            required
          />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input name="price" type="number" min="1" value={form.price} onChange={update} placeholder="Price (₹)" className={input} required />
          <input name="description" value={form.description} onChange={update} maxLength={200} placeholder="Short description (optional)" className={input} />
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isVeg" checked={form.isVeg} onChange={update} /> Is Vegetarian
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={update} /> Currently Available
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button disabled={loading} className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Saving..." : editingId ? "Save Changes" : "Add Dish"}
          </button>
          {editingId && (
            <button type="button" onClick={reset} className="px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-center text-gray-500">The menu is currently empty. Add your first dish above.</p>
      ) : (
        Object.entries(grouped).map(([category, list]) => (
          <div key={category} className="mb-6">
            <h3 className="mb-2 border-b pb-1 text-lg font-semibold text-orange-700">{category}</h3>
            <ul className="space-y-2">
              {list.map((item) => (
                <li key={item.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${item.isAvailable ? "" : "bg-gray-50 opacity-60"}`}>
                  <div className="flex items-start gap-2">
                    <span
                      title={item.isVeg ? "Veg" : "Non-veg"}
                      className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 ${item.isVeg ? "border-green-600" : "border-red-600"}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                    </span>
                    <div>
                      <p className="font-medium">
                        {item.name} <span className="font-normal text-gray-500">· ₹{item.price}</span>
                      </p>
                      {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                      {!item.isAvailable && <p className="text-xs text-red-600">Currently unavailable (hidden from customers)</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 text-xs">
                    <button onClick={() => toggleAvailable(item)} className="rounded border px-2 py-1">
                      {item.isAvailable ? "Mark Out of Stock" : "Mark Available"}
                    </button>
                    <button onClick={() => startEdit(item)} className="rounded border px-2 py-1">Edit</button>
                    <button onClick={() => remove(item)} className="rounded border border-red-500 px-2 py-1 text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
