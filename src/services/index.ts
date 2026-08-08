// ============================================================================
// Adapter factory — the single place mock <-> real is chosen.
// ----------------------------------------------------------------------------
// Selection is driven by env vars (VITE_MUSIC_ADAPTER / VITE_EVENTS_ADAPTER).
// Default is "mock" so the app runs with zero configuration.
//
// To go live:
//   1. Set the relevant VITE_* keys in .env (see .env.example).
//   2. Set VITE_MUSIC_ADAPTER=spotify (or ytmusic) / VITE_EVENTS_ADAPTER=ticketmaster.
//   3. Fill in the TODO bodies in the corresponding adapter class.
// ============================================================================

import {
  MockMusicAdapter,
  SpotifyMusicAdapter,
  YTMusicAdapter,
  type MusicAdapter,
} from './musicAdapter';
import {
  MockEventsAdapter,
  TicketmasterEventsAdapter,
  type EventsAdapter,
} from './ticketmasterAdapter';

export * from './musicAdapter';
export * from './ticketmasterAdapter';
export * from './recommender';

const MUSIC_CHOICE = (import.meta.env.VITE_MUSIC_ADAPTER as string) || 'mock';
const EVENTS_CHOICE = (import.meta.env.VITE_EVENTS_ADAPTER as string) || 'mock';

/** Return the configured music adapter, falling back to mock if unconfigured. */
export function getMusicAdapter(choice = MUSIC_CHOICE): MusicAdapter {
  switch (choice) {
    case 'spotify': {
      const a = new SpotifyMusicAdapter();
      return a.isConfigured() ? a : new MockMusicAdapter();
    }
    case 'ytmusic': {
      const a = new YTMusicAdapter();
      return a.isConfigured() ? a : new MockMusicAdapter();
    }
    case 'mock':
    default:
      return new MockMusicAdapter();
  }
}

/** Return the configured events adapter, falling back to mock if unconfigured. */
export function getEventsAdapter(choice = EVENTS_CHOICE): EventsAdapter {
  switch (choice) {
    case 'ticketmaster': {
      const a = new TicketmasterEventsAdapter();
      return a.isConfigured() ? a : new MockEventsAdapter();
    }
    case 'mock':
    default:
      return new MockEventsAdapter();
  }
}

/** True when the app is running purely on mock data (used for the UI banner). */
export function isMockMode(): boolean {
  return getMusicAdapter().id === 'mock' && getEventsAdapter().id === 'mock';
}
