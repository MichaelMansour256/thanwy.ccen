import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary credentials can be provided two ways:
 *  1. Explicit vars: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY +
 *     CLOUDINARY_API_SECRET (see .env.example).
 *  2. The combined CLOUDINARY_URL: cloudinary://<api_key>:<api_secret>@<cloud_name>
 *     (the SDK's standard env var — some setups only define this one).
 *
 * Without a cloud_name every Admin API call fails, which used to 500 the
 * /api/gallery route and empty /api/events + /api/invitations. Parse
 * CLOUDINARY_URL as a fallback so either setup works.
 */
const parsedCloudUrl = (process.env.CLOUDINARY_URL ?? "").match(
  /^cloudinary:\/\/([^:\s]+):([^@\s]+)@([^\s]+)$/
);

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || parsedCloudUrl?.[3],
  api_key: process.env.CLOUDINARY_API_KEY || parsedCloudUrl?.[1],
  api_secret: process.env.CLOUDINARY_API_SECRET || parsedCloudUrl?.[2],
});

export default cloudinary;
