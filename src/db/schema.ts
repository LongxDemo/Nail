import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey();
const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const customers = sqliteTable(
  "customers",
  {
    id: id(),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    preferredLanguage: text("preferred_language", { enum: ["en", "km"] })
      .notNull()
      .default("en"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("customers_phone_idx").on(table.phone)],
);

export const designCategories = sqliteTable("design_categories", {
  id: id(),
  nameEn: text("name_en").notNull(),
  nameKm: text("name_km").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const nailShapeValues = [
  "round",
  "oval",
  "almond",
  "square",
  "coffin",
  "stiletto",
] as const;

export const designs = sqliteTable(
  "designs",
  {
    id: id(),
    categoryId: text("category_id")
      .notNull()
      .references(() => designCategories.id),
    nameEn: text("name_en").notNull(),
    nameKm: text("name_km").notNull(),
    descriptionEn: text("description_en"),
    descriptionKm: text("description_km"),
    shape: text("shape", { enum: nailShapeValues }).notNull().default("oval"),
    // Stored in the smallest currency unit (e.g. cents) to avoid float rounding.
    priceCents: integer("price_cents").notNull(),
    // Fallback color used for the gallery placeholder and the v1 try-on overlay
    // until a real design photo is uploaded.
    swatchHex: text("swatch_hex").notNull().default("#f08aa3"),
    isPopular: integer("is_popular", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("designs_category_idx").on(table.categoryId)],
);

export const designImages = sqliteTable(
  "design_images",
  {
    id: id(),
    designId: text("design_id")
      .notNull()
      .references(() => designs.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("design_images_design_idx").on(table.designId)],
);

export const services = sqliteTable("services", {
  id: id(),
  nameEn: text("name_en").notNull(),
  nameKm: text("name_km").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  priceCents: integer("price_cents").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const technicians = sqliteTable("technicians", {
  id: id(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

// A blocked time range -- a break, holiday afternoon, equipment downtime, etc.
// technicianId null means it blocks the whole salon (e.g. lunch break);
// otherwise it only blocks that one technician.
export const scheduleBlocks = sqliteTable(
  "schedule_blocks",
  {
    id: id(),
    date: text("date").notNull(), // YYYY-MM-DD
    startTime: text("start_time").notNull(), // HH:MM
    endTime: text("end_time").notNull(), // HH:MM
    technicianId: text("technician_id").references(() => technicians.id),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (table) => [index("schedule_blocks_date_idx").on(table.date)],
);

export const bookingStatusValues = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const bookings = sqliteTable(
  "bookings",
  {
    id: id(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
    designId: text("design_id").references(() => designs.id),
    technicianId: text("technician_id").references(() => technicians.id),
    note: text("note"),
    // Stored as plain calendar date / time-of-day strings (not timestamps) since
    // they represent a salon-local wall-clock slot, not an instant.
    date: text("date").notNull(), // YYYY-MM-DD
    startTime: text("start_time").notNull(), // HH:MM, 24h
    endTime: text("end_time").notNull(), // HH:MM, 24h -- derived from service duration
    status: text("status", { enum: bookingStatusValues })
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("bookings_customer_idx").on(table.customerId),
    index("bookings_date_idx").on(table.date),
    index("bookings_technician_idx").on(table.technicianId),
  ],
);

export const workingHours = sqliteTable(
  "working_hours",
  {
    id: id(),
    // 0 = Sunday ... 6 = Saturday
    dayOfWeek: integer("day_of_week").notNull(),
    openTime: text("open_time").notNull(), // HH:MM
    closeTime: text("close_time").notNull(), // HH:MM
    isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [uniqueIndex("working_hours_day_idx").on(table.dayOfWeek)],
);

export const closedDates = sqliteTable(
  "closed_dates",
  {
    id: id(),
    date: text("date").notNull(), // YYYY-MM-DD
    reason: text("reason"),
  },
  (table) => [uniqueIndex("closed_dates_date_idx").on(table.date)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: id(),
    customerId: text("customer_id").references(() => customers.id),
    bookingId: text("booking_id").references(() => bookings.id),
    rating: integer("rating").notNull(), // 1-5
    comment: text("comment"),
    isApproved: integer("is_approved", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
  },
  (table) => [index("reviews_approved_idx").on(table.isApproved)],
);

export const reviewPhotos = sqliteTable(
  "review_photos",
  {
    id: id(),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
  },
  (table) => [index("review_photos_review_idx").on(table.reviewId)],
);

export const nailLengthValues = ["short", "medium", "long"] as const;
export const tryOnStatusValues = ["completed", "failed"] as const;

export const tryOnSessions = sqliteTable(
  "try_on_sessions",
  {
    id: id(),
    customerId: text("customer_id").references(() => customers.id),
    designId: text("design_id")
      .notNull()
      .references(() => designs.id),
    shape: text("shape", { enum: nailShapeValues }).notNull(),
    length: text("length", { enum: nailLengthValues }).notNull(),
    handPhotoUrl: text("hand_photo_url").notNull(),
    resultImageUrl: text("result_image_url"),
    status: text("status", { enum: tryOnStatusValues }).notNull(),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
  },
  (table) => [index("try_on_sessions_design_idx").on(table.designId)],
);

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["owner", "staff"] })
      .notNull()
      .default("owner"),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("admin_users_email_idx").on(table.email)],
);
