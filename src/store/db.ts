import { supabase } from './supabaseClient';
import type { User, Story, ModApplication, ChangelogEntry } from '../types';
import { notifyDataChange } from './settings';

// ── Row ↔ Model mappers ──

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    username: row.username as string,
    email: (row.email as string) || '',
    role: row.role as User['role'],
    status: row.status as User['status'],
    bio: (row.bio as string) || '',
    avatar: (row.avatar as string) || '',
    createdAt: row.created_at as string,
    likedStories: (row.liked_stories as string[]) || [],
    pendingNameChange: (row.pending_name_change as string) || undefined,
    youtube: (row.youtube as string) || undefined,
    instagram: (row.instagram as string) || undefined,
    hideLikedStories: (row.hide_liked_stories as boolean) || false,
    isGhost: (row.is_ghost as boolean) || false,
  };
}

function toUserRow(u: Partial<User>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (u.username !== undefined) row.username = u.username;
  if (u.email !== undefined) row.email = u.email;
  if (u.role !== undefined) row.role = u.role;
  if (u.status !== undefined) row.status = u.status;
  if (u.bio !== undefined) row.bio = u.bio;
  if (u.avatar !== undefined) row.avatar = u.avatar;
  if (u.youtube !== undefined) row.youtube = u.youtube || null;
  if (u.instagram !== undefined) row.instagram = u.instagram || null;
  if (u.hideLikedStories !== undefined) row.hide_liked_stories = u.hideLikedStories;
  if (u.isGhost !== undefined) row.is_ghost = u.isGhost;
  if (u.likedStories !== undefined) row.liked_stories = u.likedStories;
  if ('pendingNameChange' in u) row.pending_name_change = u.pendingNameChange ?? null;
  return row;
}

function toStory(row: Record<string, unknown>): Story {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    category: row.category as string,
    length: row.length as Story['length'],
    status: row.status as Story['status'],
    isAdult: (row.is_adult as boolean) || false,
    sourceUrl: (row.source_url as string) || undefined,
    likes: (row.likes as number) || 0,
    likedBy: (row.liked_by as string[]) || [],
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || (row.created_at as string),
  };
}

function toStoryRow(s: Partial<Story>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (s.title !== undefined) row.title = s.title;
  if (s.content !== undefined) row.content = s.content;
  if (s.authorId !== undefined) row.author_id = s.authorId;
  if (s.authorName !== undefined) row.author_name = s.authorName;
  if (s.category !== undefined) row.category = s.category;
  if (s.length !== undefined) row.length = s.length;
  if (s.status !== undefined) row.status = s.status;
  if (s.isAdult !== undefined) row.is_adult = s.isAdult;
  if ('sourceUrl' in s) row.source_url = s.sourceUrl || null;
  if (s.likes !== undefined) row.likes = s.likes;
  if (s.likedBy !== undefined) row.liked_by = s.likedBy;
  return row;
}

function toModApp(row: Record<string, unknown>): ModApplication {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    username: row.username as string,
    avatar: (row.avatar as string) || '',
    email: row.email as string,
    status: row.status as ModApplication['status'],
    reason: row.reason as string,
    experience: row.experience as string,
    availability: row.availability as string,
    timezone: row.timezone as string,
    age: row.age as string,
    extraInfo: (row.extra_info as string) || '',
    createdAt: row.created_at as string,
  };
}

function toChangelog(row: Record<string, unknown>): ChangelogEntry {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    changes: (row.changes as string[]) || [],
  };
}

// ══════════════════════════════════════════════════════════════
// Database class — all methods are now async
// ══════════════════════════════════════════════════════════════

class Database {
  // init is now a no-op — Supabase is always ready via schema + seed
  async init(): Promise<void> { /* no-op */ }

  // ── Changelogs ──

  async getChangelogs(): Promise<ChangelogEntry[]> {
    const { data } = await supabase
      .from('changelogs')
      .select('*')
      .order('date', { ascending: false });
    return (data || []).map(toChangelog);
  }

