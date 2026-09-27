import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { isAuthorized } from "@/lib/auth";
import { siteConfig } from "@/config";
import { sanitizeCloudinaryFolder } from "@/lib/cloudinary-ownership";

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const folderName = sanitizeCloudinaryFolder(name);
  if (!folderName) return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });

  const folder = `${siteConfig.cloudinary.galleryFolder}/${folderName}`;
  try {
    await cloudinary.api.create_folder(folder);
    return NextResponse.json({ success: true, folder });
  } catch {
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
