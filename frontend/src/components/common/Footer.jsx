import React from 'react';
import { Zap, ShieldCheck, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-surface/50 backdrop-blur-md relative z-10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-blue flex items-center justify-center text-slate-950 font-black">
                <Zap className="w-5 h-5 text-slate-950 fill-current" />
              </div>
              <span className="text-xl font-bold font-heading text-white">QuizHub</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Think Fast. Play Smart. Win Big. The next-generation multiplayer esports learning platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Competitions</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/explore" className="hover:text-neon-cyan transition-colors">Explore Trivia</a></li>
              <li><a href="/tournaments" className="hover:text-neon-cyan transition-colors">Championship Brackets</a></li>
              <li><a href="/leaderboard" className="hover:text-neon-cyan transition-colors">Global Leaderboard</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/teacher" className="hover:text-neon-cyan transition-colors">Teacher Studio</a></li>
              <li><a href="/student" className="hover:text-neon-cyan transition-colors">Student Hub</a></li>
              <li><a href="/docs/api_documentation.md" className="hover:text-neon-cyan transition-colors">REST API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Integrity</h4>
            <div className="flex items-center gap-2 text-xs text-neon-emerald mb-2">
              <ShieldCheck className="w-4 h-4" /> Server Authoritative Anti-Cheat
            </div>
            <p className="text-xs text-slate-500">
              100% server-side answer verification, real-time millisecond latency sync, and streak multiplier rewards.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 QuizHub Global Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Built with speed, precision, and passion</span>
            <Heart className="w-3.5 h-3.5 text-neon-pink fill-current" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
