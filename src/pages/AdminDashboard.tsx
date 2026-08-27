import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../store/AuthContext';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import type { User, Story, UserRole, ApprovalStatus, StoryStatus, ModApplication } from '../types';
import {
  LayoutDashboard, BookOpen, Users, CheckCircle, XCircle,
  Trash2, Shield, Clock, Eye, BarChart3, AlertTriangle, Edit3,
} from 'lucide-react';

type Tab = 'overview' | 'stories' | 'users' | 'names' | 'mods';

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>('overview');
  const [storyFilter, setStoryFilter] = useState<StoryStatus | 'all'>('pending');
  const [userFilter, setUserFilter] = useState<ApprovalStatus | 'all'>('pending');
  const [refresh, setRefresh] = useState(0);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allModApps, setAllModApps] = useState<ModApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm, dialogProps } = useConfirmDialog();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlTab = params.get('tab');
    if (urlTab === 'stories' || urlTab === 'users' || urlTab === 'overview' || urlTab === 'names' || urlTab === 'mods') {
      setTab(urlTab);
      if (urlTab === 'stories') setStoryFilter('pending');
      if (urlTab === 'users') setUserFilter('pending');
    }
  }, [location.search]);

  // Real-time refresh
  useEffect(() => {
    const handler = () => setRefresh(r => r + 1);
    window.addEventListener('fear-data-changed', handler);
    const interval = setInterval(handler, 2000);
    return () => {
      window.removeEventListener('fear-data-changed', handler);
      clearInterval(interval);
    };
  }, []);

  const bump = useCallback(() => setRefresh(r => r + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void Promise.all([db.getStories(), db.getUsers(), db.getModApplications()])
      .then(([stories, users, applications]) => {
        if (!active) return;
        setAllStories(stories);
        setAllUsers(users);
        setAllModApps(applications);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You need admin or moderator privileges.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  const pendingStories = allStories.filter(s => s.status === 'pending').length;
  const pendingUsers = allUsers.filter(u => u.status === 'pending').length;
  const approvedStories = allStories.filter(s => s.status === 'approved').length;
  const approvedUsers = allUsers.filter(u => u.status === 'approved').length;
  const pendingNames = allUsers.filter(u => u.pendingNameChange).length;
  const pendingModApps = allModApps.filter(a => a.status === 'pending').length;

  const filteredStories = storyFilter === 'all' ? allStories : allStories.filter(s => s.status === storyFilter);
  const filteredUsers = userFilter === 'all' ? allUsers : allUsers.filter(u => u.status === userFilter);
  const nameChangeUsers = allUsers.filter(u => u.pendingNameChange);

  const handleStoryAction = async (storyId: string, status: ApprovalStatus) => {
    await db.updateStory(storyId, { status });
    bump();
  };

  const handleDeleteStory = (story: Story) => {
    confirm({
      title: 'Delete Story',
      message: `Are you sure you want to permanently delete "${story.title}" by ${story.authorName}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete Story',
      onConfirm: async () => {
        await db.deleteStory(story.id);
        bump();
      },
    });
  };

  const handleUserAction = async (userId: string, status: ApprovalStatus) => {
    await db.updateUser(userId, { status });
    bump();
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await db.updateUser(userId, { role });
    bump();
  };

  const handleDeleteUser = (targetUser: User) => {
    confirm({
      title: 'Delete User',
      message: `Are you sure you want to permanently delete the user "${targetUser.username}" and all their data? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete User',
      onConfirm: async () => {
        await db.deleteUser(targetUser.id);
        bump();
      },
    });
  };

  const handleApproveNameChange = async (targetUser: User) => {
    if (!targetUser.pendingNameChange) return;
    // Update username in all their stories too
    const userStories = await db.getStoriesByAuthor(targetUser.id);
    await Promise.all(userStories.map(s => db.updateStory(s.id, { authorName: targetUser.pendingNameChange! })));
    await db.updateUser(targetUser.id, { username: targetUser.pendingNameChange, pendingNameChange: undefined });
    bump();
  };

  const handleRejectNameChange = async (targetUser: User) => {
    await db.updateUser(targetUser.id, { pendingNameChange: undefined });
    bump();
  };

  const handleApproveModApp = async (appId: string, userId: string) => {
    await db.updateModApplication(appId, { status: 'approved' });
    await db.updateUser(userId, { role: 'moderator' });
    bump();
  };

  const handleRejectModApp = async (appId: string) => {
    await db.updateModApplication(appId, { status: 'rejected' });
    bump();
  };

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'stories', label: 'Stories', icon: BookOpen, badge: pendingStories },
    { id: 'users', label: 'Users', icon: Users, badge: pendingUsers },
    { id: 'names', label: 'Name Changes', icon: Edit3, badge: pendingNames },
    ...(isAdmin ? [{ id: 'mods' as const, label: 'Mod Applications', icon: Shield, badge: pendingModApps }] : []),
  ];

  return (
    <div className="min-h-screen">
      <ConfirmDialog {...dialogProps} />

      {loading && (
        <div className="fixed inset-x-0 top-16 z-40 h-0.5 overflow-hidden bg-purple-950">
          <div className="h-full w-1/2 animate-pulse bg-purple-500" />
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-900/20 to-fear-950 border-b border-purple-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <LayoutDashboard className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500 ml-9">
            {isAdmin ? 'Full administrative access' : 'Moderator access — manage stories and users'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 bg-gray-900/50 rounded-xl p-1 border border-purple-900/20 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  tab === t.id ? 'bg-white/20' : 'bg-yellow-600 text-white'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Pending Stories', value: pendingStories, color: 'text-yellow-400', icon: Clock },
                { label: 'Approved Stories', value: approvedStories, color: 'text-green-400', icon: BookOpen },
                { label: 'Pending Users', value: pendingUsers, color: 'text-yellow-400', icon: Clock },
                { label: 'Total Users', value: approvedUsers, color: 'text-blue-400', icon: Users },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-900/50 border border-purple-900/20 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            {pendingStories > 0 && (
              <div className="bg-yellow-900/10 border border-yellow-800/30 rounded-xl p-5 mb-4">
                <h3 className="text-yellow-400 font-medium flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" /> Pending Stories
                </h3>
                <p className="text-sm text-gray-400">
                  {pendingStories} {pendingStories === 1 ? 'story needs' : 'stories need'} review.{' '}
                  <button onClick={() => { setTab('stories'); setStoryFilter('pending'); }} className="text-purple-400 hover:text-purple-300">
                    Review now →
                  </button>
                </p>
              </div>
            )}

            {pendingUsers > 0 && (
              <div className="bg-yellow-900/10 border border-yellow-800/30 rounded-xl p-5 mb-4">
                <h3 className="text-yellow-400 font-medium flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" /> Pending Users
                </h3>
                <p className="text-sm text-gray-400">
                  {pendingUsers} {pendingUsers === 1 ? 'user needs' : 'users need'} approval.{' '}
                  <button onClick={() => { setTab('users'); setUserFilter('pending'); }} className="text-purple-400 hover:text-purple-300">
                    Review now →
                  </button>
                </p>
              </div>
            )}

            {pendingNames > 0 && (
              <div className="bg-purple-900/10 border border-purple-800/30 rounded-xl p-5 mb-4">
                <h3 className="text-purple-400 font-medium flex items-center gap-2 mb-1">
                  <Edit3 className="h-4 w-4" /> Pending Name Changes
                </h3>
                <p className="text-sm text-gray-400">
                  {pendingNames} name {pendingNames === 1 ? 'change request' : 'change requests'} pending.{' '}
                  <button onClick={() => setTab('names')} className="text-purple-400 hover:text-purple-300">
                    Review now →
                  </button>
                </p>
              </div>
            )}

            {pendingModApps > 0 && (
              <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-5">
                <h3 className="text-amber-400 font-medium flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4" /> Pending Mod Applications
                </h3>
                <p className="text-sm text-gray-400">
                  {pendingModApps} {pendingModApps === 1 ? 'user wants' : 'users want'} to become a moderator.{' '}
                  <button onClick={() => setTab('mods')} className="text-amber-400 hover:text-amber-300">
                    Review now →
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Stories Tab ── */}
        {tab === 'stories' && (
          <div className="animate-fade-in">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {(['all', 'draft', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStoryFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    storyFilter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f} ({f === 'all' ? allStories.length : allStories.filter(s => s.status === f).length})
                </button>
              ))}
            </div>

            {filteredStories.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No stories found.</div>
            ) : (
              <div className="space-y-3">
                {filteredStories.map(story => (
                  <StoryRow
                    key={story.id}
                    story={story}
                    isAdmin={isAdmin}
                    onApprove={() => handleStoryAction(story.id, 'approved')}
                    onReject={() => handleStoryAction(story.id, 'rejected')}
                    onDelete={() => handleDeleteStory(story)}
                    onView={() => navigate(`/story/${story.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ── */}
        {tab === 'users' && (
          <div className="animate-fade-in">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                    userFilter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f} ({f === 'all' ? allUsers.length : allUsers.filter(u => u.status === f).length})
                </button>
              ))}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No users found.</div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(u => (
                  <UserRow
                    key={u.id}
                    targetUser={u}
                    isAdmin={isAdmin}
                    currentUserId={user.id}
                    onApprove={() => handleUserAction(u.id, 'approved')}
                    onReject={() => handleUserAction(u.id, 'rejected')}
                    onRoleChange={(role) => handleRoleChange(u.id, role)}
                    onDelete={() => handleDeleteUser(u)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Name Changes Tab ── */}
        {tab === 'names' && (
          <div className="animate-fade-in">
            {nameChangeUsers.length === 0 ? (
              <div className="text-center py-16">
                <Edit3 className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No pending name change requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nameChangeUsers.map(u => (
                  <div
                    key={u.id}
                    className="bg-gray-900/50 border border-purple-900/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white text-lg font-bold uppercase shrink-0 overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          u.username[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-400 line-through text-sm">{u.username}</span>
                          <span className="text-gray-600">→</span>
                          <span className="text-purple-300 font-semibold text-sm">{u.pendingNameChange}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{u.email}</span>
                          <span className="capitalize">{u.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveNameChange(u)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-all text-sm font-medium"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleRejectNameChange(u)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Mod Applications Tab ── */}
        {tab === 'mods' && isAdmin && (
          <div className="animate-fade-in">
            {allModApps.filter(a => a.status === 'pending').length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No pending moderator applications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allModApps.filter(a => a.status === 'pending').map(app => (
                  <div key={app.id} className="bg-gray-900/50 border border-amber-900/20 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-800 flex items-center justify-center text-white font-bold uppercase shrink-0 overflow-hidden">
                          {app.avatar ? (
                            <img src={app.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            app.username[0]
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-200">{app.username}</h4>
                          <p className="text-xs text-gray-500">{app.email} • Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveModApp(app.id, app.userId)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-all text-sm font-medium"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectModApp(app.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all text-sm font-medium"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-500 block mb-1">Why they want to be a mod:</span>
                          <p className="text-gray-300 bg-gray-950/50 p-3 rounded-lg border border-gray-800/50">{app.reason}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">Experience:</span>
                          <p className="text-gray-300 bg-gray-950/50 p-3 rounded-lg border border-gray-800/50">{app.experience}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-gray-500 block mb-1">Availability:</span>
                            <p className="text-gray-300 bg-gray-950/50 p-2 rounded-lg border border-gray-800/50">{app.availability}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Timezone:</span>
                            <p className="text-gray-300 bg-gray-950/50 p-2 rounded-lg border border-gray-800/50">{app.timezone}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Age Group:</span>
                            <p className="text-gray-300 bg-gray-950/50 p-2 rounded-lg border border-gray-800/50">{app.age}</p>
                          </div>
                        </div>
                        {app.extraInfo && (
                          <div>
                            <span className="text-gray-500 block mb-1">Extra Info:</span>
                            <p className="text-gray-300 bg-gray-950/50 p-3 rounded-lg border border-gray-800/50">{app.extraInfo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Story Row ── */
function StoryRow({ story, isAdmin, onApprove, onReject, onDelete, onView }: {
  story: Story;
  isAdmin: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const statusColors: Record<StoryStatus, string> = {
    draft: 'bg-purple-900/30 text-purple-400 border-purple-800/40',
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
    approved: 'bg-green-900/30 text-green-400 border-green-800/40',
    rejected: 'bg-red-900/30 text-red-400 border-red-800/40',
  };

  return (
    <div className="bg-gray-900/50 border border-purple-900/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-200 truncate">{story.title || 'Untitled Draft'}</h4>
          <span className={`px-2 py-0.5 text-xs rounded-lg border capitalize ${statusColors[story.status]}`}>
            {story.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>by {story.authorName}</span>
          <span className="px-1.5 py-0.5 bg-gray-800 rounded">{story.category}</span>
          <span className="capitalize">{story.length}</span>
          <span>{new Date(story.createdAt).toLocaleDateString()}</span>
          <span>♥ {story.likes}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onView} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-purple-300 hover:bg-gray-700 transition-all" title="View">
          <Eye className="h-4 w-4" />
        </button>
        {story.status !== 'draft' && story.status !== 'approved' && (
          <button onClick={onApprove} className="p-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-all" title="Approve">
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
        {story.status !== 'draft' && story.status !== 'rejected' && (
          <button onClick={onReject} className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all" title="Reject">
            <XCircle className="h-4 w-4" />
          </button>
        )}
        {/* Delete: admins can delete any, mods can delete rejected */}
        {(isAdmin || story.status === 'rejected') && (
          <button onClick={onDelete} className="p-2 rounded-lg bg-red-900/10 text-red-500 hover:bg-red-900/30 transition-all" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── User Row ── */
function UserRow({ targetUser, isAdmin, currentUserId, onApprove, onReject, onRoleChange, onDelete }: {
  targetUser: User;
  isAdmin: boolean;
  currentUserId: string;
  onApprove: () => void;
  onReject: () => void;
  onRoleChange: (role: UserRole) => void;
  onDelete: () => void;
}) {
  const isSelf = targetUser.id === currentUserId;
  const statusColors: Record<ApprovalStatus, string> = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
    approved: 'bg-green-900/30 text-green-400 border-green-800/40',
    rejected: 'bg-red-900/30 text-red-400 border-red-800/40',
  };
  const roleColors: Record<string, string> = {
    user: 'text-blue-400',
    moderator: 'text-amber-400',
    admin: 'text-red-400',
  };

  return (
    <div className="bg-gray-900/50 border border-purple-900/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white text-sm font-bold uppercase shrink-0 overflow-hidden">
          {targetUser.avatar ? (
            <img src={targetUser.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            targetUser.username[0]
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-medium text-gray-200 truncate">{targetUser.username}</span>
            {targetUser.pendingNameChange && (
              <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
                → {targetUser.pendingNameChange}
              </span>
            )}
            {isSelf && <span className="text-xs text-gray-600">(you)</span>}
            <span className={`px-2 py-0.5 text-xs rounded-lg border capitalize ${statusColors[targetUser.status]}`}>
              {targetUser.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{targetUser.email}</span>
            <span className={`capitalize font-medium ${roleColors[targetUser.role] || ''}`}>
              <Shield className="h-3 w-3 inline mr-0.5" />
              {targetUser.role}
            </span>
            <span>{new Date(targetUser.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {targetUser.status !== 'approved' && (
          <button onClick={onApprove} className="p-2 rounded-lg bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-all" title="Approve">
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
        {targetUser.status !== 'rejected' && !isSelf && (
          <button onClick={onReject} className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-all" title="Reject">
            <XCircle className="h-4 w-4" />
          </button>
        )}
        {isAdmin && !isSelf && targetUser.status === 'approved' && (
          <select
            value={targetUser.role}
            onChange={e => onRoleChange(e.target.value as UserRole)}
            className="px-2 py-1.5 bg-gray-800 border border-purple-900/30 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
          >
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        )}
        {/* Delete: admins can delete any, mods can delete rejected */}
        {!isSelf && (isAdmin || targetUser.status === 'rejected') && (
          <button onClick={onDelete} className="p-2 rounded-lg bg-red-900/10 text-red-500 hover:bg-red-900/30 transition-all" title="Delete user">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
