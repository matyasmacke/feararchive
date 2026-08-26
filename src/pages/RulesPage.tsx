import { ScrollText } from 'lucide-react';
import { getSettings } from '../store/settings';
import { Link } from 'react-router-dom';

export function RulesPage() {
  const rules = getSettings().storyRules;

  const renderRules = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const pipeUrlRegex = /\|\s*(https?:\/\/[^\s|]+)\s*\|/;
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-sm sm:text-base text-gray-300 leading-relaxed">
          {parts.map((part, j) => {
            if (j % 2 === 1) {
              return <strong key={j} className="text-purple-300 font-semibold">{part}</strong>;
            }
            // plain text: break into segments for pipe-wrapped urls or plain urls
            return part
              .split(/(\|\s*https?:\/\/[^\s|]+\s*\||https?:\/\/[^\s]+)/g)
              .map((seg, k) => {
                if (pipeUrlRegex.test(seg)) {
                  const url = seg.replace(/^\|\s*|\s*\|$/g, '');
                  return (
                    <a
                      key={k}
                      href={url}
                      className="text-purple-400 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {url}
                    </a>
                  );
                }
                if (urlRegex.test(seg)) {
                  return (
                    <a
                      key={k}
                      href={seg}
                      className="text-purple-400 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {seg}
                    </a>
                  );
                }
                return seg;
              });
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shrink-0">
            <ScrollText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Community Rules</h1>
            <p className="text-gray-400 mt-1">Guidelines for The Fear Archive storytelling community</p>
          </div>
        </div>

        {/* Rules card */}
        <div className="bg-gray-900/50 border border-purple-900/20 rounded-2xl p-6 sm:p-8 space-y-1 mb-8  group block animate-fade-in"
                style={{ animationDelay: `${60}ms`, animationFillMode: 'both' }}
              >
          {renderRules(rules)}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-purple-900/20 to-purple-950/20 border border-purple-900/30 rounded-2xl p-6 text-center group block animate-fade-in"
                style={{ animationDelay: `${120}ms`, animationFillMode: 'both' }}
              >
          <h3 className="text-lg font-semibold text-white mb-2">Ready to share your story?</h3>
          <p className="text-gray-400 text-sm mb-4">Join our community of horror writers and share your darkest tales.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/add-story"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all text-sm"
            >
              Write a Story
            </Link>
            <Link
              to="/apply-mod"
              className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-all text-sm border border-gray-700/50"
            >
              Apply to Moderate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
