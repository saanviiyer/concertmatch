// ============================================================================
// Recommendation engine
// ----------------------------------------------------------------------------
// Pure functions: given a taste profile + raw candidate events, score and
// annotate each event with a match score and a human-readable "why".
// Adapter-agnostic — works identically for mock and real data.
// ============================================================================

import type {
  ConcertEvent,
  RecommendedEvent,
  TasteProfile,
} from '../types';

interface Scored {
  score: number;
  reason: string;
}

/** Score one event against the taste profile and explain why. */
function scoreEvent(event: ConcertEvent, profile: TasteProfile): Scored {
  const topArtistNames = new Set(
    profile.topArtists.map((a) => a.name.toLowerCase()),
  );
  const adjacentNames = new Set(
    profile.adjacentArtists.map((a) => a.name.toLowerCase()),
  );
  const artist = event.artistName.toLowerCase();

  // 1. Direct hit: the event is one of the user's top artists.
  if (topArtistNames.has(artist)) {
    return {
      score: 100,
      reason: `${event.artistName} is one of your top artists`,
    };
  }

  // 2. Adjacent artist: someone the profile says they might like.
  if (adjacentNames.has(artist)) {
    const adj = profile.adjacentArtists.find(
      (a) => a.name.toLowerCase() === artist,
    );
    return {
      score: 80,
      reason: adj?.reason ?? `Fans of your taste also like ${event.artistName}`,
    };
  }

  // 3. Genre overlap: the event artist shares genres with the profile.
  // (In mock data we only know genres for known artists; real adapters can
  // enrich candidate events with genre tags to widen this branch.)
  const topGenres = new Set(profile.topGenres.map((g) => g.genre));
  const eventGenres = inferGenresForArtist(event.artistName, profile);
  const shared = eventGenres.filter((g) => topGenres.has(g));
  if (shared.length > 0) {
    return {
      score: 50 + Math.min(shared.length * 10, 25),
      reason: `Matches your taste in ${shared.slice(0, 2).join(' & ')}`,
    };
  }

  // 4. Fallback: it is a live music event near you.
  return {
    score: 20,
    reason: 'Popular live show near you',
  };
}

/** Best-effort genre lookup for an event's artist from the profile's data. */
function inferGenresForArtist(name: string, profile: TasteProfile): string[] {
  const lower = name.toLowerCase();
  const fromTop = profile.topArtists.find((a) => a.name.toLowerCase() === lower);
  if (fromTop) return fromTop.genres;
  const fromAdj = profile.adjacentArtists.find(
    (a) => a.name.toLowerCase() === lower,
  );
  if (fromAdj) return fromAdj.genres;
  return [];
}

/**
 * Rank candidate events against a taste profile.
 * Returns recommendations sorted by match score (highest first), then date.
 */
export function recommendEvents(
  events: ConcertEvent[],
  profile: TasteProfile,
): RecommendedEvent[] {
  return events
    .map((event): RecommendedEvent => {
      const { score, reason } = scoreEvent(event, profile);
      return { ...event, matchScore: score, reason };
    })
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.date.localeCompare(b.date);
    });
}
