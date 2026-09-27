import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { siteConfig } from "@/config";

/** Public gallery root. Event folders are direct children of this path. */
const GALLERY_FOLDER = siteConfig.cloudinary.galleryFolder;

export async function GET() {
  try {
    const { folders } = await cloudinary.api.sub_folders(GALLERY_FOLDER);

    const visibleFolders = folders.map((folder: { name: string; path: string }) => ({
      name: folder.name,
      path: folder.path,
    }));

    const events = await Promise.all(
      visibleFolders.map(async (folder: { name: string; path: string }) => {
        const { resources } = await cloudinary.search
          .expression(`folder:"${folder.path}"`)
          .sort_by("created_at", "desc")
          .max_results(500)
          .execute();

        return {
          name: folder.name,
          path: folder.path,
          photos: resources.map((r: { public_id: string; secure_url: string; width: number; height: number }) => ({
            id: r.public_id,
            url: r.secure_url,
            width: r.width,
            height: r.height,
          })),
        };
      })
    );

    return NextResponse.json(
      events.filter((event: { photos: unknown[] }) => event.photos.length > 0)
    );
  } catch (err) {
    // Log the real cause (missing/invalid Cloudinary credentials, network…)
    // so it shows up in the Vercel function logs instead of failing silently.
    console.error("GET /api/gallery failed:", err);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}
