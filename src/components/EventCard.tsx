import type { RecommendedEvent } from '../types';
import { Cover } from './Cover';

interface Props {
  event: RecommendedEvent;
  interested: boolean;
  onToggleInterested: (event: RecommendedEvent) => void;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function scoreColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500/20 text-emerald-300';
  if (score >= 70) return 'bg-brand-500/20 text-brand-400';
  if (score >= 50) return 'bg-sky-500/20 text-sky-300';
  return 'bg-white/10 text-gray-300';
}

/** A single recommended-concert card. */
export function EventCard({ event, interested, onToggleInterested }: Props) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-brand-500/60">
      <div className="relative">
        <Cover
          seed={event.artistName}
          imageUrl={event.imageUrl}
          className="h-40 w-full"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${scoreColor(
            event.matchScore,
          )}`}
        >
          {event.matchScore}% match
        </span>
        <button
          onClick={() => onToggleInterested(event)}
          aria-label={interested ? 'Remove from interested' : 'Save to interested'}
          className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-lg backdrop-blur transition hover:bg-black/60"
        >
          {interested ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-bold text-white">{event.artistName}</h4>
        <p className="text-sm text-gray-400">{event.eventName}</p>

        <div className="mt-3 space-y-1 text-sm text-gray-300">
          <p>📍 {event.venue}, {event.city}</p>
          <p>🗓️ {formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</p>
          <p>
            💲 {event.currency} {event.priceMin}–{event.priceMax}
          </p>
        </div>

        <p className="mt-3 rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-400">
          {event.reason}
        </p>

        <a
          href={event.buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-500"
        >
          Buy tickets
        </a>
      </div>
    </article>
  );
}
