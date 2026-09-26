import path from "node:path";

/** Directory where admin-uploaded images are stored. Mount a volume here in production. */
export function uploadDir() {
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./uploads");
}

export const UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(UPLOAD_TYPES).map(([mime, ext]) => [ext, mime]),
);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
