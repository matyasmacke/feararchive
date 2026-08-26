import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../store/db';
import { getCategoryColor } from '../types';
import { getCategories } from '../store/settings';
import type { CategoryConfig, Story } from '../types';
import { Layers } from 'lucide-react';
import { IconDisplay } from '../components/IconDisplay';

export function CategoriesPage() {
  const categories = getCategories();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    db.getApprovedStories().then((stories: Story[]) => {
      const counts: Record<string, number> = {};
      for (const cat of categories) {
        counts[cat.name] = stories.filter(s => s.category === cat.name).length;
      }
      setCategoryCounts(counts);
    });
  }, [categories]);

  return (
    <div className="min-h-screen">
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-gray-400 text-lg">
            Choose your flavor of fear
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat: CategoryConfig, i: number) => {
            const color = getCategoryColor(cat.name);
            return (
              <Link
                key={cat.name}
                to={`/stories?category=${encodeURIComponent(cat.name)}`}
                className="group block animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <div className={`relative h-full bg-gradient-to-br ${color.gradient} border ${color.border} rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${color.gradient} rounded-bl-full opacity-50`} />

                  <div className="relative">
                    <div className={`h-12 w-12 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center mb-4 transition-colors`}>
                      {cat.icon ? (
                        <IconDisplay icon={cat.icon} className={`h-6 w-6 ${color.text} transition-colors`} />
                      ) : (
                        <Layers className={`h-6 w-6 ${color.text} transition-colors`} />
                      )}
                    </div>

                    <h3 className={`text-lg font-semibold ${color.text} transition-colors mb-2`}>
                      {cat.name}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                      {cat.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                      <span className={`text-xs ${color.text} font-medium`}>
                        {categoryCounts[cat.name] || 0} {categoryCounts[cat.name] === 1 ? 'story' : 'stories'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
