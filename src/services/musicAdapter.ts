// ============================================================================
// Music source adapter layer
// ----------------------------------------------------------------------------
// Every music source (Spotify, YouTube Music, the mock) implements the same
// `MusicAdapter` interface. The rest of the app only ever talks to this
// interface, so swapping mock -> real is a one-line change (see getMusicAdapter
// in ./index.ts and the VITE_MUSIC_ADAPTER env var).
// ============================================================================

import type {
  AdjacentArtist,
  Artist,
  GenreWeight,
  TasteProfile,
} from '../types';

export interface MusicAdapter {
  /** Machine name of the adapter, mirrored onto TasteProfile.source. */
  readonly id: string;
  /** Display label shown on the "Connect your music" button. */
  readonly label: string;
  /** True when the adapter has everything it needs to make real calls. */
  isConfigured(): boolean;
  /** Fetch the user's top artists (already ranked, most-listened first). */
  getTopArtists(limit?: number): Promise<Artist[]>;
  /** Derive and return the full taste profile. */
  getTasteProfile(): Promise<TasteProfile>;
}

// ----------------------------------------------------------------------------
// Shared taste-profile derivation. Real adapters reuse these helpers so that
// genre ranking and "you might like" logic stay identical across sources.
// ----------------------------------------------------------------------------

