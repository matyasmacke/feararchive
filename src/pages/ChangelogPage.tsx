import { useEffect, useState } from 'react';
import { db } from '../store/db';
import type { ChangelogEntry } from '../types';
import { Calendar } from 'lucide-react';
import { FormattedContent } from '../components/FormattedContent';

export default function ChangelogPage() {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    db.getChangelogs().then(setChangelogs);

    const handleDataChange = () => {
      db.getChangelogs().then(setChangelogs);
    };
    window.addEventListener('fear-data-changed', handleDataChange);
    return () => window.removeEventListener('fear-data-changed', handleDataChange);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">
            Changelog
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover the latest updates, improvements, and new features added to The Fear Archive.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {changelogs.length === 0 ? (
          <div className="text-center py-20 text-purple-300/50">
            No changelog entries yet.
          </div>
        ) : (
          <div className="space-y-10 sm:space-y-12">
            {changelogs.map((log, logIndex) => {
              const isLast = logIndex === changelogs.length - 1;

              return (
                <article key={log.id} className="relative pl-7 sm:pl-0">
                  {/* One continuous timeline for both mobile and desktop layouts */}
                  <div
                    aria-hidden="true"
                    className={`absolute left-[5px] top-[11px] w-px bg-gradient-to-b from-purple-500/70 via-purple-800/50 to-purple-900/20 sm:left-[120px] ${
                      isLast ? 'bottom-0' : 'bottom-[-40px] sm:bottom-[-48px]'
                    }`}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-[1px] top-[7px] z-10 h-[9px] w-[9px] rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] sm:left-[116px]"
                  />

                  <div className="grid gap-y-3 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-x-12 sm:gap-y-0">
                    {/* Date remains attached to the same point on the timeline at every width */}
                    <div className="flex self-start items-center gap-2 font-mono text-xs text-purple-300/60 sm:justify-end sm:pt-1 sm:text-sm">
                      <Calendar className="h-3.5 w-3.5 shrink-0 sm:hidden" />
                      {new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>

                    {/* Card */}
                    <div className="min-w-0 bg-fear-900/50 border border-purple-900/30 rounded-2xl p-5 sm:p-8 hover:border-purple-500/30 transition-colors shadow-lg shadow-black/20">
                      <h2 className="mb-5 text-xl font-bold leading-snug text-purple-100 sm:mb-6 sm:text-2xl">{log.title}</h2>
                      <ul className="space-y-3 sm:space-y-4">
                        {log.changes.map((change, i) => (
                          <li key={i} className="flex min-w-0 items-start gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500"></span>
                            <FormattedContent
                              content={change}
                              compact
                              className="min-w-0 flex-1 break-words text-sm text-purple-200/80 sm:text-base"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
