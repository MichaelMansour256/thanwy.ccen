// Diagnoses the Cloudinary credentials in .env / .env.local by calling the
// Admin API (`root_folders`) — the exact call /api/gallery makes. Run:
//   node scripts/check-cloudinary.mjs
import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };

// Accept the combined CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud_name>)
// as a fallback, exactly like src/lib/cloudinary.ts does.
const parsedCloudUrl = (env.CLOUDINARY_URL || process.env.CLOUDINARY_URL || "").match(
  /^cloudinary:\/\/([^:\s]+):([^@\s]+)@([^\s]+)$/
);

const cloudName =
  env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  parsedCloudUrl?.[3];
const apiKey =
  env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || parsedCloudUrl?.[1];
const apiSecret =
  env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || parsedCloudUrl?.[2];

console.log("cloud_name :", cloudName ? `set (${cloudName})` : "MISSING");
console.log("api_key    :", apiKey ? `set (${apiKey.length} chars)` : "MISSING");
console.log("api_secret :", apiSecret ? `set (${apiSecret.length} chars)` : "MISSING");

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "-> Cannot test: set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
  );
  process.exit(1);
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

try {
  const { folders } = await cloudinary.api.root_folders();
  console.log(
    `OK — credentials work. Root folders (${folders.length}):`,
    folders.map((f) => f.name).join(", ") || "(none)"
  );
} catch (err) {
  console.error("FAILED —", err?.error?.message ?? err?.message ?? err);
  process.exit(1);
}
