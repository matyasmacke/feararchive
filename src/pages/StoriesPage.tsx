import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../store/db';
import { LENGTH_LABELS, getCategoryColor, getCategoryIcon } from '../types';
import { getSettings, getCategoryNames } from '../store/settings';
import { IconDisplay } from '../components/IconDisplay';
import type { Story, StoryLength } from '../types';
import { Search, Heart, Clock, BookOpen, Filter, X, ChevronDown } from 'lucide-react';

type SortBy = 'newest' | 'oldest' | 'most-liked' | 'title';

const STORIES_PER_PAGE = 9;

export function StoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLength, setSelectedLength] = useState<StoryLength | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [allStories, setAllStories] = useState<Story[]>([]);

  const settings = getSettings();
  const categoryNames = useMemo(() => getCategoryNames(), [settings.categories]);

  // Fetch stories from Supabase
  useEffect(() => {
    db.getApprovedStories().then(setAllStories);
    const handler = () => { db.getApprovedStories().then(setAllStories); };
    window.addEventListener('fear-data-changed', handler);
    return () => window.removeEventListener('fear-data-changed', handler);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedLength, sortBy]);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && categoryNames.includes(cat)) {
      setSelectedCategory(cat);
      setShowFilters(true);
    }
  }, [searchParams, categoryNames]);

  const stories = useMemo(() => {
    let result = [...allStories];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        s => s.title.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      result = result.filter(s => s.category === selectedCategory);
    }
    if (selectedLength) {
      result = result.filter(s => s.length === selectedLength);
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'most-liked':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [allStories, search, selectedCategory, selectedLength, sortBy]);

  const totalPages = Math.ceil(stories.length / STORIES_PER_PAGE);
  const paginatedStories = stories.slice((currentPage - 1) * STORIES_PER_PAGE, currentPage * STORIES_PER_PAGE);

  const activeFilters = [selectedCategory, selectedLength].filter(Boolean).length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">
            Horror Stories
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Explore the darkest corners of imagination
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stories by title or author..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                showFilters || activeFilters > 0
                  ? 'border-purple-500/50 bg-purple-900/30 text-purple-300'
                  : 'border-purple-900/30 text-gray-400 hover:text-purple-300 hover:border-purple-800/50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                  {activeFilters}
                </span>
              )}
            </button>
            <span className="text-sm text-gray-500">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'} found
            </span>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="appearance-none pl-3 pr-8 py-2 bg-gray-900/80 border border-purple-900/30 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-liked">Most Liked</option>
              <option value="title">Alphabetical</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-8 p-4 bg-gray-900/50 border border-purple-900/30 rounded-xl animate-slide-down">
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categoryNames.map(cat => {
                    const color = getCategoryColor(cat);
                    const isSelected = selectedCategory === cat;
                    const icon = getCategoryIcon(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCategory('');
                            if (searchParams.has('category')) setSearchParams({});
                          } else {
                            setSelectedCategory(cat);
                            if (searchParams.has('category')) setSearchParams({ category: cat });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? `${color.bg} ${color.text} ${color.border}`
                            : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {icon ? <IconDisplay icon={icon} /> : <span className={`inline-block h-1.5 w-1.5 rounded-full ${color.dot}`} />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="min-w-[200px]">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Length</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(LENGTH_LABELS) as StoryLength[]).map(len => (
                    <button
                      key={len}
                      onClick={() => setSelectedLength(selectedLength === len ? '' : len)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedLength === len
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                      }`}
                    >
                      {LENGTH_LABELS[len]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedLength('');
                  if (searchParams.has('category')) {
                    setSearchParams({});
                  }
                }}
                className="mt-4 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-3 w-3" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Stories grid */}
        {stories.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No stories found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedStories.map((story, i) => {
              const catColor = getCategoryColor(story.category);
              const catIcon = getCategoryIcon(story.category);
              return (
                <Link
                  key={story.id}
                  to={`/story/${story.id}`}
                  className="group block animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="h-full bg-gradient-to-br from-gray-900 to-gray-900/50 border border-purple-900/20 rounded-xl p-6 transition-all duration-300 hover:border-purple-700/40 hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${catColor.bg} ${catColor.text} text-xs font-medium rounded-lg border ${catColor.border}`}>
                        {catIcon ? <IconDisplay icon={catIcon} /> : <span className={`h-1.5 w-1.5 rounded-full ${catColor.dot}`} />}
                        {story.category}
                      </span>
                      {settings.showLikeCount && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Heart className="h-3.5 w-3.5" />
                          {story.likes}
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-200 group-hover:text-purple-300 transition-colors mb-3 line-clamp-2">
                      {story.title}
                    </h3>

                    <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                      {story.content.substring(0, 150)}...
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-purple-900/20">
                      <span className="text-xs text-gray-500">by {story.authorName}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(story.createdAt).toLocaleDateString()}
                        </span>
                        <span className="capitalize px-2 py-0.5 bg-gray-800 rounded text-gray-400">
                          {story.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-gray-900/50 border border-purple-900/30 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-900/30 hover:border-purple-500/50 transition-all"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${
                    currentPage === i + 1
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-900/50 border-purple-900/30 text-gray-400 hover:bg-purple-900/30 hover:border-purple-500/50 hover:text-purple-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-gray-900/50 border border-purple-900/30 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-900/30 hover:border-purple-500/50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
