import { useState, useEffect } from 'react';
import { ScrollText, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { getSettings } from '../store/settings';

interface Props {
  onAgree: () => void;
  onDisagree: () => void;
}

export function StoryRulesModal({ onAgree, onDisagree }: Props) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const rules = getSettings().storyRules;

  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (atBottom) setScrolledToBottom(true);
  };

  // Convert markdown-ish bold to JSX
  const renderRules = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />;
      // Bold: **text**
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-sm text-gray-300 leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-purple-300 font-semibold">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-950 border border-purple-900/40 rounded-2xl shadow-2xl shadow-purple-900/30 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-purple-900/30 bg-gradient-to-r from-purple-900/20 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shrink-0">
              <ScrollText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Community Rules</h2>
              <p className="text-sm text-gray-400">Please read and agree before submitting your story</p>
            </div>
          </div>
        </div>

        {/* Rules content — scrollable */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5 space-y-1 min-h-0"
          onScroll={handleScroll}
        >
          {renderRules(rules)}
        </div>

        {/* Scroll hint */}
        {!scrolledToBottom && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-600 bg-gradient-to-t from-gray-950 to-transparent">
            <ChevronDown className="h-4 w-4 animate-bounce" />
            Scroll down to read all rules
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-5 border-t border-purple-900/30 bg-gray-900/50 shrink-0">
          <p className="text-xs text-gray-500 mb-4 text-center">
            {scrolledToBottom
              ? 'You have read the rules. Please make your choice below.'
              : 'You must scroll through all rules before you can agree.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onDisagree}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all text-sm font-medium border border-gray-700/50"
            >
              <XCircle className="h-4 w-4 text-red-400" />
              I Disagree — Take Me Back
            </button>
            <button
              onClick={onAgree}
              disabled={!scrolledToBottom}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl transition-all text-sm font-medium ${
                scrolledToBottom
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700/30'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              I Agree — Continue Writing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
