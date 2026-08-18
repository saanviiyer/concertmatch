import { useState } from 'react';
import { getMusicAdapter } from '../services';

interface ConnectStepProps {
  loading: boolean;
  onConnect: (choice: string) => void;
  onManualConnect: (artists: string[], genres: string[]) => void;
}

const SOURCES: { choice: string; label: string; hint: string; icon: string }[] =
  [
    { choice: 'spotify', label: 'Connect Spotify', hint: 'Uses your top artists', icon: '🎧' },
    { choice: 'ytmusic', label: 'Connect YouTube Music', hint: 'Uses your subscriptions', icon: '▶️' },
    { choice: 'mock', label: 'Try the demo', hint: 'No account needed', icon: '✨' },
  ];

/** Step 1: pick a music source. Real sources fall back to mock if unconfigured. */
export function ConnectStep({ loading, onConnect, onManualConnect }: ConnectStepProps) {
  const [showManual, setShowManual] = useState(false);
  const [artists, setArtists] = useState('');
  const [genres, setGenres] = useState('');
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-bold text-white">Connect your music</h2>
      <p className="mt-3 text-gray-400">
        We read your top artists and genres, then find concerts you'll love
        nearby. Pick a source to start.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {SOURCES.map((s) => {
          const adapter = getMusicAdapter(s.choice);
          const willUseMock = s.choice !== 'mock' && adapter.id === 'mock';
          return (
            <button
              key={s.choice}
              disabled={loading}
              onClick={() => onConnect(s.choice)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-brand-500 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-4xl">{s.icon}</span>
              <span className="font-semibold text-white">{s.label}</span>
              <span className="text-xs text-gray-400">{s.hint}</span>
              {willUseMock && (
                <span className="mt-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                  demo data (no key set)
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
        <button
          type="button"
          aria-expanded={showManual}
          onClick={() => setShowManual((value) => !value)}
          className="w-full text-left font-semibold text-white"
        >
          {showManual ? '−' : '+'} Build my own taste profile
          <span className="ml-2 text-xs font-normal text-gray-400">No account or API key</span>
        </button>
        {showManual && (
          <form
            className="mt-4 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              onManualConnect(artists.split(','), genres.split(','));
            }}
          >
            <label className="text-sm text-gray-300">Favorite artists <span className="text-gray-500">(comma separated)</span>
              <textarea required value={artists} onChange={(event) => setArtists(event.target.value)} placeholder="Tame Impala, SZA, ODESZA" className="mt-1 block min-h-20 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-brand-500" />
            </label>
            <label className="text-sm text-gray-300">Favorite genres <span className="text-gray-500">(optional, improves discovery)</span>
              <input value={genres} onChange={(event) => setGenres(event.target.value)} placeholder="indie rock, r&b, electronic" className="mt-1 block w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-brand-500" />
            </label>
            <button disabled={loading || !artists.trim()} className="justify-self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50">Find my concerts</button>
          </form>
        )}
      </div>

      {loading && (
        <p className="mt-6 animate-pulse text-brand-400">
          Reading your taste profile…
        </p>
      )}
    </div>
  );
}
