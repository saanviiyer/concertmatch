// ============================================================================
// Events source adapter layer
// ----------------------------------------------------------------------------
// Same mock + real pattern as the music adapters. The app only talks to the
// `EventsAdapter` interface; getEventsAdapter() in ./index.ts picks the impl.
// ============================================================================

import type { ConcertEvent, RecommendationFilters } from '../types';
import { NotImplementedError } from './musicAdapter';

export interface EventsAdapter {
  readonly id: string;
  readonly label: string;
  isConfigured(): boolean;
  /**
   * Fetch candidate concert events for the given filters. Ranking + "why
   * recommended" reasons are applied later in recommender.ts against the
   * user's taste profile, so this only returns raw candidates.
   */
  searchEvents(filters: RecommendationFilters): Promise<ConcertEvent[]>;
}

// ============================================================================
// MOCK adapter — the default. A realistic, offline event catalog.
// ============================================================================

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/** A broad catalog covering the mock taste profile's artists + adjacent picks. */
const MOCK_EVENT_CATALOG: ConcertEvent[] = [
  { id: 'e1', artistName: 'Tame Impala', eventName: 'Tame Impala: The Slow Rush Tour', venue: 'The Forum', city: 'Los Angeles', date: futureDate(21), time: '20:00', priceMin: 65, priceMax: 180, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e2', artistName: 'The 1975', eventName: 'The 1975 Live', venue: 'Kia Forum', city: 'Los Angeles', date: futureDate(34), time: '19:30', priceMin: 55, priceMax: 150, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e3', artistName: 'Kendrick Lamar', eventName: 'Kendrick Lamar: The Big Steppers Tour', venue: 'Crypto.com Arena', city: 'Los Angeles', date: futureDate(48), time: '20:00', priceMin: 90, priceMax: 350, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e4', artistName: 'Dua Lipa', eventName: 'Dua Lipa: Radical Optimism', venue: 'Chase Center', city: 'San Francisco', date: futureDate(40), time: '20:00', priceMin: 80, priceMax: 260, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e5', artistName: 'ODESZA', eventName: 'ODESZA: The Last Goodbye', venue: 'Bill Graham Civic', city: 'San Francisco', date: futureDate(15), time: '21:00', priceMin: 60, priceMax: 140, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e6', artistName: 'Beach House', eventName: 'Beach House Live', venue: 'The Fillmore', city: 'San Francisco', date: futureDate(27), time: '20:00', priceMin: 45, priceMax: 95, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e7', artistName: 'Bon Iver', eventName: 'Bon Iver: An Evening With', venue: 'Beacon Theatre', city: 'New York', date: futureDate(31), time: '19:30', priceMin: 70, priceMax: 200, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e8', artistName: 'Frank Ocean', eventName: 'Frank Ocean Live', venue: 'Barclays Center', city: 'New York', date: futureDate(55), time: '20:00', priceMin: 120, priceMax: 400, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e9', artistName: 'Phoebe Bridgers', eventName: 'Phoebe Bridgers: Reunion Tour', venue: 'Radio City Music Hall', city: 'New York', date: futureDate(19), time: '20:00', priceMin: 60, priceMax: 175, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e10', artistName: 'CHVRCHES', eventName: 'CHVRCHES: Screen Violence', venue: 'Aragon Ballroom', city: 'Chicago', date: futureDate(23), time: '19:00', priceMin: 50, priceMax: 110, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e11', artistName: 'SZA', eventName: 'SZA: SOS Tour', venue: 'United Center', city: 'Chicago', date: futureDate(37), time: '20:00', priceMin: 85, priceMax: 300, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e12', artistName: 'Flume', eventName: 'Flume: Palaces Tour', venue: 'Byline Bank Aragon', city: 'Chicago', date: futureDate(12), time: '21:00', priceMin: 55, priceMax: 130, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e13', artistName: 'Fleet Foxes', eventName: 'Fleet Foxes Live', venue: 'The Anthem', city: 'Washington', date: futureDate(29), time: '20:00', priceMin: 48, priceMax: 105, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e14', artistName: 'M83', eventName: 'M83: Hurry Up, We are Dreaming', venue: 'Fox Theater', city: 'Oakland', date: futureDate(44), time: '20:30', priceMin: 52, priceMax: 120, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
  { id: 'e15', artistName: 'Tyler, the Creator', eventName: 'Tyler, the Creator: Call Me Tour', venue: 'Moody Center', city: 'Austin', date: futureDate(33), time: '20:00', priceMin: 75, priceMax: 240, currency: 'USD', buyUrl: 'https://www.ticketmaster.com/', source: 'mock' },
];

export class MockEventsAdapter implements EventsAdapter {
  readonly id = 'mock';
  readonly label = 'Ticketmaster (mock)';

  isConfigured(): boolean {
    return true;
  }

  async searchEvents(filters: RecommendationFilters): Promise<ConcertEvent[]> {
    await delay(250);
    const city = filters.location.city.trim().toLowerCase();

    return MOCK_EVENT_CATALOG.filter((event) => {
      // City filter (empty city => show everything, nationwide).
      if (city && event.city.toLowerCase() !== city) return false;
      // Date range.
      if (filters.startDate && event.date < filters.startDate) return false;
      if (filters.endDate && event.date > filters.endDate) return false;
      // Max price (compare against the lowest available ticket).
      if (filters.maxPrice != null && event.priceMin > filters.maxPrice) {
        return false;
      }
      return true;
    });
  }
}

// ============================================================================
// REAL adapter stub — Ticketmaster Discovery API, gated behind an env key.
// ============================================================================

/**
 * Ticketmaster Discovery API adapter.
 *
 * Get a key: https://developer.ticketmaster.com/  (register -> app -> Consumer Key)
 *
 * Endpoint:
 *   GET https://app.ticketmaster.com/discovery/v2/events.json
 *       ?apikey=API_KEY
 *       &classificationName=music
 *       &city=Los Angeles
 *       &radius=50&unit=miles
 *       &startDateTime=2026-08-08T00:00:00Z
 *       &endDateTime=2026-12-31T23:59:59Z
 *       &size=50
 *
 * Response mapping (per _embedded.events[i]):
 *   id            -> ev.id
 *   artistName    -> ev._embedded?.attractions?.[0]?.name ?? ev.name
 *   eventName     -> ev.name
 *   venue/city    -> ev._embedded?.venues?.[0]?.name / .city.name
 *   date          -> ev.dates.start.localDate
 *   time          -> ev.dates.start.localTime
 *   priceMin/Max  -> ev.priceRanges?.[0]?.min / .max
 *   currency      -> ev.priceRanges?.[0]?.currency ?? 'USD'
 *   imageUrl      -> ev.images?.find(i => i.ratio === '16_9')?.url
 *   buyUrl        -> ev.url
 *
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
export class TicketmasterEventsAdapter implements EventsAdapter {
  readonly id = 'ticketmaster';
  readonly label = 'Ticketmaster (live)';

  constructor(
    private readonly apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY as
      | string
      | undefined,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async searchEvents(filters: RecommendationFilters): Promise<ConcertEvent[]> {
    if (!this.apiKey) throw new NotImplementedError('TicketmasterEventsAdapter.searchEvents');
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', this.apiKey);
    url.searchParams.set('classificationName', 'music');
    url.searchParams.set('size', '100');
    url.searchParams.set('sort', 'date,asc');
    const city = filters.location.city.trim();
    if (city) url.searchParams.set('city', city);
    url.searchParams.set('radius', String(Math.min(200, Math.max(5, filters.location.radiusMiles))));
    url.searchParams.set('unit', 'miles');
    if (filters.startDate) url.searchParams.set('startDateTime', `${filters.startDate}T00:00:00Z`);
    if (filters.endDate) url.searchParams.set('endDateTime', `${filters.endDate}T23:59:59Z`);

    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await this.fetcher(url, { signal: controller.signal });
      const body = await response.json().catch(() => ({})) as TicketmasterResponse;
      if (!response.ok) {
        const detail = body.fault?.faultstring || body.detail || `Ticketmaster request failed (${response.status})`;
        throw new Error(detail);
      }
      return (body._embedded?.events || [])
        .map(mapTicketmasterEvent)
        .filter((event): event is ConcertEvent => event !== null)
        .filter((event) => filters.maxPrice == null || event.priceMin <= filters.maxPrice);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Ticketmaster took too long to respond. Please retry.');
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }
}

interface TicketmasterEventJson {
  id?: string; name?: string; url?: string;
  dates?: { start?: { localDate?: string; localTime?: string } };
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  images?: Array<{ url?: string; ratio?: string; width?: number }>;
  _embedded?: {
    attractions?: Array<{ name?: string }>;
    venues?: Array<{ name?: string; city?: { name?: string } }>;
  };
}
interface TicketmasterResponse {
  _embedded?: { events?: TicketmasterEventJson[] };
  fault?: { faultstring?: string };
  detail?: string;
}

export function mapTicketmasterEvent(raw: TicketmasterEventJson): ConcertEvent | null {
  const id = raw.id?.trim();
  const eventName = raw.name?.trim();
  const date = raw.dates?.start?.localDate;
  const buyUrl = raw.url?.trim();
  if (!id || !eventName || !date || !buyUrl) return null;
  const venue = raw._embedded?.venues?.[0];
  const range = raw.priceRanges?.[0];
  const image = [...(raw.images || [])]
    .filter((item) => item.url)
    .sort((a, b) => Number(b.ratio === '16_9') - Number(a.ratio === '16_9') || (b.width || 0) - (a.width || 0))[0];
  return {
    id,
    artistName: raw._embedded?.attractions?.[0]?.name?.trim() || eventName,
    eventName,
    venue: venue?.name?.trim() || 'Venue to be announced',
    city: venue?.city?.name?.trim() || 'Location to be announced',
    date,
    time: raw.dates?.start?.localTime?.slice(0, 5),
    priceMin: typeof range?.min === 'number' ? range.min : 0,
    priceMax: typeof range?.max === 'number' ? range.max : (range?.min || 0),
    currency: range?.currency || 'USD',
    imageUrl: image?.url,
    buyUrl,
    source: 'ticketmaster',
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
