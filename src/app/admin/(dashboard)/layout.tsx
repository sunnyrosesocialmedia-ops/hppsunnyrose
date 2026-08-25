import Link from "next/link";
import LogoutButton from "./logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold">Sunny Rose · Admin</span>
            <nav className="flex gap-4 text-sm text-neutral-600">
              <Link href="/admin">Dashboard</Link>
              <Link href="/admin/photos">Foto</Link>
              <Link href="/admin/orders">Pesanan</Link>
              <Link href="/" target="_blank">
                Lihat situs
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