  async addChangelog(changelog: Omit<ChangelogEntry, 'id'>): Promise<ChangelogEntry> {
    const { data, error } = await supabase
      .from('changelogs')
      .insert({ title: changelog.title, date: changelog.date, changes: changelog.changes })
      .select()
      .single();
    if (error) throw error;
    notifyDataChange();
    return toChangelog(data);
  }

  async updateChangelog(id: string, updates: Partial<ChangelogEntry>): Promise<ChangelogEntry | undefined> {
    const row: Record<string, unknown> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.date !== undefined) row.date = updates.date;
    if (updates.changes !== undefined) row.changes = updates.changes;

    const { data, error } = await supabase.from('changelogs').update(row).eq('id', id).select().single();
    if (error || !data) return undefined;
    notifyDataChange();
    return toChangelog(data);
  }

  async deleteChangelog(id: string): Promise<boolean> {
    const { error } = await supabase.from('changelogs').delete().eq('id', id);
    if (error) return false;
    notifyDataChange();
    return true;
  }

  // ── Users (Profiles) ──

  async getUsers(): Promise<User[]> {
    const { data } = await supabase.from('profiles').select('*');
    return (data || []).map(toUser);
  }

  async getPublicUsers(): Promise<User[]> {
    const { data } = await supabase.from('public_profiles').select('*');
    return (data || []).map(toUser);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) return toUser(data);
    const { data: publicData } = await supabase.from('public_profiles').select('*').eq('id', id).maybeSingle();
    return publicData ? toUser(publicData) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase.from('profiles').select('*').ilike('username', username).maybeSingle();
    if (data) return toUser(data);
    const { data: publicData } = await supabase.from('public_profiles').select('*').ilike('username', username).maybeSingle();
    return publicData ? toUser(publicData) : undefined;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_username_available', { requested_username: username });
    if (error) throw error;
    return Boolean(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data } = await supabase.from('profiles').select('*').ilike('email', email).single();
    return data ? toUser(data) : undefined;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const row = toUserRow(updates);
    if (Object.keys(row).length === 0) return this.getUserById(id);
    const { data, error } = await supabase.from('profiles').update(row).eq('id', id).select().single();
    if (error || !data) return undefined;
    notifyDataChange();
    return toUser(data);
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase.rpc('delete_user_account', { target_user_id: id });
    if (error) return false;
    notifyDataChange();
    return true;
  }

  // ── Stories ──

  async getStories(): Promise<Story[]> {
    const { data } = await supabase.from('stories').select('*');
    return (data || []).map(toStory);
  }

  async getApprovedStories(): Promise<Story[]> {
    const { data } = await supabase.from('stories').select('*').eq('status', 'approved');
    return (data || []).map(toStory);
  }

  async getPendingStories(): Promise<Story[]> {
    const { data } = await supabase.from('stories').select('*').eq('status', 'pending');
    return (data || []).map(toStory);
  }

  async getStoryById(id: string): Promise<Story | undefined> {
    const { data } = await supabase.from('stories').select('*').eq('id', id).single();
    return data ? toStory(data) : undefined;
  }

  async getStoriesByAuthor(authorId: string): Promise<Story[]> {
    const { data } = await supabase.from('stories').select('*').eq('author_id', authorId);
    return (data || []).map(toStory);
  }

  async getDraftStoriesByAuthor(authorId: string): Promise<Story[]> {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('author_id', authorId)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });
    return (data || []).map(toStory);
  }

  async addStory(story: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Story> {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        title: story.title,
        content: story.content,
        author_id: story.authorId,
        author_name: story.authorName,
        category: story.category,
        length: story.length,
        status: story.status,
        is_adult: story.isAdult,
        source_url: story.sourceUrl || null,
      })
      .select()
      .single();
    if (error) throw error;
    notifyDataChange();
    return toStory(data);
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    const row = toStoryRow(updates);
    if (Object.keys(row).length === 0) return this.getStoryById(id);
    const { data, error } = await supabase.from('stories').update(row).eq('id', id).select().single();
    if (error || !data) return undefined;
    notifyDataChange();
    return toStory(data);
  }

  async deleteStory(id: string): Promise<boolean> {
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (error) return false;
    notifyDataChange();
    return true;
  }

  // ── Bulk Actions ──

  async approveAllPending(): Promise<void> {
    await supabase.from('stories').update({ status: 'approved' }).eq('status', 'pending');
    await supabase.from('profiles').update({ status: 'approved' }).eq('status', 'pending');

    // Approve pending mod applications and promote to moderator
    const { data: pendingApps } = await supabase.from('mod_applications').select('*').eq('status', 'pending');
    if (pendingApps && pendingApps.length > 0) {
      await supabase.from('mod_applications').update({ status: 'approved' }).eq('status', 'pending');
      for (const app of pendingApps) {
        await supabase.from('profiles').update({ role: 'moderator' }).eq('id', app.user_id);
      }
    }
    notifyDataChange();
  }

  async clearRejected(): Promise<void> {
    await supabase.from('stories').delete().eq('status', 'rejected');
    const { data: rejectedUsers } = await supabase.from('profiles').select('id').eq('status', 'rejected');
    for (const rejectedUser of rejectedUsers || []) {
      await supabase.rpc('delete_user_account', { target_user_id: rejectedUser.id });
    }
    await supabase.from('mod_applications').delete().eq('status', 'rejected');
    notifyDataChange();
  }

  async resetDatabase(): Promise<void> {
    const { error } = await supabase.rpc('reset_archive_data');
    if (error) throw error;
    notifyDataChange();
  }

  // ── Mod Applications ──

  async getModApplications(): Promise<ModApplication[]> {
    const { data } = await supabase.from('mod_applications').select('*');
    return (data || []).map(toModApp);
  }

  async getModApplicationByUserId(userId: string): Promise<ModApplication | undefined> {
    const { data } = await supabase.from('mod_applications').select('*').eq('user_id', userId).single();
    return data ? toModApp(data) : undefined;
  }

  async addModApplication(app: Omit<ModApplication, 'id' | 'createdAt' | 'status'>): Promise<ModApplication> {
    const { data, error } = await supabase
      .from('mod_applications')
      .insert({
        user_id: app.userId,
        username: app.username,
        avatar: app.avatar,
        email: app.email,
        reason: app.reason,
        experience: app.experience,
        availability: app.availability,
        timezone: app.timezone,
        age: app.age,
        extra_info: app.extraInfo,
      })
      .select()
      .single();
    if (error) throw error;
    notifyDataChange();
    return toModApp(data);
  }

  async updateModApplication(id: string, updates: Partial<ModApplication>): Promise<ModApplication | undefined> {
    const row: Record<string, unknown> = {};
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.username !== undefined) row.username = updates.username;

    const { data, error } = await supabase.from('mod_applications').update(row).eq('id', id).select().single();
    if (error || !data) return undefined;
    notifyDataChange();
    return toModApp(data);
  }

  async deleteModApplication(id: string): Promise<boolean> {
    const { error } = await supabase.from('mod_applications').delete().eq('id', id);
    if (error) return false;
    notifyDataChange();
    return true;
  }

  // ── Likes ──

  async toggleLike(storyId: string, userId: string): Promise<{ story: Story; user: User } | undefined> {
    const { data, error } = await supabase.rpc('toggle_like', {
      p_story_id: storyId,
      p_user_id: userId,
    });
    if (error || !data) return undefined;
    const result = data as { story: Record<string, unknown>; user: Record<string, unknown> };
    notifyDataChange();
    return { story: toStory(result.story), user: toUser(result.user) };
  }
}

export const db = new Database();

// ── Realtime subscriptions: relay Supabase changes to existing event system ──
supabase
  .channel('db-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => notifyDataChange())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => notifyDataChange())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'changelogs' }, () => notifyDataChange())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'mod_applications' }, () => notifyDataChange())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
    window.dispatchEvent(new CustomEvent('fear-settings-changed'));
    notifyDataChange();
  })
  .subscribe();
