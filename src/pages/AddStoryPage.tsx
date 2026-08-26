import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../store/AuthContext';
import { LENGTH_LABELS } from '../types';
import { getSettings, getCategoryNames } from '../store/settings';
import type { StoryLength } from '../types';
import { PenTool, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { StoryRulesModal } from '../components/StoryRulesModal';

export function AddStoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = getSettings();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const categories = getCategoryNames();
  const [category, setCategory] = useState<string>(categories[0] || 'Horror');
  const [length, setLength] = useState<StoryLength>('medium');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const hasAgreedBefore = user ? localStorage.getItem(`rules_agreed_${user.id}`) === 'true' : false;
  const [userStoryCount, setUserStoryCount] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [, setAgreedToRules] = useState(hasAgreedBefore);

  useEffect(() => {
    if (user) {
      db.getStoriesByAuthor(user.id).then(stories => {
        setUserStoryCount(stories.length);
        if (stories.length === 0 && !hasAgreedBefore) setShowRules(true);
      });
    }
  }, [user, hasAgreedBefore]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center">
      <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Login Required</h2>
      <p className="text-gray-500 mb-6">You need to be logged in to write a story.</p>
      <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">Go to Login</button>
    </div></div>
  );

  if (showRules) return (
    <StoryRulesModal onAgree={() => { if (user) localStorage.setItem(`rules_agreed_${user.id}`, 'true'); setAgreedToRules(true); setShowRules(false); }} onDisagree={() => navigate('/')} />
  );

  if (user.isGhost) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center">
      <AlertCircle className="h-16 w-16 text-purple-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Not Available</h2>
      <p className="text-gray-500">Ghost accounts cannot submit stories.</p>
    </div></div>
  );

  if (userStoryCount === null) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-purple-400 animate-spin" /></div>
  );

  const requiresApproval = settings.requireApprovalForStories;

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center max-w-md animate-fade-in">
      <div className="h-20 w-20 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center mx-auto mb-6 animate-pulse-glow"><CheckCircle className="h-10 w-10 text-purple-400" /></div>
      <h2 className="text-2xl font-bold text-white mb-3">{requiresApproval ? 'Story Submitted!' : 'Story Published!'}</h2>
      <p className="text-gray-400 mb-6 leading-relaxed">{requiresApproval ? "Your story has been submitted and is waiting for approval." : "Your story has been published!"}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setSubmitted(false); setTitle(''); setContent(''); }} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium">Write Another</button>
        <button onClick={() => navigate('/stories')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">View Stories</button>
      </div>
    </div></div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!content.trim()) { setError('Please write your story.'); return; }
    if (content.trim().length < 50) { setError('Story must be at least 50 characters.'); return; }
    if (content.trim().length > settings.maxStoryLength) { setError(`Story exceeds the maximum length of ${settings.maxStoryLength.toLocaleString()} characters.`); return; }
    const status = requiresApproval ? 'pending' : 'approved';
    setSubmitting(true);
    try {
      await db.addStory({ title: title.trim(), content: content.trim(), authorId: user.id, authorName: user.username, category, length, status });
      setSubmitted(true);
    } catch { setError('Failed to submit story. Please try again.'); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen py-10 px-4"><div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center"><PenTool className="h-6 w-6 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Write a Story</h1><p className="text-sm text-gray-500">Share your darkest tale with the world</p></div>
      </div>
      {!requiresApproval && (<div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-900/20 border border-green-800/40 rounded-lg text-green-400 text-sm"><CheckCircle className="h-4 w-4 shrink-0" />Stories are published immediately.</div>)}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (<div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm animate-slide-down"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>)}
        <div><label className="block text-sm font-medium text-gray-300 mb-2">Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter your story title..." className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all" maxLength={200} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer">{categories.map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Story Length</label><select value={length} onChange={e => setLength(e.target.value as StoryLength)} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer">{(Object.entries(LENGTH_LABELS) as [StoryLength, string][]).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-300 mb-2">Your Story <span className={`font-normal ml-2 ${content.length > settings.maxStoryLength ? 'text-red-400' : 'text-gray-600'}`}>({content.length.toLocaleString()} / {settings.maxStoryLength.toLocaleString()} characters)</span></label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="It was a dark and stormy night..." rows={16} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-y leading-relaxed" /></div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-600">{requiresApproval ? 'Stories are reviewed before publishing.' : 'Stories will be published immediately.'}</p>
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-60 flex items-center gap-2">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{requiresApproval ? 'Submit for Review' : 'Publish Story'}</button>
        </div>
      </form>
    </div></div>
  );
}
