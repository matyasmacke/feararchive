import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle, LogIn, UserPlus, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">You're logged in!</h2>
          <p className="text-gray-400 mb-6">Welcome back, {user.username}.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/profile')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">
              My Profile
            </button>
            <button onClick={() => navigate('/stories')} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium">
              Browse Stories
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }
    setLoginLoading(true);
    const result = await login(loginEmail.trim(), loginPassword);
    setLoginLoading(false);
    if (result.success) {
      navigate('/stories');
    } else {
      setLoginError(result.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    if (!regUsername.trim() || !regEmail.trim() || !regPassword || !regConfirm) {
      setRegError('Please fill in all fields.');
      return;
    }
    if (regUsername.trim().length < 3) {
      setRegError('Username must be at least 3 characters.');
      return;
    }
    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    setRegLoading(true);
    const result = await register(regUsername.trim(), regEmail.trim(), regPassword);
    setRegLoading(false);
    if (result.success) {
      setRegSuccess(result.message);
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
    } else {
      setRegError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Tab headers */}
        <div className="flex mb-8 bg-gray-900/50 rounded-xl p-1 border border-purple-900/20">
          <button
            onClick={() => { setIsSignUp(false); setRegError(''); setRegSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              !isSignUp ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <LogIn className="h-4 w-4" /> Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setLoginError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              isSignUp ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <UserPlus className="h-4 w-4" /> Sign Up
          </button>
        </div>

        {!isSignUp ? (
          /* ── Sign In ── */
          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-500">Sign in to your Fear Archive account</p>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm animate-slide-down">
                <AlertCircle className="h-4 w-4 shrink-0" /> {loginError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showLoginPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </button>

            <p className="text-center text-xs text-gray-600">
              Don't have an account?{' '}
              <button type="button" onClick={() => setIsSignUp(true)} className="text-purple-400 hover:text-purple-300">
                Create one
              </button>
            </p>
          </form>
        ) : (
          /* ── Sign Up ── */
          <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
              <p className="text-sm text-gray-500">Join the archive — your account will be reviewed</p>
            </div>

            {regError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm animate-slide-down">
                <AlertCircle className="h-4 w-4 shrink-0" /> {regError}
              </div>
            )}

            {regSuccess && (
              <div className="flex items-start gap-2 px-4 py-3 bg-green-900/20 border border-green-800/40 rounded-lg text-green-400 text-sm animate-slide-down">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showRegPw ? 'text' : 'password'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 pr-12 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={regConfirm}
                onChange={e => setRegConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {regLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Account
            </button>

            <p className="text-center text-xs text-gray-600">
              Already have an account?{' '}
              <button type="button" onClick={() => setIsSignUp(false)} className="text-purple-400 hover:text-purple-300">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
