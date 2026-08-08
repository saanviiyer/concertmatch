import { coverGradient, initials } from '../lib/cover';

interface CoverProps {
  seed: string;
  imageUrl?: string;
  className?: string;
}

/** Cover art: real image if present, otherwise a deterministic gradient tile. */
export function Cover({ seed, imageUrl, className = '' }: CoverProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={seed}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center font-bold text-white/90 ${className}`}
      style={{ background: coverGradient(seed) }}
      aria-label={seed}
    >
      <span className="text-2xl tracking-wide drop-shadow">{initials(seed)}</span>
    </div>
  );
}
