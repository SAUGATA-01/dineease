"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";
import RestaurantImage from "./RestaurantImage";

const MAX_MB = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PhotoUploader({ restaurantId, currentUrl, name }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function pick(e) {
    const f = e.target.files?.[0];
    setError("");
    setDone(false);
    if (!f) return;
    if (!TYPES.includes(f.type)) {
      setError("Only JPG, PNG or WEBP photos are supported");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Photo size must be smaller than ${MAX_MB} MB`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      // 1) Hamare server se signature lo
      const sign = await callApi(`/api/dashboard/restaurants/${restaurantId}/photo/sign`, "POST");
      if (!sign.ok) throw new Error(sign.data.error || "Signature not found");
      const s = sign.data;

      // 2) Photo seedha Cloudinary ko bhejo
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", s.apiKey);
      fd.append("timestamp", s.timestamp);
      fd.append("signature", s.signature);
      fd.append("folder", s.folder);
      fd.append("allowed_formats", s.allowedFormats);

      const up = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, {
        method: "POST",
        body: fd,
      });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error?.message || "Upload failed");

      // 3) Link database mein save karo
      const save = await callApi(`/api/dashboard/restaurants/${restaurantId}/photo`, "PUT", {
        photoUrl: upData.secure_url,
      });
      if (!save.ok) throw new Error(save.data.error || "Failed to save photo");

      setDone(true);
      setFile(null);
      setPreview("");
      router.refresh();
    } catch (e) {
      setError(e.message || "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Current Photo</p>
        <RestaurantImage url={currentUrl} name={name} className="h-56 w-full rounded-xl sm:h-72" />
      </div>

      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="block w-full text-sm" />

      {preview && (
        <div>
          <p className="mb-2 text-sm font-medium">New Photo (preview)</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="h-56 w-full rounded-xl object-cover sm:h-72" />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-green-700">Photo uploaded successfully ✅</p>}

      <button
        onClick={upload}
        disabled={!file || loading}
        className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Photo"}
      </button>
    </div>
  );
}
