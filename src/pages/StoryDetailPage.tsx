import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../store/AuthContext';
import { LENGTH_LABELS, getCategoryColor } from '../types';
import { getSettings } from '../store/settings';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import { FormattedContent } from '../components/FormattedContent';
import { normalizeExternalHttpUrl } from '../utils/externalUrl';
import type { Story } from '../types';
import {
  Heart, Clock, ArrowLeft, BookOpen, User, Trash2,
  CheckCircle, XCircle, Shield, AlertTriangle, Edit3, ShieldAlert, ExternalLink,
} from 'lucide-react';

export function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [adultWarningAccepted, setAdultWarningAccepted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  // Like animation state
  const [likeAnim, setLikeAnim] = useState<'bounce' | 'unbounce' | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [showFloatText, setShowFloatText] = useState(false);

  const settings = getSettings();

  useEffect(() => {
    if (!id) return;
    setAdultWarningAccepted(false);
    db.getStoryById(id).then(s => {
      if (s) {
        setStory(s);
        if (user) setLiked(s.likedBy.includes(user.id));
      }
    });
  }, [id, user]);

  useEffect(() => {
    if (!story?.isAdult || adultWarningAccepted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [adultWarningAccepted, story?.isAdult]);

  const handleLike = async () => {
    if (!user || !story) return;
    const wasLiked = liked;
    const result = await db.toggleLike(story.id, user.id);
    if (result) {
      setStory(result.story);
      const nowLiked = result.story.likedBy.includes(user.id);
      setLiked(nowLiked);
      await refreshUser();

      // Trigger animations
      if (nowLiked && !wasLiked) {
        setLikeAnim('bounce');
        setShowParticles(true);
        setShowFloatText(true);
        setTimeout(() => setLikeAnim(null), 400);
        setTimeout(() => setShowParticles(false), 500);
        setTimeout(() => setShowFloatText(false), 600);
      } else if (!nowLiked && wasLiked) {
        setLikeAnim('unbounce');
        setTimeout(() => setLikeAnim(null), 300);
      }
    }
  };

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleDelete = () => {
    if (!story) return;
    confirm({
      title: 'Delete Story',
      message: `Are you sure you want to permanently delete "${story.title}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete Story',
      onConfirm: async () => {
        await db.deleteStory(story.id);
        navigate('/stories');
      },
    });
  };

  const handleApprove = () => {
    if (!story) return;
    confirm({
      title: 'Approve Story',
      message: `Approve "${story.title}" by ${story.authorName}? It will become publicly visible on the Stories page.`,
      variant: 'success',
      confirmText: 'Approve',
      onConfirm: async () => {
        const updated = await db.updateStory(story.id, { status: 'approved' });
        if (updated) {
          setStory(updated);
          showFeedback('Story approved successfully!');
        }
      },
    });
  };

  const handleReject = () => {
    if (!story) return;
    confirm({
      title: 'Reject Story',
      message: `Reject "${story.title}" by ${story.authorName}? The story will be hidden from the public.`,
      variant: 'warning',
      confirmText: 'Reject',
      onConfirm: async () => {
        const updated = await db.updateStory(story.id, { status: 'rejected' });
        if (updated) {
          setStory(updated);
          showFeedback('Story rejected.');
        }
      },
    });
  };

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-400 mb-2">Story not found</h2>
          <Link to="/stories" className="text-purple-400 hover:text-purple-300 text-sm">
            ← Back to stories
          </Link>
        </div>
      </div>
    );
  }

  if (story.isAdult && !adultWarningAccepted) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 py-4 sm:py-6">
        <div className="w-full max-w-lg rounded-2xl border border-red-900/50 bg-gradient-to-br from-gray-950 to-red-950/30 p-5 text-center shadow-2xl shadow-red-950/30 sm:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-800/50 bg-red-950/50 sm:mb-5 sm:h-20 sm:w-20">
            <ShieldAlert className="h-8 w-8 text-red-400 sm:h-10 sm:w-10" />
          </div>
          <span className="mb-3 inline-flex rounded-lg border border-red-800/50 bg-red-900/30 px-3 py-1 text-sm font-bold text-red-300">18+</span>
          <h1 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl">Adult Content Warning</h1>
          <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-gray-400 sm:mb-7 sm:text-base">
            This story is marked as 18+ and may contain content intended only for adult readers. Do you want to continue?
          </p>
          <div className="flex flex-row justify-center gap-3">
            <button
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/stories')}
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-purple-900/30 bg-gray-900 px-3 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-gray-800 hover:text-white sm:flex-none sm:px-6 sm:text-base"
            >
              <ArrowLeft className="h-4 w-4" /> Go Back
            </button>
            <button
              onClick={() => setAdultWarningAccepted(true)}
              className="flex-1 whitespace-nowrap rounded-xl bg-gradient-to-r from-red-700 to-red-800 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition-all hover:from-red-600 hover:to-red-700 sm:flex-none sm:px-6 sm:text-base"
            >
              Continue to Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  const catColor = getCategoryColor(story.category);
  const readTime = story.length === 'short' ? '< 5 min' : story.length === 'medium' ? '5-15 min' : '15+ min';
  const safeSourceUrl = normalizeExternalHttpUrl(story.sourceUrl || '');

  const isAuthor = user && user.id === story.authorId;
  const isMod = user && (user.role === 'moderator' || user.role === 'admin');
  const isAdmin = user?.role === 'admin';
  const canDelete = isAuthor || isAdmin;
  const canModerate = isMod;

  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    draft: { bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-800/40', label: 'Private Draft' },
    pending: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-800/40', label: 'Pending Review' },
    approved: { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-800/40', label: 'Approved' },
    rejected: { bg: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-800/40', label: 'Rejected' },
  };

  const stStatus = statusConfig[story.status] || statusConfig.pending;

  return (
    <div className="min-h-screen">
      <ConfirmDialog {...dialogProps} />

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-20 right-4 z-50 animate-slide-down">
          <div className="px-5 py-3 bg-gray-900 border border-purple-900/40 rounded-xl shadow-2xl shadow-purple-900/30 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm text-gray-200">{actionFeedback}</span>
          </div>
        </div>
      )}

      {/* Moderation Banner — shows if story is not approved and user can moderate */}
      {story.status !== 'approved' && (canModerate || isAuthor) && (
        <div className={`${stStatus.bg} border-b ${stStatus.border} px-4 py-3`}>
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${stStatus.text}`} />
              <span className={`text-sm font-medium ${stStatus.text}`}>
                {story.status === 'draft'
                  ? 'This is a private draft and has not been submitted'
                  : story.status === 'pending'
                    ? 'This story is pending review'
                    : 'This story has been rejected'}
              </span>
            </div>
            {canModerate && story.status !== 'draft' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 hover:bg-green-900/50 border border-green-800/40 text-green-400 text-xs font-medium rounded-lg transition-all"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </button>
                {story.status === 'pending' && (
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-400 text-xs font-medium rounded-lg transition-all"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 py-12 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-purple-300 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${catColor.bg} ${catColor.text} text-sm font-medium rounded-lg border ${catColor.border}`}>
              <span className={`h-2 w-2 rounded-full ${catColor.dot}`} />
              {story.category}
            </span>
            <span className="px-3 py-1 bg-gray-800/80 text-gray-400 text-sm rounded-lg capitalize">
              {LENGTH_LABELS[story.length]}
            </span>
            {story.isAdult && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-900/30 px-3 py-1 text-sm font-bold text-red-300">
                <ShieldAlert className="h-3.5 w-3.5" /> 18+
              </span>
            )}
            {/* Status badge visible to mods or author */}
            {(canModerate || isAuthor) && (
              <span className={`px-3 py-1 ${stStatus.bg} ${stStatus.text} text-sm rounded-lg border ${stStatus.border} capitalize flex items-center gap-1.5`}>
                <Shield className="h-3 w-3" />
                {stStatus.label}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {story.title || 'Untitled Draft'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <Link
              to={`/user/${story.authorId}`}
              className="flex items-center gap-2 hover:text-purple-300 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              {story.authorName}
            </Link>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(story.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {readTime} read
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {story.content ? (
          <FormattedContent
            content={story.content}
            allowLinks={false}
            className="story-content text-base text-gray-300 md:text-lg"
          />
        ) : (
          <p className="text-gray-600 italic">This draft does not contain any story text yet.</p>
        )}

        {safeSourceUrl && (
          <div className="mt-10 rounded-xl border border-purple-900/30 bg-gray-900/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-600">Source</p>
            <a
              href={safeSourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              referrerPolicy="no-referrer"
              className="inline-flex max-w-full items-start gap-2 text-sm text-purple-400 transition-colors hover:text-purple-300"
            >
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-all underline decoration-purple-700/60 underline-offset-4">{safeSourceUrl}</span>
            </a>
          </div>
        )}

        {/* Actions bar */}
        <div className="mt-12 pt-8 border-t border-purple-900/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Like + browse */}
            <div className="flex items-center gap-3">
              {story.status === 'approved' && (
                <button
                  onClick={user ? handleLike : () => navigate('/login')}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                    liked
                      ? 'bg-red-900/30 border border-red-700/50 text-red-400 shadow-lg shadow-red-900/20'
                      : 'bg-gray-900 border border-purple-900/30 text-gray-400 hover:text-red-400 hover:border-red-800/50'
                  }`}
                >
                {/* Particles */}
                {showParticles && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="absolute h-2 w-2 rounded-full bg-red-400 particle-1" />
                    <span className="absolute h-2 w-2 rounded-full bg-pink-400 particle-2" />
                    <span className="absolute h-1.5 w-1.5 rounded-full bg-red-300 particle-3" />
                    <span className="absolute h-1.5 w-1.5 rounded-full bg-pink-300 particle-4" />
                    <span className="absolute h-1 w-1 rounded-full bg-purple-400 particle-5" />
                    <span className="absolute h-1 w-1 rounded-full bg-red-500 particle-6" />
                  </div>
                )}
                {/* Float +1 text */}
                {showFloatText && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-red-400 text-sm font-bold float-up pointer-events-none">
                    +1
                  </span>
                )}
                  <Heart className={`h-5 w-5 transition-transform ${liked ? 'fill-red-400' : ''} ${likeAnim === 'bounce' ? 'like-bounce' : ''} ${likeAnim === 'unbounce' ? 'like-unbounce' : ''}`} />
                  {settings.showLikeCount ? (
                    <>{story.likes} {story.likes === 1 ? 'Like' : 'Likes'}</>
                  ) : (
                    liked ? 'Liked' : 'Like'
                  )}
                </button>
              )}

              <Link
                to="/stories"
                className="text-sm text-gray-500 hover:text-purple-300 transition-colors"
              >
                Browse more stories →
              </Link>
            </div>

            {/* Right: Moderation & Author actions */}
            <div className="flex items-center gap-2">
              {isAuthor && story.status === 'draft' && (
                <Link
                  to={`/add-story?draft=${story.id}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-900/20 border border-purple-800/40 text-purple-300 hover:bg-purple-900/40 rounded-xl text-sm font-medium transition-all"
                >
                  <Edit3 className="h-4 w-4" /> Continue Writing
                </Link>
              )}
              {/* Moderation buttons for mods/admins */}
              {canModerate && story.status === 'approved' && (
                <button
                  onClick={handleReject}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 border border-purple-900/30 text-gray-400 hover:text-amber-400 hover:border-amber-800/50 rounded-xl text-sm font-medium transition-all"
                >
                  <XCircle className="h-4 w-4" /> Unpublish
                </button>
              )}
              {canModerate && story.status === 'rejected' && (
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 border border-purple-900/30 text-gray-400 hover:text-green-400 hover:border-green-800/50 rounded-xl text-sm font-medium transition-all"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
              )}

              {/* Delete button for author or admin */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 border border-red-900/30 text-red-400 hover:bg-red-900/20 hover:border-red-700/50 rounded-xl text-sm font-medium transition-all"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
