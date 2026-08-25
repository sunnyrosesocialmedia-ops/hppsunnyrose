import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PhotoAdminList from "./photo-admin-list";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const photos = await prisma.photo.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Kelola Foto</h1>
        <Link
          href="/admin/photos/upload"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-md"
        >
          + Upload Foto
        </Link>
      </div>
      <PhotoAdminList initialPhotos={photos} />
    </div>
  );
}
