import { useEffect, useState } from 'react';
import { db } from '../store/db';
import type { ChangelogEntry } from '../types';
import { Calendar } from 'lucide-react';

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
          <div className="space-y-12">
            {changelogs.map((log) => (
              <div key={log.id} className="relative pl-8 sm:pl-0">
                {/* Desktop timeline line */}
                <div className="hidden sm:block absolute left-[120px] top-0 bottom-[-48px] w-px bg-purple-900/30 last:bottom-0"></div>
                
                <div className="sm:flex items-start gap-12">
                  {/* Date section */}
                  <div className="hidden sm:flex flex-col items-end pt-1 w-[100px] shrink-0 text-purple-300/60 font-mono text-sm">
                    {new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="hidden sm:block absolute left-[116px] top-[10px] w-[9px] h-[9px] rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>

                  {/* Mobile date */}
                  <div className="sm:hidden flex items-center gap-2 text-purple-300/60 font-mono text-xs mb-3">
                    <Calendar className="w-3 h-3" />
                    {new Date(log.date).toLocaleDateString()}
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-fear-900/50 border border-purple-900/30 rounded-2xl p-6 sm:p-8 hover:border-purple-500/30 transition-colors shadow-lg shadow-black/20">
                    <h2 className="text-2xl font-bold text-purple-100 mb-6">{log.title}</h2>
                    <ul className="space-y-4">
                      {log.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0"></span>
                          <span className="text-purple-200/80 leading-relaxed">{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
