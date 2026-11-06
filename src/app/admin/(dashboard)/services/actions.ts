"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { services, technicians } from "@/db/schema";

const serviceSchema = z.object({
  nameEn: z.string().trim().min(1),
  nameKm: z.string().trim().min(1),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  priceDollars: z.coerce.number().min(0),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean(),
});

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameKm: formData.get("nameKm"),
    durationMinutes: formData.get("durationMinutes"),
    priceDollars: formData.get("price"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
}

export async function createService(formData: FormData): Promise<void> {
  const parsed = parseServiceForm(formData);
  if (!parsed.success) return;

  const db = await getDb();
  await db.insert(services).values({
    id: randomUUID(),
    nameEn: parsed.data.nameEn,
    nameKm: parsed.data.nameKm,
    durationMinutes: parsed.data.durationMinutes,
    priceCents: Math.round(parsed.data.priceDollars * 100),
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  });

  revalidatePath("/admin/services");
  revalidatePath("/booking");
}

export async function updateService(serviceId: string, formData: FormData): Promise<void> {
  const parsed = parseServiceForm(formData);
  if (!parsed.success) return;

  const db = await getDb();
  await db
    .update(services)
    .set({
      nameEn: parsed.data.nameEn,
      nameKm: parsed.data.nameKm,
      durationMinutes: parsed.data.durationMinutes,
      priceCents: Math.round(parsed.data.priceDollars * 100),
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    })
    .where(eq(services.id, serviceId));

  revalidatePath("/admin/services");
  revalidatePath("/booking");
}

export async function deleteService(serviceId: string): Promise<void> {
  const db = await getDb();
  try {
    await db.delete(services).where(eq(services.id, serviceId));
  } catch {
    // Service is referenced by existing bookings; hide instead of deleting.
    await db.update(services).set({ isActive: false }).where(eq(services.id, serviceId));
  }
  revalidatePath("/admin/services");
  revalidatePath("/booking");
}

const technicianSchema = z.object({
  name: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean(),
});

function parseTechnicianForm(formData: FormData) {
  return technicianSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
}

export async function createTechnician(formData: FormData): Promise<void> {
  const parsed = parseTechnicianForm(formData);
  if (!parsed.success) return;

  const db = await getDb();
  await db.insert(technicians).values({
    id: randomUUID(),
    name: parsed.data.name,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  });

  revalidatePath("/admin/services");
  revalidatePath("/booking");
}

export async function updateTechnician(technicianId: string, formData: FormData): Promise<void> {
  const parsed = parseTechnicianForm(formData);
  if (!parsed.success) return;

  const db = await getDb();
  await db
    .update(technicians)
    .set({
      name: parsed.data.name,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    })
    .where(eq(technicians.id, technicianId));

  revalidatePath("/admin/services");
  revalidatePath("/booking");
}

export async function deleteTechnician(technicianId: string): Promise<void> {
  const db = await getDb();
  try {
    await db.delete(technicians).where(eq(technicians.id, technicianId));
  } catch {
    // Technician is referenced by existing bookings/schedule blocks; hide instead of deleting.
    await db.update(technicians).set({ isActive: false }).where(eq(technicians.id, technicianId));
  }
  revalidatePath("/admin/services");
  revalidatePath("/booking");
}
