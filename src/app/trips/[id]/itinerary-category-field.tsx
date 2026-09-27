import { ITINERARY_CATEGORIES } from "@/lib/itinerary";

// Dropdown kategori agenda (dipakai form tambah & ubah).
// Emoji di <option> tampil baik di select bawaan HP — tanpa dependensi ikon.

const inputClass =
  "h-11 rounded-md border-2 border-border-strong bg-surface px-3 text-[16px] font-normal outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25";

export function ItineraryCategoryField({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg">
      Kategori
      <select name="category" defaultValue={defaultValue} className={inputClass}>
        {ITINERARY_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.icon} {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
