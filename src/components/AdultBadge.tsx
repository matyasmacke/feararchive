import { ShieldAlert } from 'lucide-react';

export function AdultBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border border-red-800/50 bg-red-900/30 px-2 py-0.5 text-xs font-bold text-red-300 ${className}`}>
      <ShieldAlert className="h-3 w-3" />
      18+
    </span>
  );
}
