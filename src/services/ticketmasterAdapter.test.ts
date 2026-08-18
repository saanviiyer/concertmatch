import { describe, expect, it, vi } from 'vitest';
import { mapTicketmasterEvent, TicketmasterEventsAdapter } from './ticketmasterAdapter';

const raw = {
  id: 'abc', name: 'A Great Show', url: 'https://tickets.example/show',
  dates: { start: { localDate: '2026-10-20', localTime: '20:30:00' } },
  priceRanges: [{ min: 40, max: 120, currency: 'USD' }],
  images: [{ url: 'small', width: 200 }, { url: 'wide', ratio: '16_9', width: 1000 }],
  _embedded: { attractions: [{ name: 'Great Artist' }], venues: [{ name: 'The Hall', city: { name: 'Los Angeles' } }] },
};

describe('Ticketmaster adapter', () => {
  it('maps complete records and rejects unusable ones', () => {
    expect(mapTicketmasterEvent(raw)?.artistName).toBe('Great Artist');
    expect(mapTicketmasterEvent(raw)?.imageUrl).toBe('wide');
    expect(mapTicketmasterEvent({ name: 'missing id' })).toBeNull();
  });

  it('builds a bounded live query and applies max price', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ _embedded: { events: [raw] } }), { status: 200 }));
    const adapter = new TicketmasterEventsAdapter('secret', fetcher as typeof fetch);
    const result = await adapter.searchEvents({ location: { city: 'Los Angeles', radiusMiles: 999 }, maxPrice: 30 });
    expect(result).toEqual([]);
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get('radius')).toBe('200');
    expect(url.searchParams.get('city')).toBe('Los Angeles');
  });
});
