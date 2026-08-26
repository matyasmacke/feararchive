import { Link } from 'react-router-dom';
import { Eye, BookOpen, Grid3X3, Info, Heart, Mail, Terminal, } from 'lucide-react';

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-purple-900/20 bg-gradient-to-b from-fear-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group mb-4">
              <Eye className="h-6 w-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent block leading-tight">
                  The Fear Archive
                </span>
                <span className="text-[9px] text-purple-500/60 tracking-widest uppercase font-medium block">
                  by Gloomy Secrets
                </span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              A community-driven collection of horror stories, dark tales, and spine-chilling narratives. Share your fears with the world.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.youtube.com/@GloomySecrets"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-xl bg-gray-900/80 border border-purple-900/20 flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-800/40 transition-all"
                aria-label="YouTube"
              >
                <YoutubeIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/gloomy_secrets"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-xl bg-gray-900/80 border border-purple-900/20 flex items-center justify-center text-gray-500 hover:text-pink-400 hover:border-pink-800/40 transition-all"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Navigate
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/stories', label: 'Stories', icon: BookOpen },
                { to: '/categories', label: 'Categories', icon: Grid3X3 },
                { to: '/about', label: 'About', icon: Info },
                { to: '/contact', label: 'Contact Us', icon: Mail },
                { to: '/changelog', label: 'Changelog', icon: Terminal },
              ].map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-400 transition-colors"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Community
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/add-story"
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Submit a Story
                </Link>
              </li>
              <li>
                <Link
                  to="/rules"
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Community Rules
                </Link>
              </li>
              <li>
                <Link
                  to="/gdpr"
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                >
                  GDPR Compliance
                </Link>
              </li>
              <li>
                <Link
                  to="/apply-mod"
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Apply for Moderator
                </Link>
              </li>
              <li>
                <Link
                  to="/stories"
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors"
                >
                  Browse Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials / Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Follow Us
            </h3>
            <div className="space-y-3">
              <a
                href="https://www.youtube.com/@GloomySecrets"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-900/50 border border-purple-900/20 rounded-xl hover:border-red-800/30 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-red-900/20 flex items-center justify-center shrink-0">
                  <YoutubeIcon className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300 group-hover:text-red-400 transition-colors font-medium">YouTube</p>
                  <p className="text-xs text-gray-600">@GloomySecrets</p>
                </div>
              </a>
              <a
                href="https://www.instagram.com/gloomy_secrets"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-900/50 border border-purple-900/20 rounded-xl hover:border-pink-800/30 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-pink-900/20 flex items-center justify-center shrink-0">
                  <InstagramIcon className="h-4 w-4 text-pink-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300 group-hover:text-pink-400 transition-colors font-medium">Instagram</p>
                  <p className="text-xs text-gray-600">@gloomy_secrets</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-purple-900/15 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {currentYear} The Fear Archive by Gloomy Secrets. All rights reserved.
          </p>
          <p className="text-xs text-gray-700 flex items-center gap-1">
            Crafted with <Heart className="h-3 w-3 text-purple-500 fill-purple-500" /> for horror enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
}
