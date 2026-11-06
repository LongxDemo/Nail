import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { getDb } from "./client";
import {
  customers,
  designCategories,
  designImages,
  designs,
  reviewPhotos,
  reviews,
  services,
  technicians,
  workingHours,
} from "./schema";

type Db = Awaited<ReturnType<typeof getDb>>;

export async function listActiveServices(db: Db) {
  return db.select().from(services).where(eq(services.isActive, true)).orderBy(asc(services.sortOrder));
}

export async function listActiveTechnicians(db: Db) {
  return db
    .select()
    .from(technicians)
    .where(eq(technicians.isActive, true))
    .orderBy(asc(technicians.sortOrder));
}

export async function listCategories(db: Db) {
  return db
    .select()
    .from(designCategories)
    .orderBy(asc(designCategories.sortOrder));
}

export async function listDesigns(db: Db, categoryId?: string) {
  const conditions = [eq(designs.isActive, true)];
  if (categoryId) conditions.push(eq(designs.categoryId, categoryId));

  const items = await db
    .select()
    .from(designs)
    .where(and(...conditions))
    .orderBy(desc(designs.createdAt));

  if (items.length === 0) return items.map((d) => ({ ...d, imageUrl: null as string | null }));

  const images = await db
    .select()
    .from(designImages)
    .where(inArray(designImages.designId, items.map((d) => d.id)))
    .orderBy(asc(designImages.sortOrder));

  const firstImageByDesign = new Map<string, string>();
  for (const img of images) {
    if (!firstImageByDesign.has(img.designId)) firstImageByDesign.set(img.designId, img.url);
  }

  return items.map((d) => ({ ...d, imageUrl: firstImageByDesign.get(d.id) ?? null }));
}

export async function getDesignById(db: Db, id: string) {
  const [design] = await db
    .select()
    .from(designs)
    .where(eq(designs.id, id))
    .limit(1);
  if (!design) return null;

  const images = await db
    .select()
    .from(designImages)
    .where(eq(designImages.designId, id))
    .orderBy(asc(designImages.sortOrder));

  return { design, images };
}

export async function listWorkingHours(db: Db) {
  return db.select().from(workingHours).orderBy(asc(workingHours.dayOfWeek));
}

export async function listApprovedReviews(db: Db) {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      customerName: customers.name,
    })
    .from(reviews)
    .innerJoin(customers, eq(customers.id, reviews.customerId))
    .where(eq(reviews.isApproved, true))
    .orderBy(desc(reviews.createdAt));

  const photosByReview = new Map<string, string[]>();
  if (rows.length > 0) {
    const allPhotos = await db
      .select()
      .from(reviewPhotos)
      .where(inArray(reviewPhotos.reviewId, rows.map((r) => r.id)));
    for (const photo of allPhotos) {
      const list = photosByReview.get(photo.reviewId) ?? [];
      list.push(photo.url);
      photosByReview.set(photo.reviewId, list);
    }
  }

  return rows.map((row) => ({ ...row, photos: photosByReview.get(row.id) ?? [] }));
}
