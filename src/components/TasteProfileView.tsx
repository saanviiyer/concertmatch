import type { TasteProfile } from '../types';
import { Cover } from './Cover';

interface Props {
  profile: TasteProfile;
}

/** Shows top artists, top genres, and "you might like" adjacent artists. */
export function TasteProfileView({ profile }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Your taste profile</h3>
        <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-medium text-brand-400">
          source: {profile.source}
        </span>
      </div>

      {/* Top artists */}
      <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Top artists
      </h4>
      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
        {profile.topArtists.map((a) => (
          <div key={a.id} className="w-24 shrink-0 text-center">
            <Cover
              seed={a.name}
              imageUrl={a.imageUrl}
              className="h-24 w-24 rounded-xl"
            />
            <p className="mt-2 truncate text-xs text-gray-300" title={a.name}>
              {a.name}
            </p>
          </div>
        ))}
      </div>

      {/* Top genres */}
      <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Top genres
      </h4>
      <div className="mt-3 flex flex-wrap gap-2">
        {profile.topGenres.map((g) => (
          <span
            key={g.genre}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200"
          >
            {g.genre}
            <span className="ml-1.5 text-xs text-gray-500">×{g.weight}</span>
          </span>
        ))}
      </div>

      {/* Adjacent artists */}
      {profile.adjacentArtists.length > 0 && (
        <>
          <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-400">
            You might like
          </h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.adjacentArtists.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <Cover seed={a.name} className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{a.name}</p>
                  <p className="truncate text-xs text-gray-400">{a.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
