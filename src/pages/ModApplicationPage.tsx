import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { db } from '../store/db';
import { getSettings } from '../store/settings';
import { Shield, CheckCircle, AlertCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import type { ModApplication } from '../types';

export function ModApplicationPage() {
  const { user } = useAuth();
  const settings = getSettings();
  const [reason, setReason] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [timezone, setTimezone] = useState('');
  const [age, setAge] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingApp, setExistingApp] = useState<ModApplication | null | undefined>(undefined);

  useEffect(() => {
    if (user) {
      db.getModApplicationByUserId(user.id).then(app => setExistingApp(app || null));
    } else {
      setExistingApp(null);
    }
  }, [user]);

  if (!settings.allowModApplications) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center">
      <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Applications Closed</h2>
      <p className="text-gray-500 mb-6">Moderator applications are currently not available.</p>
      <Link to="/" className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium">Return Home</Link>
    </div></div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center">
      <Shield className="h-16 w-16 text-purple-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Login Required</h2>
      <p className="text-gray-500 mb-6">You need to be logged in to apply for moderator.</p>
      <Link to="/login" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">Go to Login</Link>
    </div></div>
  );

  if (user.role === 'moderator' || user.role === 'admin') return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-300 mb-2">Already a {user.role === 'admin' ? 'Admin' : 'Moderator'}!</h2>
      <p className="text-gray-500 mb-6">You already have elevated privileges.</p>
      <Link to="/" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">Go Home</Link>
    </div></div>
  );

  if (existingApp === undefined) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-purple-400 animate-spin" /></div>
  );

  if (existingApp && !submitted) {
    const statusMap = {
      pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/30', label: 'Under Review', msg: 'Your application is currently being reviewed.' },
      approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/30', label: 'Approved!', msg: 'Your moderator application was approved!' },
      rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/30', label: 'Not Selected', msg: 'Unfortunately your application was not selected.' },
    };
    const s = statusMap[existingApp.status];
    const Icon = s.icon;
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center"><div className="max-w-lg w-full text-center">
        <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full ${s.bg} border ${s.border} mb-6`}><Icon className={`h-10 w-10 ${s.color}`} /></div>
        <h2 className="text-2xl font-bold text-white mb-2">Application {s.label}</h2>
        <p className="text-gray-400 mb-6">{s.msg}</p>
        <div className={`${s.bg} border ${s.border} rounded-xl p-5 text-left mb-6`}>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Your Application Summary</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <div><span className="text-gray-500">Submitted:</span> {new Date(existingApp.createdAt).toLocaleDateString()}</div>
            <div><span className="text-gray-500">Availability:</span> {existingApp.availability} hours/week</div>
            <div><span className="text-gray-500">Timezone:</span> {existingApp.timezone}</div>
          </div>
        </div>
        <Link to="/" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">Return Home</Link>
      </div></div>
    );
  }

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4"><div className="text-center max-w-md animate-fade-in">
      <div className="h-20 w-20 rounded-full bg-purple-900/30 border border-purple-700/50 flex items-center justify-center mx-auto mb-6 animate-pulse-glow"><CheckCircle className="h-10 w-10 text-purple-400" /></div>
      <h2 className="text-2xl font-bold text-white mb-3">Application Submitted!</h2>
      <p className="text-gray-400 mb-6 leading-relaxed">Your moderator application has been received and is pending review.</p>
      <Link to="/" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium">Return Home</Link>
    </div></div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!reason.trim() || reason.trim().length < 50) { setError('Please write at least 50 characters explaining why.'); return; }
    if (!experience.trim()) { setError('Please describe your moderation experience.'); return; }
    if (!availability.trim()) { setError('Please specify your weekly availability.'); return; }
    if (!timezone.trim()) { setError('Please enter your timezone.'); return; }
    if (!age.trim()) { setError('Please confirm your age.'); return; }
    setSubmitting(true);
    try {
      await db.addModApplication({ userId: user.id, username: user.username, avatar: user.avatar || '', email: user.email, reason: reason.trim(), experience: experience.trim(), availability: availability.trim(), timezone: timezone.trim(), age: age.trim(), extraInfo: extraInfo.trim() });
      setSubmitted(true);
    } catch { setError('Failed to submit application.'); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">Moderator Application</h1>
          <p className="text-gray-400 text-lg">Apply to help moderate The Fear Archive community</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="mb-6 p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl text-sm text-amber-300">
          <p className="font-medium mb-1">What does a moderator do?</p>
          <p className="text-amber-400/70">Moderators review story submissions, manage user accounts, and help maintain a safe community.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (<div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-800/40 rounded-lg text-red-400 text-sm animate-slide-down"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>)}
          <div><label className="block text-sm font-medium text-gray-300 mb-1">Why do you want to be a moderator? <span className="text-red-400">*</span></label><p className="text-xs text-gray-600 mb-2">Minimum 50 characters.</p><textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="I want to help moderate..." rows={5} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-y" /><p className={`text-xs mt-1 ${reason.length < 50 ? 'text-gray-600' : 'text-green-500'}`}>{reason.length} / 50+</p></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1">Moderation experience <span className="text-red-400">*</span></label><textarea value={experience} onChange={e => setExperience(e.target.value)} placeholder="My experience includes..." rows={3} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-y" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Weekly availability <span className="text-red-400">*</span></label><input type="text" value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g. 5-10 hours" className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Timezone <span className="text-red-400">*</span></label><input type="text" value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. UTC+1, CET" className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1">Age confirmation <span className="text-red-400">*</span></label><select value={age} onChange={e => setAge(e.target.value)} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"><option value="">Select age range</option><option value="under-16">Under 16</option><option value="16-17">16-17</option><option value="18-24">18-24</option><option value="25-34">25-34</option><option value="35+">35+</option><option value="prefer-not">Prefer not to say (18+)</option></select></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1">Anything else? <span className="text-gray-600">(optional)</span></label><textarea value={extraInfo} onChange={e => setExtraInfo(e.target.value)} placeholder="Additional info..." rows={3} className="w-full px-4 py-3 bg-gray-900/80 border border-purple-900/30 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all resize-y" /></div>
          <div className="flex items-center justify-between pt-2">
            <Link to="/rules" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Read Community Rules →</Link>
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-900/30 disabled:opacity-60 flex items-center gap-2">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit Application</button>
          </div>
        </form>
      </div>
    </div>
  );
}
