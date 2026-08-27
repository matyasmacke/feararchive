import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 text-sky-400 ${className}`} title="Verified account" aria-label="Verified account">
      <BadgeCheck className="h-4 w-4 fill-sky-500/20" />
    </span>
  );
}
