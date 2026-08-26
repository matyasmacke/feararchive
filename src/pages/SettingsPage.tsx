import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../store/db';
import { useAuth } from '../store/AuthContext';
import { fetchSettings, getSettings, saveSettings as persistSettings } from '../store/settings';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import type { SiteSettings } from '../store/settings';
import type { CategoryConfig, ColorPreset, CategoryIcon } from '../types';
import { COLOR_PRESETS, COLOR_PRESET_LABELS, COLOR_PRESET_HEX, DEFAULT_CATEGORIES, CATEGORY_ICONS } from '../types';
import { IconDisplay } from '../components/IconDisplay';
import type { ChangelogEntry, Story, User } from '../types';
import {
  Settings, Shield, Trash2, AlertTriangle, CheckCircle,
  Database, Users, BookOpen, RotateCcw, Eye,
  Globe, Lock, Palette, Wrench, Layers,
  Plus, Pencil, GripVertical, RotateCw, Terminal, X, Calendar, Minus
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const { confirm, dialogProps } = useConfirmDialog();

  // Category management state
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatColor, setEditCatColor] = useState<ColorPreset>('purple');
  const [editCatIcon, setEditCatIcon] = useState<CategoryIcon | undefined>(undefined);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState<ColorPreset>('purple');
  const [newCatIcon, setNewCatIcon] = useState<CategoryIcon | undefined>(undefined);
  const [catError, setCatError] = useState('');

  // Changelog Editor state
  const [showChangelogEditor, setShowChangelogEditor] = useState(false);
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);
  const [editingChangelogId, setEditingChangelogId] = useState<string | null>(null);
  const [clTitle, setClTitle] = useState('');
  const [clDate, setClDate] = useState('');
  const [clChanges, setClChanges] = useState<string[]>([]);

  const bump = useCallback(() => setRefresh(r => r + 1), []);

  useEffect(() => {
    const handler = () => bump();
    window.addEventListener('fear-data-changed', handler);
    return () => window.removeEventListener('fear-data-changed', handler);
  }, [bump]);

  useEffect(() => {
    let active = true;
    void Promise.all([db.getUsers(), db.getStories()]).then(([users, stories]) => {
      if (!active) return;
      setAllUsers(users);
      setAllStories(stories);
    });
    return () => { active = false; };
  }, [refresh]);

  const dbStats = useMemo(() => {
    const storageUsed = new Blob([JSON.stringify(allUsers), JSON.stringify(allStories), JSON.stringify(settings)]).size;
    return {
      totalUsers: allUsers.length,
      approvedUsers: allUsers.filter(u => u.status === 'approved').length,
      pendingUsers: allUsers.filter(u => u.status === 'pending').length,
      rejectedUsers: allUsers.filter(u => u.status === 'rejected').length,
      totalStories: allStories.length,
      approvedStories: allStories.filter(s => s.status === 'approved').length,
      pendingStories: allStories.filter(s => s.status === 'pending').length,
      rejectedStories: allStories.filter(s => s.status === 'rejected').length,
      storageUsed: (storageUsed / 1024).toFixed(1),
    };
  }, [allStories, allUsers, settings]);

  // Count stories per category
  const storiesPerCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of allStories) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [allStories]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-300 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">Only administrators can access site settings.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSave = async () => {
    await persistSettings(settings);
    flash();
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (typeof value === 'boolean') {
      persistSettings(updated);
      flash();
    }
  };

  // ── Category management helpers ──
  const saveCategories = async (cats: CategoryConfig[]) => {
    const updated = { ...settings, categories: cats };
    setSettings(updated);
    await persistSettings(updated);
    flash();
  };

  const handleAddCategory = async () => {
    setCatError('');
    const name = newCatName.trim();
    if (!name) { setCatError('Category name is required.'); return; }
    if (settings.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setCatError('A category with this name already exists.');
      return;
    }
    const newCat: CategoryConfig = {
      name,
      description: newCatDesc.trim() || `Stories in the ${name} category.`,
      colorKey: newCatColor,
      icon: newCatIcon,
    };
    await saveCategories([...settings.categories, newCat]);
    setNewCatName('');
    setNewCatDesc('');
    setNewCatColor('purple');
    setNewCatIcon(undefined);
    setAddingCategory(false);
    setCatError('');
  };

  const handleEditCategory = (idx: number) => {
    const cat = settings.categories[idx];
    setEditingCatIdx(idx);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description);
    setEditCatColor(cat.colorKey);
    setEditCatIcon(cat.icon);
    setCatError('');
  };

  const handleSaveEdit = async () => {
    if (editingCatIdx === null) return;
    setCatError('');
    const name = editCatName.trim();
    if (!name) { setCatError('Category name is required.'); return; }
    const oldName = settings.categories[editingCatIdx].name;
    // Check duplicates (excluding self)
    if (settings.categories.some((c, i) => i !== editingCatIdx && c.name.toLowerCase() === name.toLowerCase())) {
      setCatError('A category with this name already exists.');
      return;
    }
    const updated = [...settings.categories];
    updated[editingCatIdx] = {
      name,
      description: editCatDesc.trim() || `Stories in the ${name} category.`,
      colorKey: editCatColor,
      icon: editCatIcon,
    };
    // Also update existing stories that used the old name
    if (oldName !== name) {
      for (const s of allStories) {
        if (s.category === oldName) {
          await db.updateStory(s.id, { category: name });
        }
      }
    }
    await saveCategories(updated);
    setEditingCatIdx(null);
    setCatError('');
  };

  const handleDeleteCategory = (idx: number) => {
    const cat = settings.categories[idx];
    const storyCount = storiesPerCategory[cat.name] || 0;
    confirm({
      title: `Delete "${cat.name}" Category`,
      message: storyCount > 0
        ? `This category has ${storyCount} ${storyCount === 1 ? 'story' : 'stories'} assigned to it. Those stories will keep their category label, but it won't appear in the category list anymore. Are you sure?`
        : `Are you sure you want to delete the "${cat.name}" category? This action cannot be undone.`,
      variant: storyCount > 0 ? 'warning' : 'danger',
      confirmText: 'Delete Category',
      onConfirm: async () => {
        const updated = settings.categories.filter((_, i) => i !== idx);
        await saveCategories(updated);
        if (editingCatIdx === idx) setEditingCatIdx(null);
      },
    });
  };

  const handleMoveCategory = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= settings.categories.length) return;
    const updated = [...settings.categories];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    saveCategories(updated);
    if (editingCatIdx === idx) setEditingCatIdx(newIdx);
    else if (editingCatIdx === newIdx) setEditingCatIdx(idx);
  };

  const handleResetCategories = () => {
    confirm({
      title: 'Reset Categories to Defaults',
      message: 'This will restore the original 8 categories and remove any custom ones. Stories with custom categories will keep their label. Continue?',
      variant: 'warning',
      confirmText: 'Reset Categories',
      onConfirm: async () => {
        await saveCategories([...DEFAULT_CATEGORIES]);
      },
    });
  };

  const handleResetData = () => {
    confirm({
      title: 'Reset Entire Database',
      message: 'This will permanently erase stories, applications, changelogs, and every account except the currently logged-in administrator. Site settings will be restored to defaults. This action CANNOT be undone.',
      variant: 'danger',
      confirmText: 'Yes, Reset Everything',
      onConfirm: async () => {
        await db.resetDatabase();
        setSettings(await fetchSettings());
        bump();
      },
    });
  };

  const handleClearRejected = () => {
    confirm({
      title: 'Clear Rejected Items',
      message: 'This will permanently delete all rejected users and stories. Are you sure?',
      variant: 'warning',
      confirmText: 'Clear Rejected',
      onConfirm: async () => {
        await db.clearRejected();
        bump();
      },
    });
  };

  const handleApproveAllPending = () => {
    confirm({
      title: 'Approve All Pending',
      message: 'This will approve all pending stories and users at once. Continue?',
      variant: 'success',
      confirmText: 'Approve All',
      onConfirm: async () => {
        await db.approveAllPending();
        bump();
      },
    });
  };

  // ── Changelog Handlers ──
  useEffect(() => {
    if (showChangelogEditor) {
      void db.getChangelogs().then(setChangelogs);
    }
  }, [showChangelogEditor, refresh]);

  const handleOpenAddChangelog = () => {
    setEditingChangelogId('new');
    setClTitle('');
    setClDate(new Date().toISOString().split('T')[0]);
    setClChanges(['']);
  };

  const handleEditChangelog = (log: ChangelogEntry) => {
    setEditingChangelogId(log.id);
    setClTitle(log.title);
    setClDate(log.date.split('T')[0]);
    setClChanges([...log.changes]);
  };

  const handleSaveChangelog = async () => {
    if (!clTitle.trim()) return;
    const cleanChanges = clChanges.map(c => c.trim()).filter(c => c);
    if (cleanChanges.length === 0) return;

    if (editingChangelogId === 'new') {
      await db.addChangelog({ title: clTitle, date: new Date(clDate).toISOString(), changes: cleanChanges });
    } else if (editingChangelogId) {
      await db.updateChangelog(editingChangelogId, { title: clTitle, date: new Date(clDate).toISOString(), changes: cleanChanges });
    }
    bump();
    setEditingChangelogId(null);
  };

  const handleDeleteChangelog = (id: string) => {
    confirm({
      title: 'Delete Changelog',
      message: 'Are you sure you want to delete this changelog entry?',
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        await db.deleteChangelog(id);
        bump();
      }
    });
  };

  const updateClChange = (index: number, value: string) => {
    const newArr = [...clChanges];
    newArr[index] = value;
    setClChanges(newArr);
  };

  const addClChange = () => setClChanges([...clChanges, '']);
  const removeClChange = (index: number) => {
    if (clChanges.length <= 1) return;
    const newArr = clChanges.filter((_, i) => i !== index);
    setClChanges(newArr);
  };

  const allColorKeys = Object.keys(COLOR_PRESETS) as ColorPreset[];

  return (
    <div className="min-h-screen">
      <ConfirmDialog {...dialogProps} />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-fear-950 border-b border-purple-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Site Settings</h1>
                <p className="text-sm text-gray-500">Administrator controls & configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-400 animate-slide-down">
                  <CheckCircle className="h-4 w-4" /> Saved!
                </span>
              )}
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30 text-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Database Statistics */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Database Overview</h2>
            <span className="ml-auto text-xs text-gray-600">{dbStats.storageUsed} KB loaded</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Users" main={dbStats.totalUsers} sub={`${dbStats.approvedUsers} approved · ${dbStats.pendingUsers} pending`} color="text-blue-400" />
              <StatCard icon={BookOpen} label="Stories" main={dbStats.totalStories} sub={`${dbStats.approvedStories} approved · ${dbStats.pendingStories} pending`} color="text-purple-400" />
              <StatCard icon={AlertTriangle} label="Rejected Users" main={dbStats.rejectedUsers} sub="Awaiting cleanup" color="text-red-400" />
              <StatCard icon={AlertTriangle} label="Rejected Stories" main={dbStats.rejectedStories} sub="Awaiting cleanup" color="text-red-400" />
            </div>
          </div>
        </section>
        
        {/* Active Settings Status */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Active Configuration</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StatusBadge label="Registration" active={settings.allowRegistration} activeText="Open" inactiveText="Closed" />
              <StatusBadge label="Mod Applications" active={settings.allowModApplications} activeText="Open" inactiveText="Closed" />
              <StatusBadge label="User Approval" active={settings.requireApprovalForUsers} activeText="Required" inactiveText="Auto-approve" />
              <StatusBadge label="Story Approval" active={settings.requireApprovalForStories} activeText="Required" inactiveText="Auto-publish" />
              <StatusBadge label="Like Counts" active={settings.showLikeCount} activeText="Visible" inactiveText="Hidden" />
              <StatusBadge label="Maintenance" active={settings.maintenanceMode} activeText="Active" inactiveText="Off" warning />
              <StatusBadge label="Categories" active={true} activeText={`${settings.categories.length} configured`} inactiveText="" />
            </div>
          </div>
        </section>

        {/* General Settings */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">General</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={e => updateSetting('siteName', e.target.value)}
                className="w-full max-w-md px-4 py-2.5 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Site Description</label>
              <input
                type="text"
                value={settings.siteDescription}
                onChange={e => updateSetting('siteDescription', e.target.value)}
                className="w-full max-w-lg px-4 py-2.5 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Max Story Length (characters)</label>
              <input
                type="number"
                value={settings.maxStoryLength}
                onChange={e => updateSetting('maxStoryLength', parseInt(e.target.value) || 10000)}
                min={1000}
                max={500000}
                className="w-40 px-4 py-2.5 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
              />
            </div>
          </div>
        </section>

        {/* ── Category Management ── */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl">
          <div className="px-4 sm:px-6 py-4 border-b border-purple-900/20 bg-gray-900/50 rounded-t-2xl">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Categories</h2>
                <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 text-xs rounded-full font-medium">
                  {settings.categories.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetCategories}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all"
                  title="Reset to defaults"
                >
                  <RotateCw className="h-3 w-3" />
                  <span className="hidden xs:inline">Reset</span>
                </button>
                <button
                  onClick={() => { setAddingCategory(true); setCatError(''); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800/40 rounded-lg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Add</span> Category
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {catError && (
              <div className="mb-4 flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm animate-slide-down">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {catError}
              </div>
            )}

            {/* Add category form */}
            {addingCategory && (
              <div className="mb-5 p-4 bg-purple-950/20 border border-purple-800/30 rounded-xl animate-slide-down">
                <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> New Category
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Name *</label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="e.g. Body Horror"
                        maxLength={40}
                        className="w-full px-3 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Description</label>
                      <input
                        type="text"
                        value={newCatDesc}
                        onChange={e => setNewCatDesc(e.target.value)}
                        placeholder="Short description..."
                        maxLength={120}
                        className="w-full px-3 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Color</label>
                      <ColorPicker value={newCatColor} onChange={setNewCatColor} allColors={allColorKeys} />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Icon (optional)</label>
                      <IconPicker value={newCatIcon} onChange={setNewCatIcon} />
                    </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Add Category
                    </button>
                    <button
                      onClick={() => { setAddingCategory(false); setCatError(''); }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Category list */}
            <div className="space-y-2">
              {settings.categories.map((cat, idx) => {
                const isEditing = editingCatIdx === idx;
                const count = storiesPerCategory[cat.name] || 0;
                const presetColor = COLOR_PRESETS[cat.colorKey] || COLOR_PRESETS.purple;
                const hexColor = COLOR_PRESET_HEX[cat.colorKey] || '#a855f7';

                if (isEditing) {
                  return (
                    <div key={idx} className="p-4 bg-purple-950/20 border border-purple-700/40 rounded-xl animate-slide-down">
                      <h4 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
                        <Pencil className="h-3.5 w-3.5" /> Editing: {cat.name}
                      </h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Name *</label>
                            <input
                              type="text"
                              value={editCatName}
                              onChange={e => setEditCatName(e.target.value)}
                              maxLength={40}
                              className="w-full px-3 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Description</label>
                            <input
                              type="text"
                              value={editCatDesc}
                              onChange={e => setEditCatDesc(e.target.value)}
                              maxLength={120}
                              className="w-full px-3 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">Color</label>
                          <ColorPicker value={editCatColor} onChange={setEditCatColor} allColors={allColorKeys} />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">Icon (optional)</label>
                          <IconPicker value={editCatIcon} onChange={setEditCatIcon} />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => { setEditingCatIdx(null); setCatError(''); }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-gray-900/30 hover:bg-gray-900/50 border border-gray-800/30 hover:border-purple-900/30 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Drag handle / order */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => handleMoveCategory(idx, -1)}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <GripVertical className="h-3 w-3 rotate-90" style={{ transform: 'scaleY(-1)' }} />
                        </button>
                        <button
                          onClick={() => handleMoveCategory(idx, 1)}
                          disabled={idx === settings.categories.length - 1}
                          className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <GripVertical className="h-3 w-3 rotate-90" />
                        </button>
                      </div>

                      {/* Color dot */}
                      <div
                        className="h-4 w-4 rounded-full shrink-0 ring-2 ring-gray-800"
                        style={{ backgroundColor: hexColor }}
                      />

                      {/* Category info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {cat.icon && (
                            <IconDisplay icon={cat.icon} className="text-base" />
                          )}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${presetColor.bg} ${presetColor.text} text-xs font-medium rounded-lg border ${presetColor.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${presetColor.dot}`} />
                            {cat.name}
                          </span>
                          <span className="text-xs text-gray-600">
                            {count} {count === 1 ? 'story' : 'stories'}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{cat.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions — always visible on mobile, hover-reveal on desktop */}
                    <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 pl-10 sm:pl-0">
                      <button
                        onClick={() => handleEditCategory(idx)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-purple-400 hover:bg-purple-900/20 bg-gray-800/50 sm:bg-transparent rounded-lg transition-all"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sm:hidden">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(idx)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-red-900/20 bg-gray-800/50 sm:bg-transparent rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {settings.categories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No categories configured.</p>
                <button
                  onClick={() => setAddingCategory(true)}
                  className="mt-2 text-sm text-purple-400 hover:text-purple-300"
                >
                  Add your first category
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Moderation Settings */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Moderation</h2>
          </div>
          <div className="p-6 space-y-4">
            <ToggleSetting
              label="Require approval for new stories"
              description="Stories must be approved by a moderator or admin before publishing."
              checked={settings.requireApprovalForStories}
              onChange={v => updateSetting('requireApprovalForStories', v)}
              icon={BookOpen}
            />
            <ToggleSetting
              label="Require approval for new users"
              description="New user registrations must be approved before they can log in."
              checked={settings.requireApprovalForUsers}
              onChange={v => updateSetting('requireApprovalForUsers', v)}
              icon={Users}
            />
            <ToggleSetting
              label="Allow new registrations"
              description="When disabled, no new users can create accounts. The sign-up form will show an error."
              checked={settings.allowRegistration}
              onChange={v => updateSetting('allowRegistration', v)}
              icon={Lock}
              warning={!settings.allowRegistration}
              warningReversed
            />
            <ToggleSetting
              label="Allow moderator applications"
              description="When disabled, users will not be able to apply for moderator roles."
              checked={settings.allowModApplications}
              onChange={v => updateSetting('allowModApplications', v)}
              icon={Shield}
              warning={!settings.allowModApplications}
              warningReversed
            />
          </div>
        </section>

        {/* Display Settings */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Display</h2>
          </div>
          <div className="p-6 space-y-4">
            <ToggleSetting
              label="Show like counts"
              description="Display the number of likes on stories publicly."
              checked={settings.showLikeCount}
              onChange={v => updateSetting('showLikeCount', v)}
              icon={Eye}
            />
            <ToggleSetting
              label="Maintenance mode"
              description="Locks the entire site and shows a maintenance page. Only admins can log in. Non-admin users are logged out."
              checked={settings.maintenanceMode}
              onChange={v => updateSetting('maintenanceMode', v)}
              icon={Wrench}
              warning
            />
          </div>
        </section>

        {/* Community Rules */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Community Rules</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Story Writing Rules</label>
            <p className="text-xs text-gray-500 mb-3">These rules will be displayed to users the first time they try to publish a story, and on the public Rules page. You can use basic markdown.</p>
            <textarea
              value={settings.storyRules}
              onChange={e => updateSetting('storyRules', e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 transition-all text-sm font-mono resize-y"
            />
          </div>
        </section>

        {/* GDPR */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">GDPR Compliance</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">GDPR Statement</label>
            <p className="text-xs text-gray-500 mb-3">General Data Protection Regulation (GDPR) Compliance Statement</p>
            <textarea
              value={settings.gdprText}
              onChange={e => updateSetting('gdprText', e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 transition-all text-sm font-mono resize-y"
            />
          </div>
        </section>

        {/* Changelog Manager */}
        <section className="bg-gray-900/50 border border-purple-900/20 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-900/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Changelog Management</h2>
            </div>
            <button
              onClick={() => setShowChangelogEditor(!showChangelogEditor)}
              className="px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800/40 text-purple-300 rounded-lg text-sm font-medium transition-all"
            >
              {showChangelogEditor ? 'Close Editor' : 'Open Editor'}
            </button>
          </div>
          
          {showChangelogEditor && (
            <div className="p-6 border-b border-purple-900/20 bg-gray-900/80 animate-slide-down">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-400">Add or edit entries displayed on the public Changelog page.</p>
                {!editingChangelogId && (
                  <button
                    onClick={handleOpenAddChangelog}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add Entry
                  </button>
                )}
              </div>

              {editingChangelogId ? (
                <div className="bg-purple-950/20 border border-purple-700/40 rounded-xl p-5 mb-6">
                  <h3 className="text-sm font-medium text-purple-300 mb-4 flex items-center gap-2">
                    <Pencil className="h-4 w-4" /> 
                    {editingChangelogId === 'new' ? 'New Changelog Entry' : 'Edit Changelog Entry'}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Title / Version *</label>
                      <input
                        type="text"
                        value={clTitle}
                        onChange={e => setClTitle(e.target.value)}
                        placeholder="e.g. Version 1.2.0 - Dark Mode"
                        className="w-full px-3 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Date *</label>
                      <input
                        type="date"
                        value={clDate}
                        onChange={e => setClDate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs text-gray-400 mb-2">Changes *</label>
                    <div className="space-y-2">
                      {clChanges.map((change, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="mt-2 text-purple-500 shrink-0"><Terminal className="h-3 w-3" /></span>
                          <input
                            type="text"
                            value={change}
                            onChange={e => updateClChange(idx, e.target.value)}
                            placeholder="Describe the change, feature, or bug fix..."
                            className="flex-1 px-3 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50"
                          />
                          <button
                            onClick={() => removeClChange(idx)}
                            disabled={clChanges.length <= 1}
                            className="mt-1 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addClChange}
                      className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium"
                    >
                      <Plus className="h-3 w-3" /> Add another change
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-purple-900/30">
                    <button
                      onClick={handleSaveChangelog}
                      disabled={!clTitle.trim() || !clChanges.some(c => c.trim())}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Entry
                    </button>
                    <button
                      onClick={() => setEditingChangelogId(null)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {changelogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl">
                      No changelogs yet.
                    </div>
                  ) : (
                    changelogs.map(log => (
                      <div key={log.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:border-purple-900/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-sm font-bold text-gray-200">{log.title}</h4>
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-md text-[10px] text-gray-400 font-mono">
                              <Calendar className="h-3 w-3" />
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {log.changes.slice(0, 2).map((c, i) => (
                              <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                                <Minus className="h-3 w-3 shrink-0 text-purple-900/50" />
                                <span className="truncate max-w-[280px] sm:max-w-md">{c}</span>
                              </li>
                            ))}
                            {log.changes.length > 2 && (
                              <li className="text-[10px] text-gray-600 font-medium italic pl-4">
                                + {log.changes.length - 2} more changes
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-gray-800/50 pt-3 sm:pt-0">
                          <button
                            onClick={() => handleEditChangelog(log)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChangelog(log.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        

        {/* Bulk Actions / Danger Zone */}
        <section className="bg-gray-900/50 border border-red-900/30 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-red-900/30 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
              <div>
                <h4 className="text-sm font-medium text-gray-200">Approve all pending items</h4>
                <p className="text-xs text-gray-500">Approve all pending stories and users at once.</p>
              </div>
              <button
                onClick={handleApproveAllPending}
                className="px-4 py-2 bg-green-900/30 border border-green-800/40 text-green-400 hover:bg-green-900/50 rounded-lg text-sm font-medium transition-all shrink-0"
              >
                <CheckCircle className="h-4 w-4 inline mr-1.5" />
                Approve All
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800/50">
              <div>
                <h4 className="text-sm font-medium text-gray-200">Clear rejected items</h4>
                <p className="text-xs text-gray-500">Permanently delete all rejected users and stories.</p>
              </div>
              <button
                onClick={handleClearRejected}
                className="px-4 py-2 bg-amber-900/30 border border-amber-800/40 text-amber-400 hover:bg-amber-900/50 rounded-lg text-sm font-medium transition-all shrink-0"
              >
                <Trash2 className="h-4 w-4 inline mr-1.5" />
                Clear Rejected
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-950/30 rounded-xl border border-red-900/30">
              <div>
                <h4 className="text-sm font-medium text-red-300">Reset entire database</h4>
                <p className="text-xs text-red-400/60">Erase all data and restore to defaults. This cannot be undone.</p>
              </div>
              <button
                onClick={handleResetData}
                className="px-4 py-2 bg-red-900/30 border border-red-800/40 text-red-400 hover:bg-red-900/50 rounded-lg text-sm font-medium transition-all shrink-0"
              >
                <RotateCcw className="h-4 w-4 inline mr-1.5" />
                Reset Database
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Color Picker Component ──
function ColorPicker({ value, onChange, allColors }: {
  value: ColorPreset;
  onChange: (c: ColorPreset) => void;
  allColors: ColorPreset[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {allColors.map(color => {
        const isSelected = value === color;
        const hex = COLOR_PRESET_HEX[color];
        return (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isSelected
                ? 'border-white/30 bg-gray-800 ring-1 ring-white/20 shadow-lg'
                : 'border-gray-700/50 bg-gray-900/50 hover:bg-gray-800/80 hover:border-gray-600/50'
            }`}
            title={COLOR_PRESET_LABELS[color]}
          >
            <span
              className={`h-3 w-3 rounded-full shrink-0 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
              style={{ backgroundColor: hex }}
            />
            <span className={`${isSelected ? 'text-gray-200' : 'text-gray-400'}`}>
              {COLOR_PRESET_LABELS[color]}
            </span>
            {isSelected && (
              <CheckCircle className="h-3 w-3 text-green-400 ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Icon Picker Component ──
function IconPicker({ value, onChange }: {
  value: CategoryIcon | undefined;
  onChange: (icon: CategoryIcon | undefined) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border ${
          value
            ? 'border-purple-700/50 bg-purple-900/20 text-purple-300'
            : 'border-gray-700/50 bg-gray-900/50 text-gray-400 hover:border-gray-600/50'
        }`}
      >
        {value ? (
          <>
            <IconDisplay icon={value} className="h-4 w-4" />
            <span className="capitalize">{value}</span>
          </>
        ) : (
          <>
            <Layers className="h-4 w-4" />
            <span>Select Icon</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-gray-900 border border-purple-900/40 rounded-xl shadow-2xl z-50 w-72 max-h-64 overflow-y-auto animate-slide-down">
          <div className="grid grid-cols-6 gap-1.5">
            <button
              onClick={() => { onChange(undefined); setIsOpen(false); }}
              className={`p-2 rounded-lg transition-all ${
                !value ? 'bg-purple-900/40 ring-1 ring-purple-500/50' : 'hover:bg-gray-800'
              }`}
              title="No icon"
            >
              <span className="text-gray-500 text-xs">✕</span>
            </button>
            {CATEGORY_ICONS.map(icon => (
              <button
                key={icon}
                onClick={() => { onChange(icon); setIsOpen(false); }}
                className={`p-2 rounded-lg transition-all ${
                  value === icon ? 'bg-purple-900/40 ring-1 ring-purple-500/50' : 'hover:bg-gray-800'
                }`}
                title={icon}
              >
                <IconDisplay icon={icon} className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, main, sub, color }: {
  icon: typeof Database; label: string; main: number; sub: string; color: string;
}) {
  return (
    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color} mb-1`}>{main}</div>
      <div className="text-[10px] text-gray-600 leading-tight">{sub}</div>
    </div>
  );
}

function StatusBadge({ label, active, activeText, inactiveText, warning }: {
  label: string; active: boolean; activeText: string; inactiveText: string; warning?: boolean;
}) {
  const isWarning = warning && active;
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isWarning ? 'bg-amber-950/20 border-amber-900/30' : 'bg-gray-800/20 border-gray-800/40'
    }`}>
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        isWarning
          ? 'bg-amber-900/40 text-amber-400'
          : active
            ? 'bg-green-900/40 text-green-400'
            : 'bg-gray-800 text-gray-500'
      }`}>
        {active ? activeText : inactiveText}
      </span>
    </div>
  );
}

function ToggleSetting({ label, description, checked, onChange, icon: Icon, warning, warningReversed }: {
  label: string; description: string; checked: boolean;
  onChange: (v: boolean) => void; icon: typeof Eye; warning?: boolean; warningReversed?: boolean;
}) {
  const showWarningStyle = warningReversed ? (warning && !checked) : (warning && checked);
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
      showWarningStyle
        ? 'bg-red-950/20 border-red-900/30'
        : 'bg-gray-900/30 border-gray-800/30'
    }`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
        showWarningStyle
          ? 'bg-red-900/30 border border-red-800/30'
          : 'bg-purple-900/20 border border-purple-800/30'
      }`}>
        <Icon className={`h-5 w-5 ${showWarningStyle ? 'text-red-400' : 'text-purple-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-200">{label}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-all duration-200 ${
          checked ? (showWarningStyle ? 'bg-amber-600' : 'bg-purple-600') : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
