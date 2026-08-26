import { supabase } from './supabaseClient';
import type { CategoryConfig } from '../types';
import { DEFAULT_CATEGORIES, setCategoryCache } from '../types';

const SITE_SETTINGS_KEY = 'fear_archive_site_settings';

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  requireApprovalForStories: boolean;
  requireApprovalForUsers: boolean;
  allowRegistration: boolean;
  allowModApplications: boolean;
  maxStoryLength: number;
  maintenanceMode: boolean;
  showLikeCount: boolean;
  featuredCategory: string;
  categories: CategoryConfig[];
  storyRules: string;
  gdprText: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'The Fear Archive',
  siteDescription: 'A community-driven platform for horror storytelling',
  requireApprovalForStories: true,
  requireApprovalForUsers: true,
  allowRegistration: true,
  allowModApplications: true,
  maxStoryLength: 50000,
  maintenanceMode: false,
  showLikeCount: true,
  featuredCategory: 'Horror',
  categories: DEFAULT_CATEGORIES,
  storyRules: 'Welcome to The Fear Archive. Please read the rules before submitting.',
  gdprText: 'This website complies with GDPR.',
};

// ── Local cache for synchronous access ──
// Settings are fetched async from Supabase but cached locally
// so that getCategoryColor/getCategoryIcon can stay synchronous.
let _cachedSettings: SiteSettings = { ...DEFAULT_SETTINGS };

// Try loading from localStorage on startup (instant cache)
try {
  const stored = localStorage.getItem(SITE_SETTINGS_KEY);
  if (stored) {
    _cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    setCategoryCache(_cachedSettings.categories);
  }
} catch { /* ignore */ }

/** Synchronous getter — returns cached settings (always available) */
export function getSettings(): SiteSettings {
  return _cachedSettings;
}

/** Async getter — fetches fresh settings from Supabase and updates cache */
export async function fetchSettings(): Promise<SiteSettings> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('data')
      .eq('id', 1)
      .single();

    if (!error && data && data.data) {
      const parsed = data.data as Record<string, unknown>;
      _cachedSettings = { ...DEFAULT_SETTINGS, ...parsed } as SiteSettings;
      setCategoryCache(_cachedSettings.categories);
      // Also update localStorage cache for instant load next time
      localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(_cachedSettings));
    }
  } catch {
    // Use cached/default settings on error
  }
  return _cachedSettings;
}

/** Save settings to Supabase + update local cache */
export async function saveSettings(settings: SiteSettings): Promise<void> {
  _cachedSettings = settings;
  setCategoryCache(settings.categories);
  localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));

  await supabase
    .from('site_settings')
    .update({ data: settings as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
    .eq('id', 1);

  window.dispatchEvent(new CustomEvent('fear-settings-changed', { detail: settings }));
}

/** Get the current dynamic categories list */
export function getCategories(): CategoryConfig[] {
  return getSettings().categories;
}

/** Get just the category names */
export function getCategoryNames(): string[] {
  return getSettings().categories.map(c => c.name);
}

// ── Real-time data change events ──
export function notifyDataChange(): void {
  window.dispatchEvent(new CustomEvent('fear-data-changed'));
}

// ── Initialize: fetch settings from Supabase on startup ──
export { SITE_SETTINGS_KEY, DEFAULT_SETTINGS };
