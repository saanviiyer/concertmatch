// ============================================================================
// localStorage-backed "interested" list
// ============================================================================

import type { RecommendedEvent } from '../types';

const KEY = 'concertmatch.interested.v1';

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
