"use client";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }
  return (
    <button onClick={logout} className="rounded-lg bg-gray-800 px-4 py-2 text-white">
      Logout
    </button>
  );
}