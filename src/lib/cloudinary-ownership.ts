import "server-only";
import { siteConfig } from "@/config";

/** Reject path traversal and control characters in Cloudinary folder names. */
export function sanitizeCloudinaryFolder(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (
    !normalized ||
    normalized.length > 255 ||
    normalized.split("/").some((part) => !part || part === "." || part === "..") ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function isWithin(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}/`);
}

/** True only for folders beneath this meeting's gallery or app-data roots. */
export function isOwnedCloudinaryFolder(value: unknown): value is string {
  const folder = sanitizeCloudinaryFolder(value);
  if (!folder) return false;
  return [siteConfig.cloudinary.meetingFolder, siteConfig.cloudinary.galleryFolder].some(
    (root) => isWithin(root, folder)
  );
}

/** True only for public IDs beneath a folder this meeting owns. */
export function isOwnedCloudinaryPublicId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const id = value.trim().replace(/^\/+|\/+$/g, "");
  if (!id || id.includes("\\") || id.split("/").some((part) => part === "." || part === "..")) {
    return false;
  }
  return isOwnedCloudinaryFolder(id);
}