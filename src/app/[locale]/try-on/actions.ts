"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db/client";
import { designImages, designs, nailLengthValues, nailShapeValues, tryOnSessions } from "@/db/schema";
import { getMediaBucket, MEDIA_URL_PREFIX, putMedia } from "@/lib/media";
import { buildTryOnPrompt } from "@/lib/try-on/prompt";
import { generateTryOnImage } from "@/lib/try-on/gemini-client";

const runSchema = z.object({
  designId: z.string().min(1),
  shape: z.enum(nailShapeValues),
  length: z.enum(nailLengthValues),
});

export type RunTryOnResult =
  | { ok: true; id: string; resultUrl: string; handPhotoUrl: string }
  | { ok: false; error: string };

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  return Buffer.from(buf).toString("base64");
}

export async function runTryOn(formData: FormData): Promise<RunTryOnResult> {
  const parsed = runSchema.safeParse({
    designId: formData.get("designId"),
    shape: formData.get("shape"),
    length: formData.get("length"),
  });
  const handPhoto = formData.get("handPhoto");
  if (!parsed.success || !(handPhoto instanceof File) || handPhoto.size === 0) {
    return { ok: false, error: "invalid_input" };
  }
  const { designId, shape, length } = parsed.data;

  const db = await getDb();
  const [design] = await db.select().from(designs).where(eq(designs.id, designId)).limit(1);
  if (!design) return { ok: false, error: "design_not_found" };

  const [firstImage] = await db
    .select()
    .from(designImages)
    .where(eq(designImages.designId, designId))
    .orderBy(designImages.sortOrder)
    .limit(1);

  let designReference: { mimeType: string; base64: string } | undefined;
  if (firstImage) {
    const bucket = await getMediaBucket();
    const object = await bucket.get(firstImage.url.replace(MEDIA_URL_PREFIX, ""));
    if (object) {
      const buf = await object.arrayBuffer();
      designReference = {
        mimeType: object.httpMetadata?.contentType ?? "image/jpeg",
        base64: Buffer.from(buf).toString("base64"),
      };
    }
  }

  const prompt = buildTryOnPrompt({
    designName: design.nameEn,
    designDescription: design.descriptionEn,
    hasReferenceImage: !!designReference,
    shape,
    length,
  });

  const { env } = await getCloudflareContext({ async: true });
  const sessionId = randomUUID();
  const handPhotoUrl = await putMedia(`try-on/${sessionId}-hand.jpg`, handPhoto, "image/jpeg");

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.startsWith("REPLACE_ME")) {
    await db.insert(tryOnSessions).values({
      id: sessionId,
      designId,
      shape,
      length,
      handPhotoUrl,
      status: "failed",
      errorMessage: "missing_api_key",
    });
    return { ok: false, error: "missing_api_key" };
  }

  const handBase64 = await fileToBase64(handPhoto);
  const result = await generateTryOnImage({
    apiKey: env.GEMINI_API_KEY,
    prompt,
    handPhoto: { mimeType: handPhoto.type || "image/jpeg", base64: handBase64 },
    designReference,
  });

  if (!result.ok) {
    await db.insert(tryOnSessions).values({
      id: sessionId,
      designId,
      shape,
      length,
      handPhotoUrl,
      status: "failed",
      errorMessage: result.error,
    });
    return { ok: false, error: result.error };
  }

  const resultBytes = Uint8Array.from(atob(result.image.base64), (c) => c.charCodeAt(0));
  const resultUrl = await putMedia(
    `try-on/${sessionId}-result.jpg`,
    resultBytes.buffer as ArrayBuffer,
    result.image.mimeType,
  );

  await db.insert(tryOnSessions).values({
    id: sessionId,
    designId,
    shape,
    length,
    handPhotoUrl,
    resultImageUrl: resultUrl,
    status: "completed",
  });

  return { ok: true, id: sessionId, resultUrl, handPhotoUrl };
}
