import { getCloudflareContext } from "@opennextjs/cloudflare";

export const MEDIA_URL_PREFIX = "/api/media/";

export async function getMediaBucket() {
  const { env } = await getCloudflareContext({ async: true });
  return env.MEDIA_BUCKET;
}

export async function putMedia(key: string, data: Blob | ArrayBuffer, contentType: string) {
  const bucket = await getMediaBucket();
  await bucket.put(key, data, { httpMetadata: { contentType } });
  return `${MEDIA_URL_PREFIX}${key}`;
}
