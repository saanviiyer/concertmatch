// ============================================================================
// Deterministic cover-art placeholders
// ----------------------------------------------------------------------------
// No network images in mock mode. We generate a stable gradient + initials
// from a seed string so every card has distinct, consistent "art".
// ============================================================================

const GRADIENTS: [string, string][] = [
  ['#6366f1', '#a855f7'],
  ['#ec4899', '#f97316'],
  ['#06b6d4', '#3b82f6'],
  ['#10b981', '#84cc16'],
  ['#f59e0b', '#ef4444'],
  ['#8b5cf6', '#ec4899'],
  ['#14b8a6', '#6366f1'],
  ['#f43f5e', '#8b5cf6'],
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function coverGradient(seed: string): string {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
