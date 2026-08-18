// ============================================================================
// localStorage-backed "interested" list
// ============================================================================

import type { RecommendationFilters, RecommendedEvent, TasteProfile } from '../types';

const KEY = 'concertmatch.interested.v1';
const SESSION_KEY = 'concertmatch.session.v1';

export function loadInterested(): RecommendedEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecommendedEvent[]) : [];
  } catch {
    return [];
  }
}

export function loadSession(): { profile: TasteProfile; filters: RecommendationFilters } | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as {
      profile?: TasteProfile; filters?: RecommendationFilters;
    } | null;
    if (!value?.profile || !Array.isArray(value.profile.topArtists) || !value.filters?.location) return null;
    return { profile: value.profile, filters: value.filters };
  } catch {
    return null;
  }
}

export function saveSession(profile: TasteProfile, filters: RecommendationFilters): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ profile, filters }));
  } catch {
    // The current session still works when browser persistence is unavailable.
  }
}

export function clearSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* unavailable storage */ }
}

export function saveInterested(events: RecommendedEvent[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    // Storage full or unavailable (private mode) — fail silently.
  }
}

export function toggleInterested(
  current: RecommendedEvent[],
  event: RecommendedEvent,
): RecommendedEvent[] {
  const exists = current.some((e) => e.id === event.id);
  const next = exists
    ? current.filter((e) => e.id !== event.id)
    : [...current, event];
  saveInterested(next);
  return next;
}
