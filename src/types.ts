export type UserRole = 'user' | 'moderator' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type StoryLength = 'short' | 'medium' | 'long';

export interface ChangelogEntry {
  id: string;
  title: string;
  date: string;
  changes: string[];
}

export interface ModApplication {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  email: string;
  status: ApprovalStatus;
  createdAt: string;
  // Form fields
  reason: string;          // Why do you want to be a moderator?
  experience: string;      // Any prior moderation experience?
  availability: string;    // How many hours per week can you dedicate?
  timezone: string;        // Your timezone
  age: string;             // Age (must confirm 16+)
  extraInfo: string;       // Anything else you'd like us to know?
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: ApprovalStatus;
  bio: string;
  avatar: string;
  createdAt: string;
  likedStories: string[];
  pendingNameChange?: string;
  youtube?: string;
  instagram?: string;
  hideLikedStories?: boolean;
  isGhost?: boolean;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  length: StoryLength;
  status: ApprovalStatus;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export const LENGTH_LABELS: Record<StoryLength, string> = {
  short: 'Short Read (< 5 min)',
  medium: 'Medium Read (5-15 min)',
  long: 'Long Read (15+ min)',
};

export interface CategoryColor {
  bg: string;
  text: string;
  border: string;
  bgHover: string;
  gradient: string;
  dot: string;
}

// ── Color presets that categories can use ──
export type ColorPreset = 'red' | 'blue' | 'amber' | 'cyan' | 'violet' | 'orange' | 'emerald' | 'rose' | 'purple' | 'pink' | 'teal' | 'lime' | 'indigo' | 'fuchsia' | 'sky' | 'yellow';

export const COLOR_PRESETS: Record<ColorPreset, CategoryColor> = {
  red: {
    bg: 'bg-red-900/40', text: 'text-red-300', border: 'border-red-800/40',
    bgHover: 'hover:bg-red-900/50', gradient: 'from-red-900/30 to-red-950/30', dot: 'bg-red-500',
  },
  blue: {
    bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-800/40',
    bgHover: 'hover:bg-blue-900/50', gradient: 'from-blue-900/30 to-blue-950/30', dot: 'bg-blue-500',
  },
  amber: {
    bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-800/40',
    bgHover: 'hover:bg-amber-900/50', gradient: 'from-amber-900/30 to-amber-950/30', dot: 'bg-amber-500',
  },
  cyan: {
    bg: 'bg-cyan-900/40', text: 'text-cyan-300', border: 'border-cyan-800/40',
    bgHover: 'hover:bg-cyan-900/50', gradient: 'from-cyan-900/30 to-cyan-950/30', dot: 'bg-cyan-500',
  },
  violet: {
    bg: 'bg-violet-900/40', text: 'text-violet-300', border: 'border-violet-800/40',
    bgHover: 'hover:bg-violet-900/50', gradient: 'from-violet-900/30 to-violet-950/30', dot: 'bg-violet-500',
  },
  orange: {
    bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-800/40',
    bgHover: 'hover:bg-orange-900/50', gradient: 'from-orange-900/30 to-orange-950/30', dot: 'bg-orange-500',
  },
  emerald: {
    bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-800/40',
    bgHover: 'hover:bg-emerald-900/50', gradient: 'from-emerald-900/30 to-emerald-950/30', dot: 'bg-emerald-500',
  },
  rose: {
    bg: 'bg-rose-900/40', text: 'text-rose-300', border: 'border-rose-800/40',
    bgHover: 'hover:bg-rose-900/50', gradient: 'from-rose-900/30 to-rose-950/30', dot: 'bg-rose-500',
  },
  purple: {
    bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-800/40',
    bgHover: 'hover:bg-purple-900/50', gradient: 'from-purple-900/30 to-purple-950/30', dot: 'bg-purple-500',
  },
  pink: {
    bg: 'bg-pink-900/40', text: 'text-pink-300', border: 'border-pink-800/40',
    bgHover: 'hover:bg-pink-900/50', gradient: 'from-pink-900/30 to-pink-950/30', dot: 'bg-pink-500',
  },
  teal: {
    bg: 'bg-teal-900/40', text: 'text-teal-300', border: 'border-teal-800/40',
    bgHover: 'hover:bg-teal-900/50', gradient: 'from-teal-900/30 to-teal-950/30', dot: 'bg-teal-500',
  },
  lime: {
    bg: 'bg-lime-900/40', text: 'text-lime-300', border: 'border-lime-800/40',
    bgHover: 'hover:bg-lime-900/50', gradient: 'from-lime-900/30 to-lime-950/30', dot: 'bg-lime-500',
  },
  indigo: {
    bg: 'bg-indigo-900/40', text: 'text-indigo-300', border: 'border-indigo-800/40',
    bgHover: 'hover:bg-indigo-900/50', gradient: 'from-indigo-900/30 to-indigo-950/30', dot: 'bg-indigo-500',
  },
  fuchsia: {
    bg: 'bg-fuchsia-900/40', text: 'text-fuchsia-300', border: 'border-fuchsia-800/40',
    bgHover: 'hover:bg-fuchsia-900/50', gradient: 'from-fuchsia-900/30 to-fuchsia-950/30', dot: 'bg-fuchsia-500',
  },
  sky: {
    bg: 'bg-sky-900/40', text: 'text-sky-300', border: 'border-sky-800/40',
    bgHover: 'hover:bg-sky-900/50', gradient: 'from-sky-900/30 to-sky-950/30', dot: 'bg-sky-500',
  },
  yellow: {
    bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-800/40',
    bgHover: 'hover:bg-yellow-900/50', gradient: 'from-yellow-900/30 to-yellow-950/30', dot: 'bg-yellow-500',
  },
};

// Display-friendly color names
export const COLOR_PRESET_LABELS: Record<ColorPreset, string> = {
  red: 'Red', blue: 'Blue', amber: 'Amber', cyan: 'Cyan', violet: 'Violet',
  orange: 'Orange', emerald: 'Emerald', rose: 'Rose', purple: 'Purple', pink: 'Pink',
  teal: 'Teal', lime: 'Lime', indigo: 'Indigo', fuchsia: 'Fuchsia', sky: 'Sky', yellow: 'Yellow',
};

// Actual CSS hex for color dot previews
export const COLOR_PRESET_HEX: Record<ColorPreset, string> = {
  red: '#ef4444', blue: '#3b82f6', amber: '#f59e0b', cyan: '#06b6d4', violet: '#8b5cf6',
  orange: '#f97316', emerald: '#10b981', rose: '#f43f5e', purple: '#a855f7', pink: '#ec4899',
  teal: '#14b8a6', lime: '#84cc16', indigo: '#6366f1', fuchsia: '#d946ef', sky: '#0ea5e9', yellow: '#eab308',
};

// Available icons for categories
export const CATEGORY_ICONS = [
  'skull', 'ghost', 'eye', 'flame', 'moon', 'zap', 'cloud', 'heart', 'star',
  'shield', 'compass', 'anchor', 'feather', 'music', 'camera', 'book', 'pen',
  'code', 'globe', 'rocket', 'mountain', 'tree', 'sun', 'umbrella', 'key',
  'lock', 'bell', 'clock', 'map', 'flag', 'gift', 'gem', 'wind', 'droplet',
  'sparkles', 'bug', 'brain', 'swords', 'crown', 'scroll', 'wand', 'bat', 'spider',
  'castle', 'aperture', 'tree-pine',
] as const;

export type CategoryIcon = typeof CATEGORY_ICONS[number];

export interface CategoryConfig {
  name: string;
  description: string;
  colorKey: ColorPreset;
  icon?: CategoryIcon;
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { name: 'Horror', description: 'Classic tales of terror that prey on primal fears.', colorKey: 'red', icon: 'skull' },
  { name: 'Supernatural', description: 'Ghosts, spirits, and things beyond our reality.', colorKey: 'blue', icon: 'ghost' },
  { name: 'Psychological', description: 'The scariest place of all — the human mind.', colorKey: 'amber', icon: 'brain' },
  { name: 'Sci-Fi Horror', description: 'Where advanced technology meets ancient terror.', colorKey: 'cyan', icon: 'rocket' },
  { name: 'Gothic', description: 'Dark romance, crumbling estates, and ancestral curses.', colorKey: 'violet', icon: 'castle' },
  { name: 'Urban Legends', description: 'Modern myths whispered in the dark.', colorKey: 'orange', icon: 'map' },
  { name: 'Cosmic Horror', description: 'The incomprehensible vastness of uncaring cosmic entities.', colorKey: 'emerald', icon: 'aperture' },
  { name: 'Folklore', description: 'Ancient tales passed down through generations.', colorKey: 'rose', icon: 'tree-pine' },
];

let categoryCache: CategoryConfig[] = DEFAULT_CATEGORIES;

/** Updated by the settings store whenever Supabase settings are loaded. */
export function setCategoryCache(categories: CategoryConfig[]): void {
  categoryCache = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
}

// Helper to get category icon
export function getCategoryIcon(category: string): CategoryIcon | undefined {
  return categoryCache.find(c => c.name === category)?.icon
    ?? DEFAULT_CATEGORIES.find(c => c.name === category)?.icon;
}

export function getCategoryColor(category: string): CategoryColor {
  const cachedCategory = categoryCache.find(c => c.name === category);
  if (cachedCategory && COLOR_PRESETS[cachedCategory.colorKey]) {
    return COLOR_PRESETS[cachedCategory.colorKey];
  }

  // Fallback: check default categories
  const defaultCat = DEFAULT_CATEGORIES.find(c => c.name === category);
  if (defaultCat) return COLOR_PRESETS[defaultCat.colorKey];

  // Ultimate fallback
  return COLOR_PRESETS.purple;
}
