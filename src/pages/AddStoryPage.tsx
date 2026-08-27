import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../store/AuthContext';
import { LENGTH_LABELS } from '../types';
import { getSettings, getCategoryNames } from '../store/settings';
import type { StoryLength } from '../types';
import { PenTool, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { StoryRulesModal } from '../components/StoryRulesModal';
import { FormattingEditor } from '../components/FormattingEditor';

export function AddStoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedDraftId = searchParams.get('draft');
  const settings = getSettings();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const categories = getCategoryNames();
  const [category, setCategory] = useState<string>(categories[0] || 'Horror');
  const [length, setLength] = useState<StoryLength>('medium');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(requestedDraftId);
  const [draftLoading, setDraftLoading] = useState(Boolean(requestedDraftId));
  const [draftLoadError, setDraftLoadError] = useState('');
  const hasAgreedBefore = user ? localStorage.getItem(`rules_agreed_${user.id}`) === 'true' : false;
  const [userStoryCount, setUserStoryCount] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(hasAgreedBefore);
  const [publishAfterRules, setPublishAfterRules] = useState(false);

  useEffect(() => {
    if (user) {
      db.getStoriesByAuthor(user.id).then(stories => {
        setUserStoryCount(stories.filter(story => story.status !== 'draft').length);
      });
    }
  }, [user]);

  useEffect(() => {
    setAgreedToRules(hasAgreedBefore);
  }, [hasAgreedBefore]);

  useEffect(() => {
    let active = true;
    if (!user || !requestedDraftId) {
      setDraftLoading(false);
      return () => { active = false; };
    }
    const userId = user.id;

    setDraftLoading(true);
    setDraftLoadError('');
    void db.getStoryById(requestedDraftId).then(story => {
      if (!active) return;
      if (!story || story.status !== 'draft' || story.authorId !== userId) {
        setDraftLoadError('This draft does not exist or you are not allowed to edit it.');
        return;
      }
      setActiveDraftId(story.id);
      setTitle(story.title);
      setContent(story.content);
      setCategory(story.category);
      setLength(story.length);
    }).finally(() => {
      if (active) setDraftLoading(false);
    });

    return () => { active = false; };
  }, [requestedDraftId, user?.id]);

  const requiresApproval = settings.requireApprovalForStories;

  const publishStory = async () => {
    if (!user) return;
    const status = requiresApproval ? 'pending' : 'approved';
    const storyData = {
      title: title.trim(),
      content: content.trim(),
      authorId: user.id,
      authorName: user.username,
      category,
      length,
      status,
    } as const;

    setSubmitting(true);
    setError('');
    setSavedMessage('');
    try {
      const saved = activeDraftId
        ? await db.updateStory(activeDraftId, storyData)
        : await db.addStory(storyData);
      if (!saved) throw new Error('Story could not be saved');
      setActiveDraftId(null);
      setSubmitted(true);
    } catch {
      setError('Failed to submit story. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setError('');
    setSavedMessage('');
    if (!title.trim() && !content.trim()) {
      setError('Write a title or some story text before saving a draft.');
      return;
    }
    if (content.trim().length > settings.maxStoryLength) {
      setError(`Story exceeds the maximum length of ${settings.maxStoryLength.toLocaleString()} characters.`);
      return;
    }

    setSavingDraft(true);
    try {
      const storyData = {
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        authorName: user.username,
        category,
        length,
        status: 'draft' as const,
      };
      const saved = activeDraftId
        ? await db.updateStory(activeDraftId, storyData)
        : await db.addStory(storyData);
      if (!saved) throw new Error('Draft could not be saved');

      setTitle(saved.title);
      setContent(saved.content);
      setActiveDraftId(saved.id);
      setSavedMessage('Draft saved. Only you and the moderation team can see it.');
      if (!activeDraftId) navigate(`/add-story?draft=${saved.id}`, { replace: true });
    } catch {
      setError('Failed to save the draft. Make sure the Supabase draft migration has been applied.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMessage('');
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!content.trim()) { setError('Please write your story.'); return; }
    if (content.trim().length < 50) { setError('Story must be at least 50 characters.'); return; }
    if (content.trim().length > settings.maxStoryLength) { setError(`Story exceeds the maximum length of ${settings.maxStoryLength.toLocaleString()} characters.`); return; }
    if (userStoryCount === 0 && !agreedToRules) {
      setPublishAfterRules(true);
      setShowRules(true);
      return;
    }
    await publishStory();
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center">
      <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Login Required</h2>
      <p className="text-gray-500 mb-6">You need to be logged in to write a story.</p>
      <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">Go to Login</button>
    </div></div>
  );

  if (showRules) return (
    <StoryRulesModal
      onAgree={() => {
        if (user) localStorage.setItem(`rules_agreed_${user.id}`, 'true');
        setAgreedToRules(true);
        setShowRules(false);
        if (publishAfterRules) {
          setPublishAfterRules(false);
          void publishStory();
        }
      }}
      onDisagree={() => {
        setPublishAfterRules(false);
        setShowRules(false);
      }}
    />
  );

  if (user.isGhost) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center">
      <AlertCircle className="h-16 w-16 text-purple-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Not Available</h2>
      <p className="text-gray-500">Ghost accounts cannot submit stories.</p>
    </div></div>
  );

  if (userStoryCount === null || draftLoading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-purple-400 animate-spin" /></div>
  );

  if (draftLoadError) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center max-w-md">
      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Draft Not Available</h2>
      <p className="text-gray-500 mb-6">{draftLoadError}</p>
      <button onClick={() => navigate('/profile')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">Back to Profile</button>
    </div></div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center max-w-md animate-fade-in">
      <div className="h-20 w-20 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center mx-auto mb-6 animate-pulse-glow"><CheckCircle className="h-10 w-10 text-purple-400" /></div>
      <h2 className="text-2xl font-bold text-white mb-3">{requiresApproval ? 'Story Submitted!' : 'Story Published!'}</h2>
      <p className="text-gray-400 mb-6 leading-relaxed">{requiresApproval ? "Your story has been submitted and is waiting for approval." : "Your story has been published!"}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => { setSubmitted(false); setTitle(''); setContent(''); setActiveDraftId(null); navigate('/add-story', { replace: true }); }} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium">Write Another</button>
        <button onClick={() => navigate('/stories')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">View Stories</button>
      </div>
    </div></div>
  );

  return (
    <div className="min-h-screen py-10 px-4"><div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center"><PenTool className="h-6 w-6 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">{activeDraftId ? 'Continue Your Draft' : 'Write a Story'}</h1><p className="text-sm text-gray-500">{activeDraftId ? 'Keep writing, save again, or submit when it is ready' : 'Share your darkest tale with the world'}</p></div>
      </div>
      {!requiresApproval && (<div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-900/20 border border-green-800/40 rounded-lg text-green-400 text-sm"><CheckCircle className="h-4 w-4 shrink-0" />Stories are published immediately.</div>)}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (<div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm animate-slide-down"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>)}
        {savedMessage && (<div className="flex items-center gap-2 px-4 py-3 bg-green-900/20 border border-green-800/40 rounded-lg text-green-400 text-sm animate-slide-down"><CheckCircle className="h-4 w-4 shrink-0" /> {savedMessage}</div>)}
        <div><label className="block text-sm font-medium text-gray-300 mb-2">Title</label><input type="text" value={title} onChange={e => { setTitle(e.target.value); setSavedMessage(''); }} placeholder="Enter your story title..." className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all" maxLength={200} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer">{categories.map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Story Length</label><select value={length} onChange={e => setLength(e.target.value as StoryLength)} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer">{(Object.entries(LENGTH_LABELS) as [StoryLength, string][]).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Story
            <span className={`font-normal ml-2 ${content.length > settings.maxStoryLength ? 'text-red-400' : 'text-gray-600'}`}>
              ({content.length.toLocaleString()} / {settings.maxStoryLength.toLocaleString()} characters)
            </span>
          </label>
          <FormattingEditor
            value={content}
            onChange={value => { setContent(value); setSavedMessage(''); }}
            placeholder="It was a dark and stormy night..."
            rows={16}
            allowLinks={false}
            aria-label="Your story content"
          />
        </div>
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600">Drafts stay private. {requiresApproval ? 'Submitted stories are reviewed before publishing.' : 'Published stories become visible immediately.'}</p>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <button type="button" onClick={handleSaveDraft} disabled={savingDraft || submitting} className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-purple-900/30 text-gray-200 font-medium rounded-xl transition-all disabled:opacity-60">
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-purple-400" />}
              {activeDraftId ? 'Save Draft' : 'Save as Draft'}
            </button>
            <button type="submit" disabled={submitting || savingDraft} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-60 flex items-center gap-2">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{requiresApproval ? 'Submit for Review' : 'Publish Story'}</button>
          </div>
        </div>
      </form>
    </div></div>
  );
}
