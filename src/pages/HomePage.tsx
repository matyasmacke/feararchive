import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../store/db';
import { getCategoryColor, getCategoryIcon } from '../types';
import { getCategoryNames } from '../store/settings';
import { IconDisplay } from '../components/IconDisplay';
import { stripFormatting } from '../components/FormattedContent';
import { AdultBadge } from '../components/AdultBadge';
import type { Story, User } from '../types';
import {
  BookOpen, Users, Heart, TrendingUp,
  PenTool, Clock, Skull, ArrowRight, Sparkles,
  Shield, Star,
} from 'lucide-react';

interface HomeStats {
  totalStories: number;
  totalUsers: number;
  totalLikes: number;
  totalCategories: number;
  topStories: Story[];
  recentStories: Story[];
  categoryCounts: { name: string; count: number }[];
  topAuthors: { name: string; stories: number; likes: number }[];
}

export function HomePage() {
  const [stats, setStats] = useState<HomeStats>({
    totalStories: 0, totalUsers: 0, totalLikes: 0, totalCategories: 0,
    topStories: [], recentStories: [], categoryCounts: [], topAuthors: [],
  });

  useEffect(() => {
    loadStats();
    const handler = () => loadStats();
    window.addEventListener('fear-data-changed', handler);
    return () => window.removeEventListener('fear-data-changed', handler);
  }, []);

  async function loadStats() {
    const [allStories, allUsers] = await Promise.all([
      db.getApprovedStories(),
      db.getPublicUsers(),
    ]);
    const approvedUsers = allUsers.filter((u: User) => u.status === 'approved');
    const totalLikes = allStories.reduce((sum: number, s: Story) => sum + s.likes, 0);

    const topStories = [...allStories].sort((a, b) => b.likes - a.likes).slice(0, 3);
    const recentStories = [...allStories]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);

    const catNames = getCategoryNames();
    const categoryCounts = catNames.map((cat: string) => ({
      name: cat,
      count: allStories.filter((s: Story) => s.category === cat).length,
    })).filter((c: { count: number }) => c.count > 0).sort((a: { count: number }, b: { count: number }) => b.count - a.count).slice(0, 4);

    const authorMap = new Map<string, { name: string; stories: number; likes: number }>();
    for (const story of allStories) {
      const existing = authorMap.get(story.authorId);
      if (existing) {
        existing.stories++;
        existing.likes += story.likes;
      } else {
        authorMap.set(story.authorId, { name: story.authorName, stories: 1, likes: story.likes });
      }
    }
    const topAuthors = [...authorMap.values()]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);

    setStats({
      totalStories: allStories.length,
      totalUsers: approvedUsers.length,
      totalLikes,
      totalCategories: catNames.length,
      topStories,
      recentStories,
      categoryCounts,
      topAuthors,
    });
  }

  const isArchiveEmpty = stats.totalStories === 0;

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(88,28,135,0.15),transparent_60%)]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-800/5 rounded-full blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-fear-950/70 to-fear-950" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center group block animate-fade-in"
                style={{ animationDelay: `${60}ms`, animationFillMode: 'both' }}
              >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-900/30 border border-purple-800/40 rounded-full text-purple-300 text-xs font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            Community-Driven Horror Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent pb-2 inline-block">
              The Fear Archive
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A curated collection of horror stories written by the community. 
            Read, write, and discover tales that will haunt your dreams.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/stories"
              className="group flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60"
            >
              <BookOpen className="h-5 w-5" />
              Browse Stories
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/add-story"
              className="flex items-center gap-2 px-7 py-3.5 bg-gray-900/80 border border-purple-800/40 hover:border-purple-600/60 text-gray-200 font-semibold rounded-xl transition-all hover:bg-gray-800/80"
            >
              <PenTool className="h-5 w-5 text-purple-400" />
              Write a Story
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`relative -mt-8 ${isArchiveEmpty ? 'mb-4' : 'mb-16'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Published Stories', value: stats.totalStories, icon: BookOpen, color: 'from-purple-600/20 to-purple-900/10 border-purple-800/30', iconColor: 'text-purple-400' },
              { label: 'Active Writers', value: stats.totalUsers, icon: Users, color: 'from-blue-600/20 to-blue-900/10 border-blue-800/30', iconColor: 'text-blue-400' },
              { label: 'Total Likes', value: stats.totalLikes, icon: Heart, color: 'from-red-600/20 to-red-900/10 border-red-800/30', iconColor: 'text-red-400' },
              { label: 'Categories', value: stats.totalCategories, icon: Skull, color: 'from-amber-600/20 to-amber-900/10 border-amber-800/30', iconColor: 'text-amber-400' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-5 backdrop-blur-sm animate-fade-in`}
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  <TrendingUp className="h-3.5 w-3.5 text-gray-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured / Top Stories */}
      {stats.topStories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-600/20 to-yellow-900/10 border border-yellow-800/30 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Most Loved Stories</h2>
                <p className="text-sm text-gray-500">The community's favorite tales of terror</p>
              </div>
            </div>
            <Link to="/stories" className="hidden sm:flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.topStories.map((story, i) => (
              <Link
                key={story.id}
                to={`/story/${story.id}`}
                className="group block animate-fade-in"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className={`relative h-full bg-gradient-to-br from-gray-900 to-gray-900/50 border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  i === 0
                    ? 'border-yellow-800/30 hover:border-yellow-600/50 hover:shadow-lg hover:shadow-yellow-900/10'
                    : 'border-purple-900/20 hover:border-purple-700/40 hover:shadow-lg hover:shadow-purple-900/20'
                }`}>
                  {i === 0 && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-yellow-600/20 to-transparent">
                      <Star className="h-4 w-4 text-yellow-400 inline" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    {(() => { 
                      const cc = getCategoryColor(story.category); 
                      const icon = getCategoryIcon(story.category);
                      return (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${cc.bg} ${cc.text} text-xs font-medium rounded-lg border ${cc.border}`}>
                        {icon ? <IconDisplay icon={icon} className="text-xs" /> : <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />}
                        {story.category}
                      </span>
                    ); })()}
                    <span className="text-xs text-gray-600 capitalize px-2 py-0.5 bg-gray-800/80 rounded">
                      {story.length}
                    </span>
                    {story.isAdult && <AdultBadge />}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-200 group-hover:text-purple-300 transition-colors mb-3 line-clamp-2">
                    {story.title}
                  </h3>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {stripFormatting(story.content).substring(0, 120)}...
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-purple-900/20">
                    <span className="text-xs text-gray-500">by {story.authorName}</span>
                    <div className="flex items-center gap-1 text-xs text-red-400 font-medium">
                      <Heart className="h-3.5 w-3.5 fill-red-400" />
                      {story.likes}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Stories */}
      {stats.recentStories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-800/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Recently Added</h2>
                <p className="text-sm text-gray-500">Fresh horror from the archive</p>
              </div>
            </div>
            <Link to="/stories" className="hidden sm:flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentStories.map((story, i) => (
              <Link
                key={story.id}
                to={`/story/${story.id}`}
                className="group block animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <div className="bg-gray-900/50 border border-purple-900/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-3 transition-all hover:border-purple-700/40 hover:bg-gray-900/70">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate mb-1">
                      {story.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>by {story.authorName}</span>
                      {(() => { 
                        const cc = getCategoryColor(story.category);
                        const icon = getCategoryIcon(story.category); 
                        return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${cc.bg} ${cc.text} rounded border ${cc.border}`}>
                          {icon ? <IconDisplay icon={icon} className="text-[10px]" /> : <span className={`h-1 w-1 rounded-full ${cc.dot}`} />}
                          {story.category}
                        </span>
                      ); })()}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(story.createdAt).toLocaleDateString()}
                      </span>
                      {story.isAdult && <AdultBadge />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                    <span className="flex items-center gap-1 text-red-400">
                      <Heart className="h-3.5 w-3.5" /> {story.likes}
                    </span>
                    <span className="capitalize px-2 py-0.5 bg-gray-800 rounded text-gray-400">{story.length}</span>
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Categories & Top Authors side by side */}
      {(stats.categoryCounts.length > 0 || stats.topAuthors.length > 0) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Categories */}
          {stats.categoryCounts.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-600/20 to-green-900/10 border border-green-800/30 flex items-center justify-center">
                  <Skull className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Popular Categories</h2>
                  <p className="text-sm text-gray-500">Where the darkest tales live</p>
                </div>
              </div>

              <div className="space-y-3">
                {stats.categoryCounts.map((cat, i) => {
                  const icon = getCategoryIcon(cat.name);
                  return (
                  <Link
                    key={cat.name}
                    to={`/stories?category=${encodeURIComponent(cat.name)}`}
                    className="group flex items-center gap-4 bg-gray-900/50 border border-purple-900/20 rounded-xl p-4 hover:border-purple-700/40 transition-all animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                  >
                    <div className="h-10 w-10 rounded-lg bg-purple-900/30 flex items-center justify-center text-purple-400 font-bold text-lg shrink-0">
                      {icon ? <IconDisplay icon={icon} /> : `#${i + 1}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-200 group-hover:text-purple-300 transition-colors">
                        {cat.name}
                      </h4>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {cat.count} {cat.count === 1 ? 'story' : 'stories'}
                    </span>
                  </Link>
                );})}
                <Link
                  to="/categories"
                  className="flex items-center justify-center gap-2 py-3 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  View all categories <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}

          {/* Top Authors */}
          {stats.topAuthors.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-900/10 border border-cyan-800/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Top Authors</h2>
                  <p className="text-sm text-gray-500">Masters of horror</p>
                </div>
              </div>

              <div className="space-y-3">
                {stats.topAuthors.map((author, i) => (
                  <div
                    key={author.name}
                    className="flex items-center gap-4 bg-gray-900/50 border border-purple-900/20 rounded-xl p-4 animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase shrink-0 ${
                      i === 0 ? 'bg-gradient-to-br from-yellow-500 to-amber-700' :
                      i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      'bg-gradient-to-br from-amber-600 to-amber-800'
                    }`}>
                      {author.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-200">{author.name}</h4>
                      <p className="text-xs text-gray-500">
                        {author.stories} {author.stories === 1 ? 'story' : 'stories'} published
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-red-400 font-medium">
                      <Heart className="h-4 w-4 fill-red-400" />
                      {author.likes}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className={`relative px-4 ${isArchiveEmpty ? 'pt-10 pb-20' : 'py-20'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.1),transparent_70%)]" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-900/50">
            <PenTool className="h-8 w-8 text-purple-200" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Have a Story to Tell?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Join our community of horror writers. Share your darkest tales and 
            let others experience the fear you've crafted.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/add-story"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/40"
            >
              <PenTool className="h-5 w-5" />
              Start Writing
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-2 px-6 py-3 bg-gray-900/80 border border-purple-800/40 hover:border-purple-600/60 text-gray-200 font-semibold rounded-xl transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
