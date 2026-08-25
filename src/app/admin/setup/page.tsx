"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, email, password, name: name || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Gagal membuat akun admin");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/admin/login"), 2000);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Akun admin berhasil dibuat!</h1>
          <p className="text-sm text-neutral-500">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4 border"
      >
        <div>
          <h1 className="text-xl font-semibold">Buat / Reset Akun Admin</h1>
          <p className="text-sm text-neutral-500">
            Kalau email di bawah belum terdaftar, akun baru dibuat. Kalau sudah ada, password-nya
            akan diganti dengan yang baru. Perlu Setup Secret yang sama dengan environment
            variable <code>SETUP_SECRET</code>.
          </p>
        </div>

        {error && (
          <div className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium">Setup Secret</label>
          <input
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Nilai SETUP_SECRET di environment variable"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Nama (opsional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Email Login</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Buat Akun Admin"}
        </button>
      </form>
    </div>
  );
}