/** Roll up genres across the top artists into a ranked, weighted list. */
export function deriveTopGenres(artists: Artist[]): GenreWeight[] {
  const counts = new Map<string, number>();
  for (const artist of artists) {
    for (const genre of artist.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([genre, weight]) => ({ genre, weight }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * A tiny hand-built "adjacency graph": for a given genre, which artists a
 * listener is likely to enjoy next. Real adapters can replace this with
 * Spotify's related-artists endpoint (see spotifyMusicAdapter below).
 */
const GENRE_ADJACENCY: Record<string, AdjacentArtist[]> = {
  'indie rock': [
    { id: 'adj-phoebe', name: 'Phoebe Bridgers', genres: ['indie rock', 'indie folk'], reason: '' },
    { id: 'adj-alvvays', name: 'Alvvays', genres: ['indie rock', 'dream pop'], reason: '' },
  ],
  'dream pop': [
    { id: 'adj-beachhouse', name: 'Beach House', genres: ['dream pop', 'shoegaze'], reason: '' },
    { id: 'adj-cocteau', name: 'Cocteau Twins', genres: ['dream pop', 'shoegaze'], reason: '' },
  ],
  'synth-pop': [
    { id: 'adj-chvrches', name: 'CHVRCHES', genres: ['synth-pop', 'electropop'], reason: '' },
    { id: 'adj-m83', name: 'M83', genres: ['synth-pop', 'shoegaze'], reason: '' },
  ],
  'hip hop': [
    { id: 'adj-tylercreator', name: 'Tyler, the Creator', genres: ['hip hop', 'alternative hip hop'], reason: '' },
    { id: 'adj-freddiegibbs', name: 'Freddie Gibbs', genres: ['hip hop', 'west coast hip hop'], reason: '' },
  ],
  'r&b': [
    { id: 'adj-sza', name: 'SZA', genres: ['r&b', 'alternative r&b'], reason: '' },
    { id: 'adj-danielcaesar', name: 'Daniel Caesar', genres: ['r&b', 'neo soul'], reason: '' },
  ],
  'indie folk': [
    { id: 'adj-fleetfoxes', name: 'Fleet Foxes', genres: ['indie folk', 'folk rock'], reason: '' },
    { id: 'adj-boniver', name: 'Bon Iver', genres: ['indie folk', 'art pop'], reason: '' },
  ],
  electronic: [
    { id: 'adj-odesza', name: 'ODESZA', genres: ['electronic', 'chillwave'], reason: '' },
    { id: 'adj-flume', name: 'Flume', genres: ['electronic', 'future bass'], reason: '' },
  ],
  pop: [
    { id: 'adj-carlyrae', name: 'Carly Rae Jepsen', genres: ['pop', 'synth-pop'], reason: '' },
    { id: 'adj-troyesivan', name: 'Troye Sivan', genres: ['pop', 'electropop'], reason: '' },
  ],
};

/**
 * Suggest artists the listener does not already have in their top list,
 * ranked by how many of their strongest genres each suggestion touches.
 */
export function deriveAdjacentArtists(
  topArtists: Artist[],
  topGenres: GenreWeight[],
): AdjacentArtist[] {
  const known = new Set(topArtists.map((a) => a.name.toLowerCase()));
  const picked = new Map<string, AdjacentArtist>();

  for (const { genre } of topGenres) {
    const candidates = GENRE_ADJACENCY[genre] ?? [];
    for (const candidate of candidates) {
      if (known.has(candidate.name.toLowerCase())) continue;
      if (picked.has(candidate.id)) continue;
      picked.set(candidate.id, {
        ...candidate,
        reason: `Because you listen to ${genre}`,
      });
    }
  }

  return [...picked.values()].slice(0, 6);
}

/** Build a real, personalized profile without requiring a streaming account. */
export function buildManualTasteProfile(
  artistNames: string[],
  genres: string[],
): TasteProfile {
  const uniqueNames = [...new Set(artistNames.map((name) => name.trim()).filter(Boolean))];
  const uniqueGenres = [...new Set(genres.map((genre) => genre.trim().toLowerCase()).filter(Boolean))];
  if (uniqueNames.length === 0) throw new Error('Add at least one favorite artist.');
  const topArtists: Artist[] = uniqueNames.slice(0, 20).map((name, index) => ({
    id: `manual-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    genres: uniqueGenres,
    popularity: Math.max(60, 100 - index * 3),
  }));
  const topGenres = uniqueGenres.map((genre) => ({ genre, weight: uniqueNames.length }));
  return {
    source: 'manual',
    topArtists,
    topGenres,
    adjacentArtists: deriveAdjacentArtists(topArtists, topGenres),
  };
}

// ============================================================================
// (a) MOCK adapter — the default. Zero setup, fully offline.
// ============================================================================

const MOCK_ARTISTS: Artist[] = [
  { id: 'm1', name: 'Tame Impala', genres: ['psychedelic rock', 'indie rock', 'synth-pop'], popularity: 92 },
  { id: 'm2', name: 'The 1975', genres: ['indie rock', 'synth-pop', 'pop'], popularity: 88 },
  { id: 'm3', name: 'Frank Ocean', genres: ['r&b', 'hip hop', 'alternative r&b'], popularity: 90 },
  { id: 'm4', name: 'Sufjan Stevens', genres: ['indie folk', 'art pop'], popularity: 74 },
  { id: 'm5', name: 'Kendrick Lamar', genres: ['hip hop', 'west coast hip hop'], popularity: 95 },
  { id: 'm6', name: 'Beach House', genres: ['dream pop', 'shoegaze'], popularity: 79 },
  { id: 'm7', name: 'ODESZA', genres: ['electronic', 'chillwave'], popularity: 81 },
  { id: 'm8', name: 'Bon Iver', genres: ['indie folk', 'art pop'], popularity: 83 },
  { id: 'm9', name: 'Dua Lipa', genres: ['pop', 'synth-pop'], popularity: 91 },
  { id: 'm10', name: 'Mac Miller', genres: ['hip hop', 'r&b'], popularity: 85 },
];

export class MockMusicAdapter implements MusicAdapter {
  readonly id = 'mock';
  readonly label = 'Use demo taste (mock)';

  isConfigured(): boolean {
    return true;
  }

  async getTopArtists(limit = 10): Promise<Artist[]> {
    // Simulate a little network latency for realism.
    await delay(250);
    return MOCK_ARTISTS.slice(0, limit);
  }

  async getTasteProfile(): Promise<TasteProfile> {
    const topArtists = await this.getTopArtists();
    const topGenres = deriveTopGenres(topArtists);
    const adjacentArtists = deriveAdjacentArtists(topArtists, topGenres);
    return { source: this.id, topArtists, topGenres, adjacentArtists };
  }
}

// ============================================================================
// (b) REAL adapter stubs — gated behind env vars, documented, not wired to live
//     network calls by default. Fill in the TODOs and set VITE_MUSIC_ADAPTER.
// ============================================================================

/**
 * Spotify Web API adapter.
 *
 * OAuth: Authorization Code with PKCE (browser-safe, no client secret needed).
 *   1. Redirect the user to https://accounts.spotify.com/authorize
 *        ?client_id=...&response_type=code&redirect_uri=...
 *        &scope=user-top-read&code_challenge_method=S256&code_challenge=...
 *   2. Exchange the returned code at https://accounts.spotify.com/api/token
 *   3. Store the access token and call the endpoints below.
 *
 * Endpoints used:
 *   - GET https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term
 *     -> maps directly to Artist[] (item.id, item.name, item.genres, item.popularity,
 *        item.images[0]?.url)
 *   - GET https://api.spotify.com/v1/artists/{id}/related-artists
 *     -> replace deriveAdjacentArtists() with real "fans also like" results.
 *
 * Docs: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists
 */
export class SpotifyMusicAdapter implements MusicAdapter {
  readonly id = 'spotify';
  readonly label = 'Connect Spotify';

  constructor(
    private readonly clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as
      | string
      | undefined,
    private readonly accessToken?: string,
  ) {}

  isConfigured(): boolean {
    // A client id alone cannot call the user endpoint. Until the OAuth callback
    // supplies a token, keep the factory on its explicit mock fallback.
    return Boolean(this.clientId && this.accessToken);
  }

  async getTopArtists(_limit = 10): Promise<Artist[]> {
    // TODO(real): call GET /v1/me/top/artists with a valid bearer token.
    //   const res = await fetch(
    //     `https://api.spotify.com/v1/me/top/artists?limit=${_limit}&time_range=medium_term`,
    //     { headers: { Authorization: `Bearer ${this.accessToken}` } },
    //   );
    //   const json = await res.json();
    //   return json.items.map((i: any): Artist => ({
    //     id: i.id, name: i.name, genres: i.genres,
    //     popularity: i.popularity, imageUrl: i.images?.[0]?.url,
    //   }));
    void this.accessToken; // used by the real implementation above
    throw new NotImplementedError('SpotifyMusicAdapter.getTopArtists');
  }

  async getTasteProfile(): Promise<TasteProfile> {
    // TODO(real): once getTopArtists is live, this body is identical to the
    // mock: derive genres, then either use deriveAdjacentArtists() or swap in
    // the /related-artists endpoint for higher-quality suggestions.
    const topArtists = await this.getTopArtists();
    const topGenres = deriveTopGenres(topArtists);
    const adjacentArtists = deriveAdjacentArtists(topArtists, topGenres);
    return { source: this.id, topArtists, topGenres, adjacentArtists };
  }
}

/**
 * YouTube Music adapter.
 *
 * YouTube Music has no official public API. Two documented paths:
 *  (a) YouTube Data API v3 (official, OAuth):
 *      - Enable "YouTube Data API v3" in Google Cloud Console.
 *      - GET https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true
 *        -> subscribed channels approximate "top artists".
 *      - GET .../videos?myRating=like  -> liked music videos for genre signal.
 *      Docs: https://developers.google.com/youtube/v3/docs
 *  (b) Unofficial ytmusicapi (server-side only, needs auth headers):
 *      https://ytmusicapi.readthedocs.io/  ->  get_library_artists() etc.
 *      Never ship browser cookies; proxy through your own backend.
 */
export class YTMusicAdapter implements MusicAdapter {
  readonly id = 'ytmusic';
  readonly label = 'Connect YouTube Music';

  constructor(
    private readonly clientId = import.meta.env.VITE_YTMUSIC_CLIENT_ID as
      | string
      | undefined,
    private readonly accessToken?: string,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.clientId && this.accessToken);
  }

  async getTopArtists(_limit = 10): Promise<Artist[]> {
    // TODO(real): map subscribed channels / liked videos to Artist[].
    // Genres are not returned by the YouTube Data API — enrich via a lookup
    // (e.g. MusicBrainz) or Spotify's search endpoint keyed on artist name.
    void this.accessToken; // used by the real implementation
    throw new NotImplementedError('YTMusicAdapter.getTopArtists');
  }

  async getTasteProfile(): Promise<TasteProfile> {
    const topArtists = await this.getTopArtists();
    const topGenres = deriveTopGenres(topArtists);
    const adjacentArtists = deriveAdjacentArtists(topArtists, topGenres);
    return { source: this.id, topArtists, topGenres, adjacentArtists };
  }
}

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(
      `${what} is a real-adapter stub. Fill in the TODO and set the matching ` +
        `env vars, or use the mock adapter (VITE_MUSIC_ADAPTER=mock).`,
    );
    this.name = 'NotImplementedError';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
