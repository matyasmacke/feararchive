import { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Wrench, Shield, LogIn } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export function MaintenancePage() {
  const { login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.message);
      return;
    }
    // Auth context will handle it — if user is admin, App will re-render past maintenance
    // If not admin, show error
    setError('Only administrators can access the site during maintenance.');
  };

  return (
    <div className="min-h-screen bg-fear-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.08),transparent_60%)]" />
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-800/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Eye className="h-10 w-10 text-purple-400" />
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
            The Fear Archive
          </span>
        </div>

        {/* Maintenance card */}
        <div className="bg-gray-900/60 border border-purple-900/30 rounded-2xl p-8 backdrop-blur-sm shadow-2xl shadow-purple-900/10">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-950/50 border border-amber-800/30 flex items-center justify-center mx-auto mb-6">
            <Wrench className="h-10 w-10 text-amber-400 animate-pulse" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Under Maintenance
          </h1>
          <p className="text-gray-400 leading-relaxed mb-2">
            The Fear Archive is currently undergoing maintenance.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            We're working on improvements and will be back shortly. Thank you for your patience.
          </p>

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-gray-500">Maintenance active</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs text-gray-500">Admin access only</span>
            </div>
          </div>

          {!showLogin ? (
            <button
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30"
            >
              <LogIn className="h-4 w-4" />
              Admin Login
            </button>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 text-left animate-fade-in mt-4">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-900/50 to-transparent mb-6" />

              <h3 className="text-sm font-semibold text-gray-300 text-center mb-4 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                Administrator Login
              </h3>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm animate-slide-down">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Admin password"
                    className="w-full px-4 py-3 pr-12 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLogin(false); setError(''); }}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30 text-sm"
                >
                  Login
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-700">
          © {new Date().getFullYear()} The Fear Archive — We'll be back soon
        </p>
      </div>
    </div>
  );
}
