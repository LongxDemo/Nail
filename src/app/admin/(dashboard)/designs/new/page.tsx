import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { designCategories } from "@/db/schema";
import { DesignForm } from "@/components/admin/design-form";
import { createDesign } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDesignPage() {
  const db = await getDb();
  const categories = await db
    .select({ id: designCategories.id, nameEn: designCategories.nameEn })
    .from(designCategories)
    .orderBy(asc(designCategories.sortOrder));

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl text-brand-900">Add design</h1>
      <DesignForm action={createDesign} categories={categories} submitLabel="Create design" />
    </div>
  );
}
