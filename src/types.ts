// ============================================================================
// Shared domain types for ConcertMatch
// ============================================================================

/** A single artist from the user's listening history. */
export interface Artist {
  id: string;
  name: string;
  /** Genres associated with this artist (lowercased tags). */
  genres: string[];
  /** 0-100 popularity/affinity score used for ranking. */
  popularity: number;
  /** Optional cover/avatar art URL. When absent the UI renders a placeholder. */
  imageUrl?: string;
}

/** A weighted genre in the user's taste profile. */
export interface GenreWeight {
  genre: string;
  /** Number of top artists that carry this genre. */
  weight: number;
}

/** An artist the user does not listen to yet but is likely to enjoy. */
export interface AdjacentArtist {
  id: string;
  name: string;
  genres: string[];
  /** Human-readable reason this artist was suggested. */
  reason: string;
}

/** The full taste profile derived from a music source. */
export interface TasteProfile {
  /** Which adapter produced this profile ("mock" | "spotify" | "ytmusic"). */
  source: string;
  topArtists: Artist[];
  topGenres: GenreWeight[];
  adjacentArtists: AdjacentArtist[];
}

/** Where and how far to search for events. */
export interface LocationFilter {
  city: string;
  /** Search radius in miles. */
  radiusMiles: number;
}

/** A recommended concert event. */
export interface ConcertEvent {
  id: string;
  artistName: string;
  eventName: string;
  venue: string;
  city: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** Local start time, e.g. "20:00". */
  time?: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  imageUrl?: string;
  buyUrl: string;
  /** Which adapter produced this event ("mock" | "ticketmaster"). */
  source: string;
}

/** A concert event plus the reason it was recommended and its match score. */
export interface RecommendedEvent extends ConcertEvent {
  /** 0-100 relevance score against the taste profile. */
  matchScore: number;
  /** Human-readable explanation shown on the card. */
  reason: string;
}

/** Filters applied to the recommendation query. */
export interface RecommendationFilters {
  location: LocationFilter;
  /** ISO date string, inclusive lower bound. */
  startDate?: string;
  /** ISO date string, inclusive upper bound. */
  endDate?: string;
  /** Maximum ticket price (uses event priceMin for the test). */
  maxPrice?: number;
}
