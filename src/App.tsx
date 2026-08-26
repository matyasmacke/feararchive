import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { fetchSettings, getSettings } from './store/settings';
import { ScrollToTop } from './components/ScrollToTop';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { StoriesPage } from './pages/StoriesPage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { AddStoryPage } from './pages/AddStoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { RulesPage } from './pages/RulesPage';
import { GdprPage } from './pages/GdprPage';
import { ModApplicationPage } from './pages/ModApplicationPage';
import { ContactPage } from './pages/ContactPage';
import ChangelogPage from './pages/ChangelogPage';

function AppContent() {
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const check = () => setMaintenanceMode(getSettings().maintenanceMode);
    void fetchSettings().then(check);

    const handleSettingsChange = () => {
      void fetchSettings().then(check);
    };
    window.addEventListener('fear-settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('fear-settings-changed', handleSettingsChange);
    };
  }, []);

  // Show maintenance page if enabled and user is not admin
  if (maintenanceMode && (!user || user.role !== 'admin')) {
    return <MaintenancePage />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-fear-950">
      <Navbar />
      {/* Maintenance banner for admins */}
      {maintenanceMode && user?.role === 'admin' && (
        <div className="bg-amber-900/30 border-b border-amber-800/40 px-4 py-2 text-center">
          <span className="text-sm text-amber-300 font-medium">
            ⚠️ Maintenance mode is active — only admins can see the site. 
            <a href="#/settings" className="underline ml-2 hover:text-amber-200">Disable in Settings</a>
          </span>
        </div>
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/story/:id" element={<StoryDetailPage />} />
          <Route path="/add-story" element={<AddStoryPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/user/:id" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/gdpr" element={<GdprPage />} />
          <Route path="/apply-mod" element={<ModApplicationPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}
