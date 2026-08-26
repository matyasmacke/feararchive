import { BookOpen, Users, Shield, PenTool, Heart } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-purple-900/30 via-fear-950 to-fear-950 py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.15),transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 bg-clip-text text-transparent">
            About The Fear Archive
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            A community-driven platform dedicated to the art of horror storytelling.
            Here, writers share their darkest tales and readers discover stories that
            linger long after the last word is read.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: PenTool,
              title: 'Write & Share',
              desc: 'Create your horror stories and submit them for review. Once approved, they become part of our growing archive of fear.',
            },
            {
              icon: BookOpen,
              title: 'Read & Discover',
              desc: 'Browse through curated horror stories across multiple categories. Filter by genre, length, and popularity.',
            },
            {
              icon: Heart,
              title: 'Like & Engage',
              desc: 'Show appreciation for stories that truly terrify you. Build your collection of favorite tales.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-purple-900/20 rounded-xl p-6 text-center animate-fade-in"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-800/30 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Users,
                title: 'Create an Account',
                desc: 'Sign up with a username, email, and password. Your account will be reviewed by our team before activation.',
              },
              {
                icon: PenTool,
                title: 'Submit Your Story',
                desc: 'Write your horror story, select a category and length tag, then submit it for review.',
              },
              {
                icon: Shield,
                title: 'Moderation Review',
                desc: 'Our admins and moderators review every submission to ensure quality and appropriateness.',
              },
              {
                icon: BookOpen,
                title: 'Published & Shared',
                desc: 'Once approved, your story appears in the archive for everyone to read, like, and share.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 bg-gray-900/30 border border-purple-900/20 rounded-xl"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-900/30 border border-purple-800/30 flex items-center justify-center">
                  <span className="text-purple-400 font-bold text-sm">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-200 mb-1 flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-purple-400" />
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-10">Community Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: 'User',
                color: 'from-blue-600/20 to-blue-900/20 border-blue-800/30',
                textColor: 'text-blue-400',
                perms: ['Read all stories', 'Like stories', 'Submit stories for review', 'Edit own profile'],
              },
              {
                role: 'Moderator',
                color: 'from-amber-600/20 to-amber-900/20 border-amber-800/30',
                textColor: 'text-amber-400',
                perms: ['All user permissions', 'Approve/reject stories', 'Approve/reject users', 'Access moderator dashboard'],
              },
              {
                role: 'Admin',
                color: 'from-red-600/20 to-red-900/20 border-red-800/30',
                textColor: 'text-red-400',
                perms: ['All moderator permissions', 'Manage user roles', 'Delete any content', 'Full site management'],
              },
            ].map((r, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${r.color} border rounded-xl p-6 text-left`}
              >
                <h3 className={`text-lg font-bold ${r.textColor} mb-3`}>{r.role}</h3>
                <ul className="space-y-2">
                  {r.perms.map((p, j) => (
                    <li key={j} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className={`${r.textColor} mt-1`}>•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
