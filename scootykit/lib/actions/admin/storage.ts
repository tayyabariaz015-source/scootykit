import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, { ext: string; check: (b: Uint8Array) => boolean }> = {
  "image/jpeg": { ext: "jpg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": {
    ext: "webp",
    check: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
  "image/avif": { ext: "avif", check: (b) => String.fromCharCode(...b.slice(4, 12)).startsWith("ftypavi") },
};

/**
 * Validates (declared type, size AND magic bytes) then uploads an image to the
 * public product-images bucket. Storage RLS additionally requires is_admin().
 */
export async function uploadImageFile(
  supabase: SupabaseClient,
  file: File,
  folder: string,
): Promise<{ url: string; path: string } | { error: string }> {
  const type = TYPES[file.type];
  if (!type) return { error: "Only JPG, PNG, WebP or AVIF images are allowed" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be 5 MB or smaller" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length < 12 || !type.check(bytes)) return { error: "File content doesn't match its image type" };

  const path = `${folder}/${crypto.randomUUID()}.${type.ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[storage:upload]", error);
    return { error: "Upload failed" };
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeStorageObjects(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error("[storage:remove]", error);
}
