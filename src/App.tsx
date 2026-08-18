import { useEffect, useMemo, useState } from 'react';
import type {
  RecommendationFilters,
  RecommendedEvent,
  TasteProfile,
} from './types';
import {
  getEventsAdapter,
  getMusicAdapter,
  isMockMode,
  recommendEvents,
} from './services';
import { clearSession, loadInterested, loadSession, saveSession, toggleInterested } from './lib/storage';
import { buildManualTasteProfile } from './services/musicAdapter';
import { ConnectStep } from './components/ConnectStep';
import { TasteProfileView } from './components/TasteProfileView';
import { Filters } from './components/Filters';
import { EventCard } from './components/EventCard';

const DEFAULT_FILTERS: RecommendationFilters = {
  location: { city: 'Los Angeles', radiusMiles: 50 },
  maxPrice: undefined,
};

export default function App() {
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [filters, setFilters] = useState<RecommendationFilters>(DEFAULT_FILTERS);
  const [events, setEvents] = useState<RecommendedEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [interested, setInterested] = useState<RecommendedEvent[]>([]);
  const [showInterested, setShowInterested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore the saved "interested" list on mount.
  useEffect(() => {
    setInterested(loadInterested());
    const session = loadSession();
    if (session) {
      setProfile(session.profile);
      setFilters(session.filters);
    }
  }, []);

  useEffect(() => {
    if (profile) saveSession(profile, filters);
  }, [profile, filters]);

  // Known cities from a probe query (empty filters => full mock catalog).
  const [cities, setCities] = useState<string[]>([]);
  useEffect(() => {
    const adapter = getEventsAdapter();
    if (adapter.id !== 'mock') {
      // City is a free-text field; avoid spending a live API request merely to
      // populate suggestions before the user has searched.
      setCities(['Austin', 'Chicago', 'Los Angeles', 'New York', 'San Francisco']);
      return;
    }
    adapter
      .searchEvents({ location: { city: '', radiusMiles: 200 } })
      .then((all) => {
        const set = new Set(all.map((e) => e.city));
        setCities([...set].sort());
      })
      .catch(() => setCities([]));
  }, []);

  async function handleConnect(choice: string) {
    setConnecting(true);
    setError(null);
    try {
      const adapter = getMusicAdapter(choice);
      const p = await adapter.getTasteProfile();
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read taste profile');
    } finally {
      setConnecting(false);
    }
  }

  function handleManualConnect(artists: string[], genres: string[]) {
    setError(null);
    try {
      setProfile(buildManualTasteProfile(artists, genres));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not build your profile');
    }
  }

  // Re-run recommendations whenever the profile or filters change.
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoadingEvents(true);
      setError(null);
      getEventsAdapter().searchEvents(filters)
      .then((raw) => {
        if (cancelled) return;
        setEvents(recommendEvents(raw, profile));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load events');
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [profile, filters]);

  const interestedIds = useMemo(
    () => new Set(interested.map((e) => e.id)),
    [interested],
  );

  function handleToggle(event: RecommendedEvent) {
    setInterested((cur) => toggleInterested(cur, event));
  }

  const visibleEvents = showInterested ? interested : events;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎫</span>
            <h1 className="text-xl font-bold text-white">
              Concert<span className="text-brand-400">Match</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isMockMode() && (
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                mock mode · no API keys needed
              </span>
            )}
            {profile && (
              <button
                onClick={() => {
                  clearSession();
                  setProfile(null);
                  setShowInterested(false);
                  setEvents([]);
                }}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Change profile
              </button>
            )}
            {profile && (
              <button
                onClick={() => setShowInterested((s) => !s)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
              >
                {showInterested ? 'Back to recommendations' : `Saved (${interested.length})`}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {error && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!profile ? (
          <ConnectStep loading={connecting} onConnect={handleConnect} onManualConnect={handleManualConnect} />
        ) : (
          <>
            {!showInterested && <TasteProfileView profile={profile} />}

            {!showInterested && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-white">
                  Find concerts
                </h3>
                <Filters
                  filters={filters}
                  cities={cities}
                  onChange={setFilters}
                />
              </div>
            )}

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {showInterested
                    ? `Your saved concerts (${interested.length})`
                    : `Recommended for you (${events.length})`}
                </h3>
                {loadingEvents && !showInterested && (
                  <span role="status" aria-live="polite" className="animate-pulse text-sm text-brand-400">
                    Loading events…
                  </span>
                )}
              </div>

              {visibleEvents.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-gray-400">
                  {showInterested
                    ? 'No saved concerts yet. Tap the heart on any card to save it.'
                    : 'No events match these filters. Try widening your date range, raising the price, or picking "All cities".'}
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      interested={interestedIds.has(event.id)}
                      onToggleInterested={handleToggle}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-gray-600">
        ConcertMatch · Recommendations from your music taste ·{' '}
        {isMockMode() ? 'running on mock data' : 'live APIs'}
      </footer>
    </div>
  );
}
