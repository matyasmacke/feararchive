import { ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FormattedContent } from '../components/FormattedContent';
import { getSettings } from '../store/settings';

export function GdprPage() {
  const gdprText = getSettings().gdprText;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800">
            <ScrollText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">GDPR</h1>
            <p className="mt-1 text-gray-400">General Data Protection Regulation (GDPR) Compliance Statement</p>
          </div>
        </div>

        <div
          className="group mb-8 block animate-fade-in rounded-2xl border border-purple-900/20 bg-gray-900/50 p-6 sm:p-8"
          style={{ animationDelay: '60ms', animationFillMode: 'both' }}
        >
          <FormattedContent content={gdprText} className="text-sm text-gray-300 sm:text-base" />
        </div>

        <div
          className="group block animate-fade-in rounded-2xl border border-purple-900/30 bg-gradient-to-r from-purple-900/20 to-purple-950/20 p-6 text-center"
          style={{ animationDelay: '120ms', animationFillMode: 'both' }}
        >
          <h3 className="mb-2 text-lg font-semibold text-white">Ready to share your story?</h3>
          <p className="mb-4 text-sm text-gray-400">Join our community of horror writers and share your darkest tales.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/add-story"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-500 hover:to-purple-600"
            >
              Write a Story
            </Link>
            <Link
              to="/apply-mod"
              className="rounded-xl border border-gray-700/50 bg-gray-800 px-6 py-2.5 text-sm font-medium text-gray-300 transition-all hover:bg-gray-700"
            >
              Apply to Moderate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
