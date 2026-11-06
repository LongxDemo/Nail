import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const PBKDF2_ITERATIONS = 100_000;

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

function sqlStr(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

const ADMIN_EMAIL = "owner@bloomnailstudio.test";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";

const now = Math.floor(Date.now() / 1000);
const statements = [];

// --- Admin user ---
const adminId = randomUUID();
const adminHash = await hashPassword(ADMIN_PASSWORD);
statements.push(
  `INSERT INTO admin_users (id, email, password_hash, role, created_at) VALUES (${sqlStr(adminId)}, ${sqlStr(ADMIN_EMAIL)}, ${sqlStr(adminHash)}, 'owner', ${now});`,
);

// --- Design categories ---
// Khmer names are placeholder transliterations -- have a native speaker review
// before launch; easy to edit later from the admin panel.
const categories = [
  { key: "gel", nameEn: "Gel", nameKm: "ជែល", sortOrder: 0 },
  { key: "acrylic", nameEn: "Acrylic", nameKm: "អាក្រីលិក", sortOrder: 1 },
  { key: "french", nameEn: "French", nameKm: "បារាំង", sortOrder: 2 },
  { key: "nailart", nameEn: "Nail Art", nameKm: "សិល្បៈលើក្រចក", sortOrder: 3 },
  { key: "simple", nameEn: "Simple", nameKm: "សាមញ្ញ", sortOrder: 4 },
];
const categoryIds = {};
for (const c of categories) {
  const id = randomUUID();
  categoryIds[c.key] = id;
  statements.push(
    `INSERT INTO design_categories (id, name_en, name_km, sort_order) VALUES (${sqlStr(id)}, ${sqlStr(c.nameEn)}, ${sqlStr(c.nameKm)}, ${c.sortOrder});`,
  );
}

// --- Designs ---
const designs = [
  { cat: "simple", nameEn: "Soft Pink Classic", descEn: "A clean, soft pink single-coat finish.", price: 2000, hex: "#f7b3c4", shape: "oval", popular: false },
  { cat: "simple", nameEn: "Minimalist Nude", descEn: "Understated nude polish for everyday wear.", price: 1800, hex: "#e7cdb8", shape: "round", popular: false },
  { cat: "french", nameEn: "Classic French Tip", descEn: "Timeless white-tipped French manicure.", price: 2500, hex: "#fbeaef", shape: "squoval", popular: true },
  { cat: "french", nameEn: "Milky White French", descEn: "Soft milky base with a crisp white tip.", price: 2700, hex: "#f3e9e4", shape: "almond", popular: false },
  { cat: "gel", nameEn: "Glossy Blush Gel", descEn: "Long-lasting glossy blush gel polish.", price: 3000, hex: "#e35c85", shape: "oval", popular: true },
  { cat: "gel", nameEn: "Ombre Sunset Gel", descEn: "Pink-to-orange ombre gel gradient.", price: 3500, hex: "#f08a5c", shape: "almond", popular: false },
  { cat: "acrylic", nameEn: "Almond Acrylic Set", descEn: "Full acrylic set in an almond shape.", price: 4500, hex: "#e8c3a3", shape: "almond", popular: true },
  { cat: "acrylic", nameEn: "Coffin Acrylic Set", descEn: "Full acrylic set in a coffin shape.", price: 4800, hex: "#d9a679", shape: "coffin", popular: false },
  { cat: "nailart", nameEn: "Floral Accent", descEn: "Hand-painted floral accent nail design.", price: 4000, hex: "#c83f68", shape: "almond", popular: false },
  { cat: "nailart", nameEn: "Marble Swirl", descEn: "Delicate marble swirl nail art.", price: 4200, hex: "#a32e52", shape: "coffin", popular: false },
  { cat: "nailart", nameEn: "Crystal Gems", descEn: "Rhinestone and crystal embellished design.", price: 5000, hex: "#7e2440", shape: "stiletto", popular: true },
];
for (const d of designs) {
  const id = randomUUID();
  const shape = d.shape === "squoval" ? "square" : d.shape;
  statements.push(
    `INSERT INTO designs (id, category_id, name_en, name_km, description_en, description_km, shape, price_cents, swatch_hex, is_popular, is_active, created_at, updated_at) VALUES (${sqlStr(id)}, ${sqlStr(categoryIds[d.cat])}, ${sqlStr(d.nameEn)}, ${sqlStr(d.nameEn)}, ${sqlStr(d.descEn)}, ${sqlStr(d.descEn)}, ${sqlStr(shape)}, ${d.price}, ${sqlStr(d.hex)}, ${d.popular ? 1 : 0}, 1, ${now}, ${now});`,
  );
}

// --- Working hours: Mon closed, Tue-Sun 9:00 AM - 8:00 PM ---
for (let dow = 0; dow <= 6; dow++) {
  const id = randomUUID();
  const isClosed = dow === 1 ? 1 : 0; // 1 = Monday
  statements.push(
    `INSERT INTO working_hours (id, day_of_week, open_time, close_time, is_closed) VALUES (${sqlStr(id)}, ${dow}, '09:00', '20:00', ${isClosed});`,
  );
}

// --- Services ---
const services = [
  { nameEn: "Classic Manicure", nameKm: "ម៉ាញ៉ឺរីបុរាណ", duration: 30, price: 2000, sortOrder: 0 },
  { nameEn: "Gel Manicure", nameKm: "ម៉ាញ៉ឺរីជែល", duration: 45, price: 3000, sortOrder: 1 },
  { nameEn: "Acrylic Full Set", nameKm: "សំណុំអាក្រីលិកពេញ", duration: 90, price: 4500, sortOrder: 2 },
  { nameEn: "Gel Fill", nameKm: "បំពេញជែល", duration: 60, price: 2800, sortOrder: 3 },
  { nameEn: "Pedicure", nameKm: "ការថែទាំជើង", duration: 45, price: 2500, sortOrder: 4 },
];
for (const s of services) {
  const id = randomUUID();
  statements.push(
    `INSERT INTO services (id, name_en, name_km, duration_minutes, price_cents, is_active, sort_order) VALUES (${sqlStr(id)}, ${sqlStr(s.nameEn)}, ${sqlStr(s.nameKm)}, ${s.duration}, ${s.price}, 1, ${s.sortOrder});`,
  );
}

// --- Technicians ---
const technicians = ["Sophea", "Lina"];
for (const [i, name] of technicians.entries()) {
  const id = randomUUID();
  statements.push(
    `INSERT INTO technicians (id, name, is_active, sort_order) VALUES (${sqlStr(id)}, ${sqlStr(name)}, 1, ${i});`,
  );
}

// Written outside drizzle/ (the migrations_dir) so `wrangler d1 migrations apply`
// never picks this up as a schema migration -- it's applied separately, by hand.
await writeFile(new URL("./seed.sql", import.meta.url), statements.join("\n") + "\n");

console.log(`Wrote ${statements.length} seed statements to scripts/seed.sql`);
console.log(`Admin login -> email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
