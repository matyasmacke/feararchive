import { useEffect, useState } from 'react';
import { AlertTriangle, Flag, Loader2, X } from 'lucide-react';
import { STORY_REPORT_REASON_LABELS } from '../types';
import type { StoryReportReason } from '../types';

export function StoryReportModal({ storyTitle, onClose, onSubmit }: {
  storyTitle: string;
  onClose: () => void;
  onSubmit: (reason: StoryReportReason, details: string) => Promise<void>;
}) {
  const [reason, setReason] = useState<StoryReportReason>('harmful');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, submitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(reason, details.trim());
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The report could not be submitted.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-report-title"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-lg overflow-hidden rounded-2xl border border-red-900/40 bg-gray-950 shadow-2xl shadow-red-950/30">
        <div className="flex items-start justify-between gap-4 border-b border-red-900/30 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-800/40 bg-red-900/20">
              <Flag className="h-5 w-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <h2 id="story-report-title" className="text-lg font-bold text-white">Report Story</h2>
              <p className="truncate text-sm text-gray-500">{storyTitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 disabled:opacity-50" aria-label="Close report form">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-2 rounded-xl border border-amber-900/30 bg-amber-950/20 px-4 py-3 text-xs leading-relaxed text-amber-300/80">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Reports are reviewed by moderators and administrators. Please choose the most accurate reason and do not submit false reports.
          </div>

          {error && <p className="rounded-xl border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">{error}</p>}

          <div>
            <label htmlFor="report-reason" className="mb-2 block text-sm font-medium text-gray-300">Reason</label>
            <select
              id="report-reason"
              value={reason}
              onChange={event => setReason(event.target.value as StoryReportReason)}
              className="w-full cursor-pointer rounded-xl border border-purple-900/30 bg-gray-900 px-4 py-3 text-gray-200 focus:border-purple-500/50 focus:outline-none"
            >
              {(Object.entries(STORY_REPORT_REASON_LABELS) as [StoryReportReason, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="report-details" className="text-sm font-medium text-gray-300">Additional details <span className="font-normal text-gray-600">(optional)</span></label>
              <span className="text-xs text-gray-600">{details.length}/1000</span>
            </div>
            <textarea
              id="report-details"
              value={details}
              onChange={event => setDetails(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Briefly explain what moderators should review..."
              className="w-full resize-y rounded-xl border border-purple-900/30 bg-gray-900 px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-purple-900/20 bg-gray-900/30 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl border border-purple-900/30 bg-gray-900 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}
