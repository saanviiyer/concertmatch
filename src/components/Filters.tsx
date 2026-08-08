import type { RecommendationFilters } from '../types';

interface Props {
  filters: RecommendationFilters;
  cities: string[];
  onChange: (next: RecommendationFilters) => void;
}

/** City / radius / date range / max price controls. */
export function Filters({ filters, cities, onChange }: Props) {
  const set = (patch: Partial<RecommendationFilters>) =>
    onChange({ ...filters, ...patch });

  const setLocation = (patch: Partial<RecommendationFilters['location']>) =>
    onChange({ ...filters, location: { ...filters.location, ...patch } });

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-400">City</span>
        <select
          value={filters.location.city}
          onChange={(e) => setLocation({ city: e.target.value })}
          className="rounded-lg border border-white/10 bg-[#14141d] px-3 py-2 text-white outline-none focus:border-brand-500"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-400">Radius: {filters.location.radiusMiles} mi</span>
        <input
          type="range"
          min={5}
          max={200}
          step={5}
          value={filters.location.radiusMiles}
          onChange={(e) => setLocation({ radiusMiles: Number(e.target.value) })}
          className="mt-2 accent-brand-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-400">From</span>
        <input
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => set({ startDate: e.target.value || undefined })}
          className="rounded-lg border border-white/10 bg-[#14141d] px-3 py-2 text-white outline-none focus:border-brand-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-400">To</span>
        <input
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => set({ endDate: e.target.value || undefined })}
          className="rounded-lg border border-white/10 bg-[#14141d] px-3 py-2 text-white outline-none focus:border-brand-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-gray-400">
          Max price: {filters.maxPrice != null ? `$${filters.maxPrice}` : 'any'}
        </span>
        <input
          type="range"
          min={0}
          max={400}
          step={10}
          value={filters.maxPrice ?? 400}
          onChange={(e) => {
            const v = Number(e.target.value);
            set({ maxPrice: v >= 400 ? undefined : v });
          }}
          className="mt-2 accent-brand-500"
        />
      </label>
    </div>
  );
}
