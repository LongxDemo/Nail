"use server";

import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

const createAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  role: z.enum(["owner", "staff"]),
});

export async function createAdmin(formData: FormData): Promise<void> {
  const current = await getCurrentAdmin();
  if (current?.role !== "owner") return;

  const parsed = createAdminSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;

  const db = await getDb();
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, parsed.data.email))
    .limit(1);
  if (existing) return;

  await db.insert(adminUsers).values({
    id: randomUUID(),
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    role: parsed.data.role,
  });

  revalidatePath("/admin/team");
}

export async function deleteAdmin(adminId: string): Promise<void> {
  const current = await getCurrentAdmin();
  if (current?.role !== "owner") return;
  if (current.id === adminId) return;

  const db = await getDb();
  const [{ total }] = await db.select({ total: count() }).from(adminUsers);
  if (total <= 1) return;

  await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
  revalidatePath("/admin/team");
}
