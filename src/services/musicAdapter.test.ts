import { describe, expect, it } from 'vitest';
import { buildManualTasteProfile, deriveTopGenres } from './musicAdapter';

describe('taste profiles', () => {
  it('normalizes a manual profile and derives adjacent artists', () => {
    const profile = buildManualTasteProfile([' SZA ', 'SZA', 'ODESZA'], [' R&B ', 'electronic']);
    expect(profile.topArtists.map((artist) => artist.name)).toEqual(['SZA', 'ODESZA']);
    expect(profile.topGenres).toEqual([{ genre: 'r&b', weight: 2 }, { genre: 'electronic', weight: 2 }]);
    expect(profile.adjacentArtists.some((artist) => artist.name === 'Flume')).toBe(true);
  });

  it('rejects an empty manual profile and ranks genre counts', () => {
    expect(() => buildManualTasteProfile([], [])).toThrow(/artist/i);
    expect(deriveTopGenres([
      { id: '1', name: 'A', genres: ['pop', 'rock'], popularity: 1 },
      { id: '2', name: 'B', genres: ['pop'], popularity: 1 },
    ])[0]).toEqual({ genre: 'pop', weight: 2 });
  });
});
