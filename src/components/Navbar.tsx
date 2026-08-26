import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { db } from '../store/db';
import {
  BookOpen, Grid3X3, Info, Menu, X,
  User, PenTool, LogOut, Eye,
  Bell, LayoutDashboard, Settings, Shield, ChevronDown, Edit3,
  Search, Clock, Heart, Home, Mail,
} from 'lucide-react';
import type { Story, User as UserType } from '../types';
import { COLOR_PRESETS } from '../types';
import { getSettings } from '../store/settings';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileClosing, setMobileClosing] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userMenuClosing, setUserMenuClosing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifClosing, setNotifClosing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // ── Close helpers with animation ──
  const closeMobileMenu = useCallback(() => {
    setMobileClosing(true);
    setTimeout(() => { setMobileOpen(false); setMobileClosing(false); }, 250);
  }, []);

  const openMobileMenu = useCallback(() => {
    setMobileOpen(true);
    setMobileClosing(false);
  }, []);

  const closeNotif = useCallback(() => {
    setNotifClosing(true);
    setTimeout(() => { setNotifOpen(false); setNotifClosing(false); }, 180);
  }, []);

  const closeUserMenu = useCallback(() => {
    setUserMenuClosing(true);
    setTimeout(() => { setUserMenuOpen(false); setUserMenuClosing(false); }, 180);
  }, []);

  const canAccessAdmin = user && (user.role === 'admin' || user.role === 'moderator');
  const isAdmin = user?.role === 'admin';

  // ── Real-time notifications ──
  const [notifications, setNotifications] = useState({ pendingStories: 0, pendingUsers: 0, pendingNames: 0, pendingModApps: 0, total: 0 });

  const refreshNotifications = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      setNotifications({ pendingStories: 0, pendingUsers: 0, pendingNames: 0, pendingModApps: 0, total: 0 });
      return;
    }
    const [stories, users, applications] = await Promise.all([
      db.getPendingStories(),
      db.getUsers(),
      db.getModApplications(),
    ]);
    const pendingStories = stories.length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;
    const pendingNames = users.filter(u => u.pendingNameChange).length;
    const modApps = isAdmin ? applications.filter(a => a.status === 'pending').length : 0;
    const total = pendingStories + pendingUsers + pendingNames + modApps;
    setNotifications({ pendingStories, pendingUsers, pendingNames, pendingModApps: modApps, total });
  }, [isAdmin, user]);

  useEffect(() => {
    refreshNotifications();
    const handler = () => refreshNotifications();
    window.addEventListener('fear-data-changed', handler);
    const interval = setInterval(refreshNotifications, 2000);
    return () => {
      window.removeEventListener('fear-data-changed', handler);
      clearInterval(interval);
    };
  }, [refreshNotifications]);

  useEffect(() => { refreshNotifications(); }, [location.pathname, refreshNotifications]);

  // ── Outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node) && userMenuOpen) {
        closeUserMenu();
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node) && notifOpen) {
        closeNotif();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen, notifOpen, closeUserMenu, closeNotif]);

  // ── Close on route change ──
  useEffect(() => {
    if (mobileOpen) closeMobileMenu();
    setUserMenuOpen(false);
    setUserMenuClosing(false);
    setNotifOpen(false);
    setNotifClosing(false);
    setSearchOpen(false);
    window.scrollTo(0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ── Body scroll lock ──
  useEffect(() => {
    if (mobileOpen || searchOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => { 
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = '';
    };
  }, [mobileOpen, searchOpen]);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/stories', label: 'Stories', icon: BookOpen },
    { to: '/categories', label: 'Categories', icon: Grid3X3 },
    { to: '/about', label: 'About', icon: Info },
    { to: '/contact', label: 'Contact', icon: Mail },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-purple-900/30 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">

            {/* Left — Logo + Hamburger */}
            <div className="flex items-center gap-3 shrink-0 z-10">
              <button
                onClick={mobileOpen ? closeMobileMenu : openMobileMenu}
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-purple-300 transition-colors"
                aria-label="Toggle menu"
              >
                {(mobileOpen && !mobileClosing) ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <Link to="/" className="flex items-center gap-2.5 group">
                <Eye className="h-7 w-7 text-purple-400 group-hover:text-purple-300 transition-colors" />
                <div className="hidden sm:block">
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent block leading-tight">
                    The Fear Archive
                  </span>
                  <span className="text-[10px] text-purple-500/70 tracking-widest uppercase font-medium -mt-0.5 block">
                    by Gloomy Secrets
                  </span>
                </div>
                <div className="sm:hidden">
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent block leading-tight">TFA</span>
                  <span className="text-[8px] text-purple-500/70 tracking-wider uppercase font-medium block">Gloomy Secrets</span>
                </div>
              </Link>
            </div>

            {/* Center — Nav links (absolutely centered) */}
            <div className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    isActive(link.to)
                      ? 'bg-purple-900/40 text-purple-300 shadow-inner shadow-purple-900/20'
                      : 'text-gray-400 hover:text-purple-300 hover:bg-purple-900/20'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right — Search + Bell + Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
              {/* Search */}
              <button
                onClick={() => { setSearchOpen(true); setNotifOpen(false); setUserMenuOpen(false); }}
                className="p-2.5 rounded-xl text-gray-400 hover:text-purple-300 hover:bg-purple-900/20 transition-all"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {user ? (
                <>
                  {/* Notification Bell */}
                  {canAccessAdmin && (
                    <div className="relative" ref={notifRef}>
                      <button
                        onClick={() => {
                          if (notifOpen) closeNotif();
                          else { setNotifOpen(true); setNotifClosing(false); if (userMenuOpen) closeUserMenu(); }
                        }}
                        className={`relative p-2.5 rounded-xl transition-all ${
                          notifOpen ? 'bg-purple-900/40 text-purple-300' : 'text-gray-400 hover:text-purple-300 hover:bg-purple-900/20'
                        }`}
                      >
                        <Bell className="h-5 w-5" />
                        {notifications.total > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-black animate-pulse">
                            {notifications.total > 9 ? '9+' : notifications.total}
                          </span>
                        )}
                      </button>

                      {(notifOpen || notifClosing) && (
                        <div className={`fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-[4.5rem] sm:top-auto sm:mt-2 w-auto sm:w-80 rounded-xl bg-gray-900 border border-purple-900/40 shadow-2xl shadow-purple-900/20 overflow-hidden z-[100] ${notifClosing ? 'animate-dropdown-out' : 'animate-slide-down'}`}>
                          <div className="px-4 py-3 border-b border-purple-900/30 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                              <Bell className="h-4 w-4 text-purple-400" /> Notifications
                            </h3>
                            {notifications.total > 0 && (
                              <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded-full font-medium">
                                {notifications.total} pending
                              </span>
                            )}
                          </div>
                          <div className="py-2">
                            {notifications.total === 0 ? (
                              <div className="px-4 py-6 text-center">
                                <Bell className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">All caught up!</p>
                              </div>
                            ) : (
                              <>
                                {notifications.pendingStories > 0 && (
                                  <button onClick={() => { navigate('/admin?tab=stories'); closeNotif(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-900/20 transition-colors text-left">
                                    <div className="h-10 w-10 rounded-xl bg-yellow-900/30 border border-yellow-800/30 flex items-center justify-center shrink-0">
                                      <BookOpen className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-200">{notifications.pendingStories} pending {notifications.pendingStories === 1 ? 'story' : 'stories'}</p>
                                      <p className="text-xs text-gray-500">Waiting for review</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-600 -rotate-90 shrink-0" />
                                  </button>
                                )}
                                {notifications.pendingUsers > 0 && (
                                  <button onClick={() => { navigate('/admin?tab=users'); closeNotif(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-900/20 transition-colors text-left">
                                    <div className="h-10 w-10 rounded-xl bg-blue-900/30 border border-blue-800/30 flex items-center justify-center shrink-0">
                                      <User className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-200">{notifications.pendingUsers} pending {notifications.pendingUsers === 1 ? 'user' : 'users'}</p>
                                      <p className="text-xs text-gray-500">Awaiting approval</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-600 -rotate-90 shrink-0" />
                                  </button>
                                )}
                                {notifications.pendingNames > 0 && (
                                  <button onClick={() => { navigate('/admin?tab=names'); closeNotif(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-900/20 transition-colors text-left">
                                    <div className="h-10 w-10 rounded-xl bg-purple-900/30 border border-purple-800/30 flex items-center justify-center shrink-0">
                                      <Edit3 className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-200">{notifications.pendingNames} name {notifications.pendingNames === 1 ? 'change' : 'changes'}</p>
                                      <p className="text-xs text-gray-500">Pending review</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-600 -rotate-90 shrink-0" />
                                  </button>
                                )}
                                {notifications.pendingModApps > 0 && (
                                  <button onClick={() => { navigate('/admin?tab=mods'); closeNotif(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-900/20 transition-colors text-left">
                                    <div className="h-10 w-10 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center shrink-0">
                                      <Shield className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-200">{notifications.pendingModApps} mod {notifications.pendingModApps === 1 ? 'application' : 'applications'}</p>
                                      <p className="text-xs text-gray-500">Awaiting decision</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-600 -rotate-90 shrink-0" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          <div className="border-t border-purple-900/30 px-4 py-2.5">
                            <Link to="/admin" onClick={() => setNotifOpen(false)} className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium">
                              Open Dashboard →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Avatar */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => {
                        if (userMenuOpen) closeUserMenu();
                        else { setUserMenuOpen(true); setUserMenuClosing(false); if (notifOpen) closeNotif(); }
                      }}
                      className="relative group"
                      aria-label="User menu"
                    >
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white text-sm font-bold uppercase overflow-hidden ring-2 transition-all ${
                        userMenuOpen ? 'ring-purple-400 shadow-lg shadow-purple-900/50' : 'ring-purple-800/50 group-hover:ring-purple-500/70'
                      }`}>
                        {user.avatar ? <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : user.username[0]}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full ring-2 ring-black" />
                    </button>

                    {(userMenuOpen || userMenuClosing) && (
                      <div className={`absolute right-0 mt-2 w-56 rounded-xl bg-gray-900 border border-purple-900/40 shadow-2xl shadow-purple-900/20 overflow-hidden z-[100] ${userMenuClosing ? 'animate-dropdown-out' : 'animate-slide-down'}`}>
                        <div className="px-4 py-3 border-b border-purple-900/30">
                          <p className="text-sm font-medium text-white truncate">{user.username}</p>
                          <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                            <Shield className="h-3 w-3" /> {user.role}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">
                            <User className="h-4 w-4" /> My Profile
                          </Link>
                          {!user.isGhost && (
                            <Link to="/add-story" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">
                              <PenTool className="h-4 w-4" /> Write Story
                            </Link>
                          )}
                          {canAccessAdmin && (
                            <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">
                              <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                              {notifications.total > 0 && (
                                <span className="ml-auto px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">
                                  {notifications.total}
                                </span>
                              )}
                            </Link>
                          )}
                          {isAdmin && (
                            <Link to="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-900/20 hover:text-purple-300 transition-colors">
                              <Settings className="h-4 w-4" /> Site Settings
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-purple-900/30 py-1">
                          <button
                            onClick={() => { void logout().then(() => navigate('/')); }}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors w-full text-left"
                          >
                            <LogOut className="h-4 w-4" /> Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link to="/login" className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} navigate={navigate} />}

      {/* Mobile Drawer */}
      {(mobileOpen || mobileClosing) && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${mobileClosing ? 'overlay-exit' : 'overlay-enter'}`}
            onClick={closeMobileMenu}
          />
          <div className={`absolute top-0 left-0 bottom-0 w-72 bg-gray-950 border-r border-purple-900/30 shadow-2xl shadow-purple-900/20 flex flex-col ${mobileClosing ? 'drawer-exit' : 'drawer-enter'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/30">
              <Link to="/" className="flex items-center gap-2.5 group" onClick={closeMobileMenu}>
                <Eye className="h-6 w-6 text-purple-400" />
                <div>
                  <span className="text-lg font-bold bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent block leading-tight">The Fear Archive</span>
                  <span className="text-[9px] text-purple-500/70 tracking-widest uppercase font-medium block">by Gloomy Secrets</span>
                </div>
              </Link>
              <button onClick={closeMobileMenu} className="p-2 text-gray-400 hover:text-purple-300 transition-colors rounded-lg hover:bg-purple-900/20">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3">
              <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Navigation</p>
              <div className="space-y-1 mb-6">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive(link.to) ? 'bg-purple-900/40 text-purple-300' : 'text-gray-400 hover:text-purple-300 hover:bg-purple-900/20'}`}
                  >
                    <link.icon className="h-5 w-5" /> {link.label}
                  </Link>
                ))}
              </div>

              {user && (
                <>
                  <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Account</p>
                  <div className="space-y-1 mb-6">
                    <Link to="/profile" onClick={closeMobileMenu} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/profile') ? 'bg-purple-900/40 text-purple-300' : 'text-gray-400 hover:text-purple-300 hover:bg-purple-900/20'}`}>
                      <User className="h-5 w-5" /> My Profile
                    </Link>
                    {!user.isGhost && (
                      <Link to="/add-story" onClick={closeMobileMenu} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/add-story') ? 'bg-purple-900/40 text-purple-300' : 'text-gray-400 hover:text-purple-300 hover:bg-purple-900/20'}`}>
                        <PenTool className="h-5 w-5" /> Write Story
                      </Link>
                    )}
                  </div>
                </>
              )}

              {canAccessAdmin && (
                <>
                  <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Administration</p>
                  <div className="space-y-1 mb-6">
                    <Link to="/admin" onClick={closeMobileMenu} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/admin') ? 'bg-purple-900/40 text-purple-300' : 'text-gray-400 hover:text-purple-300 hover:bg-purple-900/20'}`}>
                      <LayoutDashboard className="h-5 w-5" /> Dashboard
                      {notifications.total > 0 && <span className="ml-auto px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full">{notifications.total}</span>}
                    </Link>
                    {isAdmin && (
                      <Link to="/settings" onClick={closeMobileMenu} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${isActive('/settings') ? 'bg-purple-900/40 text-purple-300' : 'text-gray-400 hover:text-purple-300 hover:bg-purple-900/20'}`}>
                        <Settings className="h-5 w-5" /> Site Settings
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-purple-900/30 p-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white text-sm font-bold uppercase overflow-hidden ring-2 ring-purple-800/50 shrink-0">
                    {user.avatar ? <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : user.username[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <button onClick={() => { void logout().then(() => navigate('/')); closeMobileMenu(); }} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors" aria-label="Logout">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={closeMobileMenu} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Search Modal ── */
function SearchModal({ onClose, navigate }: { onClose: () => void; navigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const [storyResults, setStoryResults] = useState<Story[]>([]);
  const [userResults, setUserResults] = useState<UserType[]>([]);
  const [storyCounts, setStoryCounts] = useState<Record<string, number>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const totalResults = storyResults.length + userResults.length;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 150);
  }, [onClose]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => p === null ? 0 : (p + 1) % totalResults); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => p === null ? totalResults - 1 : (p - 1 + totalResults) % totalResults); }
      else if (e.key === 'Enter' && selectedIndex !== null) {
        e.preventDefault();
        if (selectedIndex < storyResults.length) navigate(`/story/${storyResults[selectedIndex].id}`);
        else navigate(`/user/${userResults[selectedIndex - storyResults.length].id}`);
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalResults, selectedIndex, storyResults, userResults, navigate, handleClose]);

  useEffect(() => { setSelectedIndex(null); }, [query]);

  useEffect(() => {
    if (selectedIndex !== null) {
      const el = document.getElementById(`search-result-${selectedIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setStoryResults([]); setUserResults([]); setStoryCounts({}); return; }

    let active = true;
    const timer = window.setTimeout(() => {
      void Promise.all([db.getApprovedStories(), db.getPublicUsers()]).then(([stories, users]) => {
        if (!active) return;
        setStoryResults(stories.filter(s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q)).slice(0, 5));
        setUserResults(users.filter(u => u.status === 'approved').filter(u => u.username.toLowerCase().includes(q) || (u.bio && u.bio.toLowerCase().includes(q))).slice(0, 5));
        const counts: Record<string, number> = {};
        for (const story of stories) counts[story.authorId] = (counts[story.authorId] || 0) + 1;
        setStoryCounts(counts);
      });
    }, 200);

    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  const goTo = (path: string) => { navigate(path); handleClose(); };
  const getExcerpt = (content: string) => {
    const q = query.trim().toLowerCase();
    const idx = content.toLowerCase().indexOf(q);
    if (idx === -1) return content.slice(0, 80) + (content.length > 80 ? '...' : '');
    const start = Math.max(0, idx - 30);
    const end = Math.min(content.length, idx + q.length + 50);
    return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
  };

  const hasResults = storyResults.length > 0 || userResults.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-md ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={handleClose} />
      <div className={`relative w-full max-w-xl bg-gray-950 border border-purple-900/40 rounded-2xl shadow-2xl shadow-purple-900/30 overflow-hidden ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-purple-900/30">
          <Search className="h-5 w-5 text-purple-400 shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search stories, users..." className="flex-1 bg-transparent text-gray-200 text-base placeholder-gray-600 focus:outline-none" />
          <button onClick={handleClose} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!hasQuery && (
            <div className="px-5 py-10 text-center">
              <Search className="h-10 w-10 text-gray-800 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Start typing to search stories and users</p>
            </div>
          )}
          {hasQuery && !hasResults && (
            <div className="px-5 py-10 text-center">
              <Search className="h-10 w-10 text-gray-800 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No results for "<span className="text-purple-400">{query}</span>"</p>
            </div>
          )}

          {storyResults.length > 0 && (
            <div className="py-2">
              <p className="px-5 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest flex items-center gap-2"><BookOpen className="h-3 w-3" /> Stories ({storyResults.length})</p>
              {storyResults.map((story, idx) => {
                const catSettings = getSettings().categories.find(c => c.name === story.category);
                const presetColor = COLOR_PRESETS[catSettings?.colorKey || 'purple'] || COLOR_PRESETS.purple;
                const isSelected = selectedIndex === idx;
                return (
                  <button id={`search-result-${idx}`} key={story.id} onClick={() => goTo(`/story/${story.id}`)} className={`w-full flex items-start gap-3 px-5 py-3 transition-colors text-left group ${isSelected ? 'bg-purple-900/30' : 'hover:bg-purple-900/15'}`}>
                    <div className={`h-10 w-10 rounded-xl bg-purple-900/20 border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-purple-800/30'}`}>
                      <BookOpen className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate">{story.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{getExcerpt(story.content)}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${presetColor.bg} ${presetColor.text} text-[10px] font-medium rounded-md border ${presetColor.border}`}>
                          <span className={`h-1 w-1 rounded-full ${presetColor.dot}`} />{story.category}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-600"><Heart className="h-2.5 w-2.5" />{story.likes}</span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-600"><Clock className="h-2.5 w-2.5" />{new Date(story.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {userResults.length > 0 && (
            <div className="py-2 border-t border-gray-800/50">
              <p className="px-5 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest flex items-center gap-2"><User className="h-3 w-3" /> Users ({userResults.length})</p>
              {userResults.map((u, idx) => {
                const storyCount = storyCounts[u.id] || 0;
                const itemIndex = storyResults.length + idx;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <button id={`search-result-${itemIndex}`} key={u.id} onClick={() => goTo(`/user/${u.id}`)} className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left group ${isSelected ? 'bg-purple-900/30' : 'hover:bg-purple-900/15'}`}>
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white text-sm font-bold uppercase overflow-hidden ring-2 shrink-0 ${isSelected ? 'ring-purple-500' : 'ring-purple-800/30'}`}>
                      {u.avatar ? <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : u.username[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-200 group-hover:text-purple-300 transition-colors truncate">{u.username}</p>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-900/30 text-purple-400 rounded-md capitalize border border-purple-800/30">{u.role}</span>
                      </div>
                      {u.bio ? <p className="text-xs text-gray-600 truncate mt-0.5">{u.bio}</p> : <p className="text-xs text-gray-700 italic mt-0.5">No bio</p>}
                      <span className="flex items-center gap-1 text-[10px] text-gray-600 mt-1"><BookOpen className="h-2.5 w-2.5" />{storyCount} {storyCount === 1 ? 'story' : 'stories'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-purple-900/30 px-5 py-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">{hasQuery && hasResults ? `${totalResults} results found` : 'Type to search'}</span>
          <span className="text-[10px] text-gray-700 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-500 text-[10px]">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
