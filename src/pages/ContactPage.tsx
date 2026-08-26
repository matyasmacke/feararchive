import { useState } from 'react';
import { Mail, Send, CheckCircle2, Youtube, Instagram, ArrowRight } from 'lucide-react';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulate network request
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent pb-2">
            Contact
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Have a spine-chilling story to share privately? Found a bug? Or just want to say hello? 
            We'd love to hear from you. Drop us a message below.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-start">
        
        {/* Contact Form */}
        <div className="lg:col-span-3 bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 sm:p-8 shadow-xl shadow-purple-900/10  group block animate-fade-in"
                style={{ animationDelay: `${60}ms`, animationFillMode: 'both' }}
              >
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center text-center py-12 h-full animate-scale-in">
              <div className="h-16 w-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8">
                Thank you for reaching out to The Fear Archive. Our team will review your message and get back to you if necessary.
              </p>
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-purple-900/50 rounded-xl text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600"
                    placeholder="John Doe"
                    disabled={status === 'submitting'}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-purple-900/50 rounded-xl text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600"
                    placeholder="john@example.com"
                    disabled={status === 'submitting'}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300">Subject</label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-purple-900/50 rounded-xl text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600"
                  placeholder="How can we help you?"
                  disabled={status === 'submitting'}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-purple-900/50 rounded-xl text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-600 resize-none"
                  placeholder="Write your message here..."
                  disabled={status === 'submitting'}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-900/30 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
              >
                {status === 'submitting' ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Info & Socials Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 sm:p-8 group block animate-fade-in"
                style={{ animationDelay: `${120}ms`, animationFillMode: 'both' }}
              >
            <h3 className="text-xl font-bold text-white mb-6">Contact Info</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0 text-purple-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-0.5">Email Us At</p>
                  <a href="mailto:contact@gloomysecrets.com" className="text-gray-200 hover:text-purple-400 transition-colors font-medium">
                    contact@gloomysecrets.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 sm:p-8 group block animate-fade-in"
                style={{ animationDelay: `${180}ms`, animationFillMode: 'both' }}
              >
            <h3 className="text-xl font-bold text-white mb-6">Follow Our Socials</h3>
            
            <div className="space-y-4">
              <a 
                href="https://www.youtube.com/@GloomySecrets" 
                target="_blank" 
                rel="noreferrer"
                className="group flex items-center justify-between p-4 bg-black/40 border border-gray-800 rounded-xl hover:border-red-500/50 hover:bg-red-500/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000]">
                    <Youtube className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">YouTube</p>
                    <p className="text-xs text-gray-500">@GloomySecrets</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
              </a>

              <a 
                href="https://www.instagram.com/gloomy_secrets" 
                target="_blank" 
                rel="noreferrer"
                className="group flex items-center justify-between p-4 bg-black/40 border border-gray-800 rounded-xl hover:border-pink-500/50 hover:bg-pink-500/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#E1306C]/10 flex items-center justify-center text-[#E1306C]">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">Instagram</p>
                    <p className="text-xs text-gray-500">@gloomy_secrets</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}
