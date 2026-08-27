import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../store/AuthContext';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import { ImageCropper } from '../components/ImageCropper';
import { stripFormatting } from '../components/FormattedContent';
import { AdultBadge } from '../components/AdultBadge';
import { VerifiedBadge } from '../components/VerifiedBadge';
import type { User, Story } from '../types';
import {
  User as UserIcon, Edit3, Save, X, BookOpen, Heart,
  Calendar, Shield, Clock, AlertCircle, Camera, Upload,
  Check, Trash2, ExternalLink, FileText,
} from 'lucide-react';

type ProfileTab = 'stories' | 'drafts' | 'liked';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, updateProfile, refreshUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { confirm, dialogProps } = useConfirmDialog();

  const isOwnProfile = !id || currentUser?.id === id;
  const [profileUser, setProfileUser] = useState<User | undefined>(
    isOwnProfile ? (currentUser ?? undefined) : undefined
  );
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [draftStories, setDraftStories] = useState<Story[]>([]);
  const [likedStories, setLikedStories] = useState<Story[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const handler = () => setDataVersion(v => v + 1);
    window.addEventListener('fear-data-changed', handler);
    return () => window.removeEventListener('fear-data-changed', handler);
  }, []);

  useEffect(() => {
    let active = true;
    const targetId = id || currentUser?.id;
    if (!targetId) {
      setProfileUser(undefined);
      setUserStories([]);
      setDraftStories([]);
      setLikedStories([]);
      setProfileLoading(false);
      return () => { active = false; };
    }

    setProfileLoading(true);
    void (async () => {
      const profile = isOwnProfile && currentUser ? currentUser : await db.getUserById(targetId);
      if (!active) return;
      setProfileUser(profile);
      if (!profile) {
        setUserStories([]);
        setDraftStories([]);
        setLikedStories([]);
        return;
      }

      const [authored, approved, drafts] = await Promise.all([
        db.getStoriesByAuthor(profile.id),
        db.getApprovedStories(),
        db.getDraftStoriesByAuthor(profile.id),
      ]);
      if (!active) return;
      const staffCanViewDrafts = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
      const canViewPrivateDrafts = currentUser?.id === profile.id || staffCanViewDrafts;
      setUserStories(isOwnProfile
        ? authored.filter(s => s.status !== 'draft')
        : authored.filter(s => s.status === 'approved'));
      setDraftStories(canViewPrivateDrafts ? drafts : []);
      setLikedStories(!isOwnProfile && profile.hideLikedStories
        ? []
        : approved.filter(s => profile.likedStories.includes(s.id)));
    })().finally(() => { if (active) setProfileLoading(false); });

    return () => { active = false; };
  }, [currentUser, dataVersion, id, isOwnProfile]);

  const [editing, setEditing] = useState(false);
  const [editTab, setEditTab] = useState<'profile' | 'settings'>('profile');
  const [hideLikedStories, setHideLikedStories] = useState(profileUser?.hideLikedStories || false);
  const [bio, setBio] = useState(profileUser?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profileUser?.avatar || '');
  const [youtube, setYoutube] = useState(profileUser?.youtube || '');
  const [instagram, setInstagram] = useState(profileUser?.instagram || '');
  const [newUsername, setNewUsername] = useState('');
  const [nameChangeStatus, setNameChangeStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [activeTab, setActiveTab] = useState<ProfileTab>('stories');
  const [youtubeError, setYoutubeError] = useState('');
  const [instagramError, setInstagramError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canViewDrafts = Boolean(
    profileUser
    && currentUser
    && (currentUser.id === profileUser.id || currentUser.role === 'admin' || currentUser.role === 'moderator')
  );

  useEffect(() => {
    if (activeTab === 'drafts' && !canViewDrafts) setActiveTab('stories');
  }, [activeTab, canViewDrafts]);

  // Image cropper state
  const [cropperImage, setCropperImage] = useState<string | null>(null);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-900 border-t-purple-400" />
      </div>
    );
  }

  if (!profileUser) {
    if (!id && !currentUser) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-300 mb-2">Login Required</h2>
            <p className="text-gray-500 mb-6">Please log in to view your profile.</p>
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-400 mb-2">User not found</h2>
          <Link to="/stories" className="text-purple-400 hover:text-purple-300 text-sm">← Back to stories</Link>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      confirm({
        title: 'Invalid File',
        message: 'Please select an image file (PNG, JPG, GIF, WebP).',
        variant: 'warning',
        confirmText: 'OK',
        onConfirm: () => {},
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      confirm({
        title: 'File Too Large',
        message: 'Please select an image smaller than 5MB.',
        variant: 'warning',
        confirmText: 'OK',
        onConfirm: () => {},
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // Open the cropper
      setCropperImage(result);
    };
    reader.readAsDataURL(file);

    // Reset the input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setAvatarPreview(croppedDataUrl);
    setCropperImage(null);
  };

  const handleCropCancel = () => {
    setCropperImage(null);
  };

  const validateYoutubeUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is fine
    const lower = url.trim().toLowerCase();
    return lower.includes('youtube.com') || lower.includes('youtu.be');
  };

  const validateInstagramUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is fine
    const lower = url.trim().toLowerCase();
    return lower.includes('instagram.com');
  };

  const startEditing = () => {
    setEditing(true);
    setEditTab('profile');
    setHideLikedStories(profileUser.hideLikedStories || false);
    setBio(profileUser.bio || '');
    setAvatarPreview(profileUser.avatar || '');
    setYoutube(profileUser.youtube || '');
    setInstagram(profileUser.instagram || '');
    setNewUsername('');
    setNameChangeStatus('idle');
    setYoutubeError('');
    setInstagramError('');
  };

  const handleSave = async () => {
    // Validate social links
    let hasError = false;
    if (!validateYoutubeUrl(youtube)) {
      setYoutubeError('Please enter a valid YouTube link (must contain youtube.com or youtu.be)');
      hasError = true;
    } else {
      setYoutubeError('');
    }
    if (!validateInstagramUrl(instagram)) {
      setInstagramError('Please enter a valid Instagram link (must contain instagram.com)');
      hasError = true;
    } else {
      setInstagramError('');
    }
    if (hasError) return;

    // Handle name change request if entered
    const trimmedName = newUsername.trim();
    if (trimmedName && trimmedName !== profileUser.username) {
      const existing = await db.getUserByUsername(trimmedName);
      if (existing && existing.id !== profileUser.id) {
        confirm({
          title: 'Username Taken',
          message: `The username "${trimmedName}" is already taken. Please choose a different one.`,
          variant: 'warning',
          confirmText: 'OK',
          onConfirm: () => {},
        });
        return;
      }
      setNameChangeStatus('submitting');
      await db.updateUser(profileUser.id, { pendingNameChange: trimmedName });
      setNameChangeStatus('submitted');
    }

    await updateProfile({
      bio: bio.trim(),
      avatar: avatarPreview,
      youtube: youtube.trim() || undefined,
      instagram: instagram.trim() || undefined,
      hideLikedStories,
    });
    await refreshUser();
    setEditing(false);
  };

  const handleCancelNameChange = async () => {
    await db.updateUser(profileUser.id, { pendingNameChange: undefined });
    await refreshUser();
  };

  const handleDeleteAccount = () => {
    confirm({
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action will permanently remove your profile and all your stories.',
      variant: 'danger',
      confirmText: 'Yes, Delete My Account',
      onConfirm: () => {
        // Second confirmation
        setTimeout(() => {
          confirm({
            title: '⚠️ Final Confirmation',
            message: 'This is your LAST CHANCE. Your account, all your stories, and all your data will be permanently deleted. This cannot be undone. Are you absolutely sure?',
            variant: 'danger',
            confirmText: 'DELETE EVERYTHING',
            onConfirm: async () => {
              await deleteAccount();
              navigate('/');
            },
          });
        }, 300);
      },
    });
  };

  const roleColors: Record<string, string> = {
    user: 'text-blue-400 bg-blue-900/20 border-blue-800/30',
    moderator: 'text-amber-400 bg-amber-900/20 border-amber-800/30',
    admin: 'text-red-400 bg-red-900/20 border-red-800/30',
  };

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    approved: 'text-green-400',
    rejected: 'text-red-400',
  };

  return (
    <div className="min-h-screen">
      <ConfirmDialog {...dialogProps} />

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Profile header */}
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 pt-12 pb-8 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-900 flex items-center justify-center text-white text-4xl font-bold shadow-2xl shadow-purple-900/50 overflow-hidden ring-2 ring-purple-700/50">
                {editing ? (
                  avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-28 w-28 object-cover" />
                  ) : (
                    profileUser.username[0].toUpperCase()
                  )
                ) : (
                  profileUser.avatar ? (
                    <img src={profileUser.avatar} alt="" className="h-28 w-28 object-cover" />
                  ) : (
                    profileUser.username[0].toUpperCase()
                  )
                )}
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white mb-1" />
                  <span className="text-xs text-white/80">Upload</span>
                </button>
              )}
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 h-8 w-8 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                  title="Upload photo"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{profileUser.username}</h1>
                {profileUser.isVerified && <VerifiedBadge className="[&>svg]:h-5 [&>svg]:w-5" />}
                {profileUser.pendingNameChange && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-900/30 border border-purple-800/30 rounded-lg text-xs text-purple-400">
                    <Clock className="h-3 w-3" />
                    → {profileUser.pendingNameChange}
                  </span>
                )}
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-lg border capitalize ${roleColors[profileUser.role] || ''}`}>
                  <Shield className="h-3 w-3 inline mr-1" />
                  {profileUser.role}
                </span>
              </div>

              {/* Bio - View mode */}
              {!editing && (
                <p className="text-gray-400 text-sm mb-3 max-w-lg">
                  {profileUser.bio || 'No bio yet.'}
                </p>
              )}

              {/* Social Links - View mode */}
              {!editing && (profileUser.youtube || profileUser.instagram) && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                  {profileUser.youtube && (
                    <a
                      href={profileUser.youtube.startsWith('http') ? profileUser.youtube : `https://${profileUser.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-800/30 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
                      </svg>
                      YouTube
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  )}
                  {profileUser.instagram && (
                    <a
                      href={profileUser.instagram.startsWith('http') ? profileUser.instagram : `https://${profileUser.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-900/20 border border-pink-800/30 rounded-lg text-xs text-pink-400 hover:text-pink-300 hover:bg-pink-900/30 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 5.8.1 4.9.3 4.1.6c-.8.3-1.5.7-2.2 1.4C1.2 2.6.8 3.3.6 4.1.3 4.9.1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.2 2.2.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.5C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.3-.1 2.2-.2 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.5-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.2-2.2-.5-2.9-.3-.8-.7-1.5-1.4-2.2C21.4 1.3 20.7.9 19.9.6c-.8-.3-1.6-.5-2.9-.5C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-10.8a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z"/>
                      </svg>
                      Instagram
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {userStories.filter(s => s.status === 'approved').length} published
                </span>
                <span className={`flex items-center gap-1 capitalize ${statusColors[profileUser.status] || ''}`}>
                  <Clock className="h-3.5 w-3.5" />
                  {profileUser.status}
                </span>
              </div>

              {isOwnProfile && !editing && (
                <div className="mt-4 flex gap-2 justify-center sm:justify-start">
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Section — tabbed panel */}
      {isOwnProfile && currentUser && editing && (
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <div className="bg-gray-900/50 border border-purple-900/20 rounded-xl overflow-hidden shadow-xl">
            {/* Tabs Header */}
            <div className="flex border-b border-purple-900/20">
              <button 
                onClick={() => setEditTab('profile')}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  editTab === 'profile' 
                    ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-900/20' 
                    : 'text-gray-400 hover:text-gray-300 bg-gray-900/30 hover:bg-gray-800/50'
                }`}
              >
                <Edit3 className="h-4 w-4" /> Edit Profile
              </button>
              <button 
                onClick={() => setEditTab('settings')}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  editTab === 'settings' 
                    ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-900/20' 
                    : 'text-gray-400 hover:text-gray-300 bg-gray-900/30 hover:bg-gray-800/50'
                }`}
              >
                <Shield className="h-4 w-4" /> Profile Settings
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Common Header / Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-800/50">
                <h3 className="text-base font-semibold text-white">
                  {editTab === 'profile' ? 'Profile Information' : 'Account Settings'}
                </h3>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    onClick={() => { setEditing(false); setAvatarPreview(profileUser.avatar); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>

              {editTab === 'profile' ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Profile Picture */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 flex items-center gap-1.5 font-medium uppercase tracking-wide">
                      <Camera className="h-3 w-3" /> Profile Picture
                    </label>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-900 flex items-center justify-center text-white text-xl font-bold overflow-hidden ring-1 ring-purple-700/50 shrink-0">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="" className="h-16 w-16 object-cover" />
                        ) : (
                          profileUser.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-purple-900/30 rounded-lg text-sm text-gray-300 transition-colors flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Choose Image
                          </button>
                          {avatarPreview && (
                            <button
                              onClick={() => setAvatarPreview('')}
                              className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">Max 5MB • JPG, PNG, GIF, WebP</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 flex items-center gap-1.5 font-medium uppercase tracking-wide">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={e => { if (e.target.value.length <= 160) setBio(e.target.value); }}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={160}
                      className="w-full px-3 py-2 bg-gray-800/80 border border-purple-900/30 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-600">Short bio about yourself</span>
                      <span className={`text-xs ${bio.length >= 150 ? 'text-amber-400' : 'text-gray-600'}`}>
                        {bio.length}/160
                      </span>
                    </div>
                  </div>

                  {/* Change Username */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 flex items-center gap-1.5 font-medium uppercase tracking-wide">
                      <UserIcon className="h-3 w-3" /> Change Username
                    </label>

                    {profileUser.pendingNameChange ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-800/50 border border-purple-900/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="text-gray-400">Current:</span>
                            <span className="text-gray-200 font-medium">{profileUser.username}</span>
                            <span className="text-gray-600">→</span>
                            <span className="text-purple-300 font-medium">{profileUser.pendingNameChange}</span>
                          </div>
                          <p className="text-xs text-yellow-500/80 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Waiting for admin approval
                          </p>
                        </div>
                        <button
                          onClick={handleCancelNameChange}
                          className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-900/10 hover:bg-red-900/20 rounded-lg transition-colors shrink-0 self-start sm:self-center"
                        >
                          Cancel Request
                        </button>
                      </div>
                    ) : nameChangeStatus === 'submitted' ? (
                      <div className="flex items-center gap-2 text-sm text-green-400 p-3 bg-green-900/10 border border-green-900/20 rounded-lg">
                        <Check className="h-4 w-4" />
                        Name change request submitted! Waiting for admin approval.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={newUsername}
                          onChange={e => setNewUsername(e.target.value)}
                          placeholder={`Current: ${profileUser.username}`}
                          maxLength={30}
                          className="flex-1 px-3 py-2 bg-gray-800/80 border border-purple-900/30 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all min-w-0"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-1.5">
                      Name changes require admin approval. Your old name stays active until approved.
                    </p>
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 flex items-center gap-1.5 font-medium uppercase tracking-wide">
                      <ExternalLink className="h-3 w-3" /> Social Links
                    </label>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-2 shrink-0 w-24">
                          <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
                          </svg>
                          <span className="text-sm text-gray-400">YouTube</span>
                        </div>
                        <input
                          type="text"
                          value={youtube}
                          onChange={e => { setYoutube(e.target.value); setYoutubeError(''); }}
                          placeholder="https://youtube.com/@yourchannel"
                          className={`flex-1 px-3 py-2 bg-gray-800/80 border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all min-w-0 ${
                            youtubeError ? 'border-red-500/60 focus:border-red-500/80' : 'border-purple-900/30 focus:border-purple-500/50'
                          }`}
                        />
                      </div>
                      {youtubeError && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          {youtubeError}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex items-center gap-2 shrink-0 w-24">
                          <svg className="h-4 w-4 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.2-.1-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 5.8.1 4.9.3 4.1.6c-.8.3-1.5.7-2.2 1.4C1.2 2.6.8 3.3.6 4.1.3 4.9.1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.2 2.2.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.5C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c1.3-.1 2.2-.2 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.5-2.9.1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.1-1.3-.2-2.2-.5-2.9-.3-.8-.7-1.5-1.4-2.2C21.4 1.3 20.7.9 19.9.6c-.8-.3-1.6-.5-2.9-.5C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zM12 16a4 4 0 110-8 4 4 0 010 8zm6.4-10.8a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z"/>
                          </svg>
                          <span className="text-sm text-gray-400">Instagram</span>
                        </div>
                        <input
                          type="text"
                          value={instagram}
                          onChange={e => { setInstagram(e.target.value); setInstagramError(''); }}
                          placeholder="https://instagram.com/yourprofile"
                          className={`flex-1 px-3 py-2 bg-gray-800/80 border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-all min-w-0 ${
                            instagramError ? 'border-red-500/60 focus:border-red-500/80' : 'border-purple-900/30 focus:border-purple-500/50'
                          }`}
                        />
                      </div>
                      {instagramError && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          {instagramError}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1.5">
                      Links will only be shown on your profile when filled in.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {/* Privacy Settings */}
                  <div>
                    <label className="text-xs text-gray-500 mb-3 flex items-center gap-1.5 font-medium uppercase tracking-wide">
                      <Shield className="h-3 w-3" /> Privacy Settings
                    </label>
                    <div className="p-4 bg-gray-800/30 border border-gray-800/50 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center mt-0.5">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={hideLikedStories}
                            onChange={(e) => setHideLikedStories(e.target.checked)}
                          />
                          <div className={`w-10 h-5.5 rounded-full transition-colors ${hideLikedStories ? 'bg-purple-600' : 'bg-gray-700'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-transform ${hideLikedStories ? 'translate-x-4.5' : 'translate-x-0'}`} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Hide my liked stories</span>
                          <p className="text-xs text-gray-500 mt-0.5">Other users won't be able to see the stories you've liked. You will still see them.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-2">
                    <label className="text-xs text-red-500 mb-3 flex items-center gap-1.5 font-medium uppercase tracking-wide">
                      <AlertCircle className="h-3 w-3" /> Danger Zone
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-sm text-red-200 font-medium">Delete Account</p>
                        <p className="text-xs text-red-400/70 mt-1">Permanently remove your account and all your stories. This cannot be undone.</p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-800/50 text-red-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content tabs */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-1 mb-6 bg-gray-900/50 rounded-xl p-1 border border-purple-900/20 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stories' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {isOwnProfile ? 'My Stories' : 'Stories'} ({userStories.length})
          </button>
          {canViewDrafts && (
            <button
              onClick={() => setActiveTab('drafts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'drafts' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              Drafts ({draftStories.length})
            </button>
          )}
          {(!profileUser.hideLikedStories || isOwnProfile) && (
            <button
              onClick={() => setActiveTab('liked')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'liked' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Heart className="h-4 w-4" />
              Liked ({likedStories.length})
            </button>
          )}
        </div>

        {activeTab === 'stories' && (
          <div className="space-y-3 animate-fade-in">
            {userStories.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No stories yet.</p>
                {isOwnProfile && (
                  <Link to="/add-story" className="inline-block mt-3 text-sm text-purple-400 hover:text-purple-300">
                    Write your first story →
                  </Link>
                )}
              </div>
            ) : (
              userStories.map(story => (
                <Link
                  key={story.id}
                  to={`/story/${story.id}`}
                  className="block bg-gray-900/50 border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                          {story.title}
                        </h4>
                        {isOwnProfile && (
                          <span className={`px-2 py-0.5 text-xs rounded capitalize ${
                            story.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                            story.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            {story.status}
                          </span>
                        )}
                        {story.isAdult && <AdultBadge />}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">{stripFormatting(story.content).substring(0, 100)}...</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                      <Heart className="h-3 w-3" /> {story.likes}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'drafts' && canViewDrafts && (
          <div className="space-y-3 animate-fade-in">
            {draftStories.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No draft stories yet.</p>
                {isOwnProfile && (
                  <Link to="/add-story" className="inline-block mt-3 text-sm text-purple-400 hover:text-purple-300">
                    Start a new draft →
                  </Link>
                )}
              </div>
            ) : (
              draftStories.map(story => (
                <Link
                  key={story.id}
                  to={isOwnProfile ? `/add-story?draft=${story.id}` : `/story/${story.id}`}
                  className="block bg-gray-900/50 border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all group"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                          {story.title || 'Untitled Draft'}
                        </h4>
                        <span className="px-2 py-0.5 text-xs rounded bg-purple-900/30 text-purple-400">
                          draft
                        </span>
                        {story.isAdult && <AdultBadge />}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {stripFormatting(story.content).substring(0, 100) || 'This draft does not contain any story text yet.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                      <Clock className="h-3 w-3" />
                      Edited {new Date(story.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'liked' && (
          <div className="space-y-3 animate-fade-in">
            {likedStories.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No liked stories yet.</p>
                <Link to="/stories" className="inline-block mt-3 text-sm text-purple-400 hover:text-purple-300">
                  Discover stories →
                </Link>
              </div>
            ) : (
              likedStories.map(story => (
                <Link
                  key={story.id}
                  to={`/story/${story.id}`}
                  className="block bg-gray-900/50 border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                          {story.title}
                        </h4>
                        {story.isAdult && <AdultBadge />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">by {story.authorName}{story.authorVerified && <VerifiedBadge className="[&>svg]:h-3.5 [&>svg]:w-3.5" />}</span>
                        <span className="px-1.5 py-0.5 bg-gray-800 rounded">{story.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-red-400 shrink-0">
                      <Heart className="h-3 w-3 fill-red-400" /> {story.likes}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
