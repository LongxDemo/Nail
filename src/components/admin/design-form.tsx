const SHAPES = ["round", "oval", "almond", "square", "coffin", "stiletto"] as const;

type Category = { id: string; nameEn: string };

export function DesignForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  initial?: {
    categoryId: string;
    nameEn: string;
    nameKm: string;
    descriptionEn: string | null;
    descriptionKm: string | null;
    shape: string;
    priceCents: number;
    swatchHex: string;
    isPopular: boolean;
    isActive: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">Category</label>
        <select
          name="categoryId"
          defaultValue={initial?.categoryId}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nameEn}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">Name (English)</label>
          <input
            type="text"
            name="nameEn"
            defaultValue={initial?.nameEn}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">Name (Khmer)</label>
          <input
            type="text"
            name="nameKm"
            defaultValue={initial?.nameKm}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Description (English)
          </label>
          <textarea
            name="descriptionEn"
            defaultValue={initial?.descriptionEn ?? ""}
            rows={2}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Description (Khmer)
          </label>
          <textarea
            name="descriptionKm"
            defaultValue={initial?.descriptionKm ?? ""}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">Price (USD)</label>
          <input
            type="number"
            name="price"
            step="0.01"
            min="0"
            defaultValue={initial ? (initial.priceCents / 100).toFixed(2) : undefined}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">Nail shape</label>
          <select
            name="shape"
            defaultValue={initial?.shape ?? "oval"}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 capitalize"
          >
            {SHAPES.map((shape) => (
              <option key={shape} value={shape} className="capitalize">
                {shape}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">Swatch color</label>
          <input
            type="color"
            name="swatchHex"
            defaultValue={initial?.swatchHex ?? "#f08aa3"}
            className="h-10 w-full rounded-lg border border-border bg-background px-1 py-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
          Active (visible in gallery)
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground/80">
          <input type="checkbox" name="isPopular" defaultChecked={initial?.isPopular ?? false} />
          Mark as Popular
        </label>
      </div>

      <button
        type="submit"
        className="self-start rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
      >
        {submitLabel}
      </button>
    </form>
  );
}
