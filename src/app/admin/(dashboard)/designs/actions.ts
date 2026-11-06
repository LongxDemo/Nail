"use server";

import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { designCategories, designImages, designs, nailShapeValues } from "@/db/schema";
import { getMediaBucket, MEDIA_URL_PREFIX, putMedia } from "@/lib/media";

const designSchema = z.object({
  categoryId: z.string().min(1),
  nameEn: z.string().trim().min(1),
  nameKm: z.string().trim().min(1),
  descriptionEn: z.string().trim().min(1),
  descriptionKm: z.string().trim().optional(),
  shape: z.enum(nailShapeValues),
  priceDollars: z.coerce.number().min(0),
  swatchHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isPopular: z.boolean(),
  isActive: z.boolean(),
});

function parseDesignForm(formData: FormData) {
  return designSchema.safeParse({
    categoryId: formData.get("categoryId"),
    nameEn: formData.get("nameEn"),
    nameKm: formData.get("nameKm"),
    descriptionEn: formData.get("descriptionEn"),
    descriptionKm: formData.get("descriptionKm") || undefined,
    shape: formData.get("shape"),
    priceDollars: formData.get("price"),
    swatchHex: formData.get("swatchHex"),
    isPopular: formData.get("isPopular") === "on",
    isActive: formData.get("isActive") === "on",
  });
}

export async function createCategory(formData: FormData): Promise<void> {
  const nameEn = formData.get("nameEn");
  const nameKm = formData.get("nameKm");
  if (typeof nameEn !== "string" || !nameEn.trim() || typeof nameKm !== "string" || !nameKm.trim()) {
    return;
  }

  const db = await getDb();
  await db.insert(designCategories).values({
    id: randomUUID(),
    nameEn: nameEn.trim(),
    nameKm: nameKm.trim(),
    sortOrder: 0,
  });

  revalidatePath("/admin/designs");
}

export async function createDesign(formData: FormData): Promise<void> {
  const parsed = parseDesignForm(formData);
  if (!parsed.success) return;

  const db = await getDb();
  await db.insert(designs).values({
    id: randomUUID(),
    categoryId: parsed.data.categoryId,
    nameEn: parsed.data.nameEn,
    nameKm: parsed.data.nameKm,
    descriptionEn: parsed.data.descriptionEn,
    descriptionKm: parsed.data.descriptionKm ?? null,
    shape: parsed.data.shape,
    priceCents: Math.round(parsed.data.priceDollars * 100),
    swatchHex: parsed.data.swatchHex,
    isPopular: parsed.data.isPopular,
    isActive: parsed.data.isActive,
  });

  revalidatePath("/admin/designs");
  revalidatePath("/gallery");
  redirect("/admin/designs");
}

export async function updateDesign(designId: string, formData: FormData): Promise<void> {
  const parsed = parseDesignForm(formData);
  if (!parsed.success) return;

  const db = await getDb();
  await db
    .update(designs)
    .set({
      categoryId: parsed.data.categoryId,
      nameEn: parsed.data.nameEn,
      nameKm: parsed.data.nameKm,
      descriptionEn: parsed.data.descriptionEn,
      descriptionKm: parsed.data.descriptionKm ?? null,
      shape: parsed.data.shape,
      priceCents: Math.round(parsed.data.priceDollars * 100),
      swatchHex: parsed.data.swatchHex,
      isPopular: parsed.data.isPopular,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(designs.id, designId));

  revalidatePath("/admin/designs");
  revalidatePath(`/admin/designs/${designId}`);
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${designId}`);
}

export async function deleteDesign(designId: string): Promise<void> {
  const db = await getDb();
  try {
    await db.delete(designs).where(eq(designs.id, designId));
    revalidatePath("/admin/designs");
    revalidatePath("/gallery");
  } catch {
    // Design is referenced by existing bookings/try-on sessions; deactivate instead.
    await db.update(designs).set({ isActive: false }).where(eq(designs.id, designId));
    revalidatePath("/admin/designs");
  }
}

export async function addDesignImage(designId: string, formData: FormData): Promise<void> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return;

  const db = await getDb();
  const imageId = randomUUID();
  const url = await putMedia(`designs/${designId}/${imageId}.jpg`, file, "image/jpeg");
  const [{ total }] = await db
    .select({ total: count() })
    .from(designImages)
    .where(eq(designImages.designId, designId));

  await db.insert(designImages).values({
    id: imageId,
    designId,
    url,
    sortOrder: total + 1,
  });

  revalidatePath(`/admin/designs/${designId}`);
  revalidatePath(`/gallery/${designId}`);
}

export async function deleteDesignImage(imageId: string, designId: string): Promise<void> {
  const db = await getDb();
  const [image] = await db.select().from(designImages).where(eq(designImages.id, imageId)).limit(1);
  if (image) {
    const bucket = await getMediaBucket();
    await bucket.delete(image.url.replace(MEDIA_URL_PREFIX, ""));
    await db.delete(designImages).where(eq(designImages.id, imageId));
  }

  revalidatePath(`/admin/designs/${designId}`);
  revalidatePath(`/gallery/${designId}`);
}
