import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../store/AuthContext';
import { LENGTH_LABELS } from '../types';
import { getSettings, getCategoryNames } from '../store/settings';
import type { StoryLength } from '../types';
import { PenTool, CheckCircle, AlertCircle, Loader2, Save, ShieldAlert, Link2, ImagePlus, Trash2 } from 'lucide-react';
import { StoryRulesModal } from '../components/StoryRulesModal';
import { FormattingEditor } from '../components/FormattingEditor';
import { normalizeExternalHttpUrl } from '../utils/externalUrl';
import { prepareStoryThumbnail } from '../utils/storyThumbnail';

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
  const [isAdult, setIsAdult] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(requestedDraftId);
  const [draftLoading, setDraftLoading] = useState(Boolean(requestedDraftId));
  const [draftLoadError, setDraftLoadError] = useState('');
  const [editorChanged, setEditorChanged] = useState(false);
  const changeVersionRef = useRef(0);
  const loadedDraftIdRef = useRef<string | null>(null);
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
    if (loadedDraftIdRef.current === requestedDraftId) {
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
      setIsAdult(story.isAdult);
      setSourceUrl(story.sourceUrl || '');
      setThumbnailPath(story.thumbnailPath || '');
      setEditorChanged(false);
      loadedDraftIdRef.current = story.id;
    }).finally(() => {
      if (active) setDraftLoading(false);
    });

    return () => { active = false; };
  }, [requestedDraftId, user?.id]);

  const requiresApproval = settings.requireApprovalForStories && user?.role !== 'admin' && !user?.isVerified;

  const publishStory = async () => {
    if (!user) return;
    const status = requiresApproval ? 'pending' : 'approved';
    const storyData = {
      title: title.trim(),
      content: content.trim(),
      authorId: user.id,
      authorName: user.username,
      authorVerified: user.isVerified,
      category,
      length,
      isAdult,
      sourceUrl: normalizeExternalHttpUrl(sourceUrl),
      thumbnailPath: thumbnailPath || undefined,
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

  const saveDraft = useCallback(async (automatic: boolean) => {
    if (!user || submitting || savingDraft || uploadingThumbnail) return;
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
    const normalizedSourceUrl = normalizeExternalHttpUrl(sourceUrl);
    if (sourceUrl.trim() && !normalizedSourceUrl) {
      setError('Source link must be a valid http:// or https:// URL.');
      return;
    }

    setSavingDraft(true);
    const versionAtStart = changeVersionRef.current;
    try {
      const storyData = {
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        authorName: user.username,
        authorVerified: user.isVerified,
        category,
        length,
        isAdult,
        sourceUrl: normalizedSourceUrl,
        thumbnailPath: thumbnailPath || undefined,
        status: 'draft' as const,
      };
      const saved = activeDraftId
        ? await db.updateStory(activeDraftId, storyData)
        : await db.addStory(storyData);
      if (!saved) throw new Error('Draft could not be saved');

      const savedLatestVersion = changeVersionRef.current === versionAtStart;
      if (savedLatestVersion) {
        setTitle(saved.title);
        setContent(saved.content);
        setSourceUrl(saved.sourceUrl || '');
        setThumbnailPath(saved.thumbnailPath || '');
        setEditorChanged(false);
        setSavedMessage(automatic
          ? 'Draft saved automatically.'
          : 'Draft saved. Only you and the moderation team can see it.');
      }
      setActiveDraftId(saved.id);
      loadedDraftIdRef.current = saved.id;
      if (!activeDraftId) navigate(`/add-story?draft=${saved.id}`, { replace: true });
    } catch {
      if (changeVersionRef.current === versionAtStart) setEditorChanged(false);
      setError(automatic
        ? 'Automatic draft save failed. Your text is still in the editor.'
        : 'Failed to save the draft. Make sure the required Supabase migrations have been applied.');
    } finally {
      setSavingDraft(false);
    }
  }, [activeDraftId, category, content, isAdult, length, navigate, savingDraft, settings.maxStoryLength, sourceUrl, submitting, thumbnailPath, title, uploadingThumbnail, user]);

  const handleSaveDraft = () => {
    void saveDraft(false);
  };

  const markEditorChanged = () => {
    changeVersionRef.current += 1;
    setEditorChanged(true);
    setSavedMessage('');
  };

  const handleThumbnailSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('The thumbnail image must be smaller than 5 MB.');
      return;
    }

    setUploadingThumbnail(true);
    setError('');
    setSavedMessage('');
    try {
      const preparedImage = await prepareStoryThumbnail(file);
      const path = await db.uploadStoryThumbnail(user.id, preparedImage);
      setThumbnailPath(path);
      markEditorChanged();
    } catch {
      setError('The thumbnail could not be uploaded. Make sure the Supabase thumbnail migration has been applied.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMessage('');
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!content.trim()) { setError('Please write your story.'); return; }
    if (uploadingThumbnail) { setError('Please wait for the thumbnail upload to finish.'); return; }
    if (content.trim().length < 50) { setError('Story must be at least 50 characters.'); return; }
    if (content.trim().length > settings.maxStoryLength) { setError(`Story exceeds the maximum length of ${settings.maxStoryLength.toLocaleString()} characters.`); return; }
    if (sourceUrl.trim() && !normalizeExternalHttpUrl(sourceUrl)) { setError('Source link must be a valid http:// or https:// URL.'); return; }
    if (userStoryCount === 0 && !agreedToRules) {
      setPublishAfterRules(true);
      setShowRules(true);
      return;
    }
    await publishStory();
  };

  useEffect(() => {
    if (
      !editorChanged
      || draftLoading
      || submitting
      || savingDraft
      || (!title.trim() && !content.trim())
      || content.trim().length > settings.maxStoryLength
    ) return;

    const timeoutId = window.setTimeout(() => {
      void saveDraft(true);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [content, draftLoading, editorChanged, saveDraft, savingDraft, settings.maxStoryLength, submitting, title]);

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
        <button onClick={() => { setSubmitted(false); setTitle(''); setContent(''); setIsAdult(false); setSourceUrl(''); setThumbnailPath(''); setActiveDraftId(null); setEditorChanged(false); loadedDraftIdRef.current = null; navigate('/add-story', { replace: true }); }} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium">Write Another</button>
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
        <div><label className="block text-sm font-medium text-gray-300 mb-2">Title</label><input type="text" value={title} onChange={e => { setTitle(e.target.value); markEditorChanged(); }} placeholder="Enter your story title..." className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all" maxLength={200} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Category</label><select value={category} onChange={e => { setCategory(e.target.value); markEditorChanged(); }} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer">{categories.map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Story Length</label><select value={length} onChange={e => { setLength(e.target.value as StoryLength); markEditorChanged(); }} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer">{(Object.entries(LENGTH_LABELS) as [StoryLength, string][]).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select></div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <ImagePlus className="h-4 w-4 text-purple-400" /> Story Thumbnail <span className="font-normal text-gray-600">(optional)</span>
            </label>
            {uploadingThumbnail && <span className="flex items-center gap-1.5 text-xs text-purple-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</span>}
          </div>

          {thumbnailPath ? (
            <div className="overflow-hidden rounded-xl border border-purple-900/30 bg-gray-900/60">
              <div className="aspect-video w-full bg-gray-950">
                <img src={db.getStoryThumbnailUrl(thumbnailPath)} alt="Story thumbnail preview" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <p className="text-xs text-gray-500">The image will be displayed in story cards and on the story page.</p>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white">
                    Change Image
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailSelect} disabled={uploadingThumbnail} className="hidden" />
                  </label>
                  <button type="button" onClick={() => { setThumbnailPath(''); markEditorChanged(); }} disabled={uploadingThumbnail} className="flex items-center gap-1.5 rounded-lg bg-red-900/20 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/40 disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <label className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-all ${uploadingThumbnail ? 'cursor-wait border-purple-700/40 bg-purple-950/20' : 'border-purple-900/40 bg-gray-900/40 hover:border-purple-600/50 hover:bg-purple-950/20'}`}>
              {uploadingThumbnail ? <Loader2 className="mb-3 h-8 w-8 animate-spin text-purple-400" /> : <ImagePlus className="mb-3 h-8 w-8 text-purple-500" />}
              <span className="text-sm font-medium text-gray-300">{uploadingThumbnail ? 'Preparing thumbnail...' : 'Choose a thumbnail image'}</span>
              <span className="mt-1 text-xs text-gray-600">JPG, PNG or WebP up to 5 MB · automatically cropped to 16:9</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbnailSelect} disabled={uploadingThumbnail} className="hidden" />
            </label>
          )}
        </div>
        <label className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${isAdult ? 'border-red-700/50 bg-red-950/30' : 'border-purple-900/30 bg-gray-900/50 hover:border-purple-700/40'}`}>
          <input
            type="checkbox"
            checked={isAdult}
            onChange={e => { setIsAdult(e.target.checked); markEditorChanged(); }}
            className="mt-1 h-4 w-4 shrink-0 accent-red-600"
          />
          <ShieldAlert className={`mt-0.5 h-5 w-5 shrink-0 ${isAdult ? 'text-red-400' : 'text-gray-500'}`} />
          <span className="min-w-0">
            <span className={`block text-sm font-semibold ${isAdult ? 'text-red-300' : 'text-gray-300'}`}>18+ content</span>
            <span className="mt-1 block text-xs leading-relaxed text-gray-500">Mark this story as intended only for adults. Readers will see a warning before the story opens.</span>
          </span>
        </label>
        <div>
          <label htmlFor="story-source" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
            <Link2 className="h-4 w-4 text-purple-400" /> Source URL <span className="font-normal text-gray-600">(optional)</span>
          </label>
          <input
            id="story-source"
            type="url"
            inputMode="url"
            value={sourceUrl}
            onChange={e => { setSourceUrl(e.target.value); markEditorChanged(); }}
            placeholder="https://example.com/original-story"
            maxLength={2048}
            className="w-full rounded-xl border border-purple-900/30 bg-gray-900/80 px-4 py-3 text-gray-200 placeholder-gray-600 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
          />
          <p className="mt-2 text-xs leading-relaxed text-gray-600">Use this for translated stories or whenever the original source should be credited. Only http:// and https:// links are allowed.</p>
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
            onChange={value => { setContent(value); markEditorChanged(); }}
            placeholder="It was a dark and stormy night..."
            rows={16}
            allowLinks={false}
            aria-label="Your story content"
          />
        </div>
        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600">Changes are saved automatically after 2 seconds of inactivity. Drafts stay private. {requiresApproval ? 'Submitted stories are reviewed before publishing.' : 'Published stories become visible immediately.'}</p>
          <div className="flex w-full flex-nowrap gap-3 sm:w-auto sm:shrink-0 sm:justify-end">
            <button type="button" onClick={handleSaveDraft} disabled={savingDraft || submitting || uploadingThumbnail} className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-purple-900/30 bg-gray-800 px-3 py-3 text-sm font-medium text-gray-200 transition-all hover:bg-gray-700 disabled:opacity-60 sm:flex-none sm:px-5 sm:text-base">
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-purple-400" />}
              {activeDraftId ? 'Save Draft' : 'Save as Draft'}
            </button>
            <button type="submit" disabled={submitting || savingDraft || uploadingThumbnail} className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-3 text-sm font-medium text-white shadow-lg shadow-purple-900/30 transition-all hover:from-purple-500 hover:to-purple-600 disabled:opacity-60 sm:flex-none sm:px-6 sm:text-base">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{requiresApproval ? 'Submit for Review' : 'Publish Story'}</button>
          </div>
        </div>
      </form>
    </div></div>
  );
}
