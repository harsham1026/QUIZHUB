import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Trophy, Compass, Swords, Shield, LogOut, User, Gamepad2, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NeonButton from './NeonButton';
import Badge from './Badge';

export const Navbar = () => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickPin, setQuickPin] = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const handleJoinByPin = (e) => {
    e.preventDefault();
    if (quickPin.trim().length === 6) {
      navigate(`/play?pin=${quickPin.trim()}`);
      setPinModalOpen(false);
      setQuickPin('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-neon-blue to-neon-purple p-0.5 shadow-glow-blue transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-neon-blue animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold font-heading tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-neon-blue">
                QUIZ<span className="text-neon-cyan">HUB</span>
              </span>
              <span className="hidden sm:block text-[10px] tracking-widest text-slate-400 uppercase -mt-1 font-mono">
                Esports Learning Arena
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-neon-cyan transition-colors">Home</Link>
            <Link to="/explore" className="hover:text-neon-cyan transition-colors flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> Explore
            </Link>
            <Link to="/tournaments" className="hover:text-neon-cyan transition-colors flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-neon-amber" /> Tournaments
            </Link>
            <Link to="/leaderboard" className="hover:text-neon-cyan transition-colors flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-neon-pink" /> Leaderboard
            </Link>
          </nav>

          {/* Action Area */}
          <div className="hidden md:flex items-center gap-4">
            <NeonButton
              variant="cyan"
              size="sm"
              icon={Gamepad2}
              onClick={() => setPinModalOpen(true)}
            >
              Enter PIN
            </NeonButton>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/student'}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-panel-interactive border-white/10"
                >
                  <img
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
                    alt="avatar"
                    className="w-7 h-7 rounded-lg bg-surfaceLight border border-neon-blue/30"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{user?.full_name?.split(' ')[0]}</p>
                    <Badge variant={role === 'admin' ? 'pink' : role === 'teacher' ? 'purple' : 'blue'} className="text-[10px] py-0 px-1.5">
                      {role}
                    </Badge>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5">
                  Sign In
                </Link>
                <NeonButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </NeonButton>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-white/10 px-6 py-4 space-y-4">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-slate-200">Home</Link>
            <Link to="/explore" onClick={() => setMobileMenuOpen(false)} className="block text-slate-200">Explore</Link>
            <Link to="/tournaments" onClick={() => setMobileMenuOpen(false)} className="block text-slate-200">Tournaments</Link>
            <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="block text-slate-200">Leaderboard</Link>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <NeonButton variant="cyan" size="sm" onClick={() => { setMobileMenuOpen(false); setPinModalOpen(true); }}>
                Enter PIN to Play
              </NeonButton>
              {isAuthenticated ? (
                <div className="flex items-center justify-between pt-2">
                  <Link
                    to={role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/student'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-neon-blue"
                  >
                    Go to Dashboard ({user?.full_name})
                  </Link>
                  <button onClick={logout} className="text-sm text-red-400">Logout</button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-sm bg-white/5 rounded-lg">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 text-sm bg-neon-blue text-slate-950 font-bold rounded-lg">Register</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Quick Join Game PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-neon-cyan/40 shadow-glow-cyan text-center relative">
            <button
              onClick={() => setPinModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center shadow-glow-cyan">
              <Gamepad2 className="w-8 h-8 text-neon-cyan" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-white">Join Competition</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">Enter the 6-digit PIN shown on the host's screen</p>
            <form onSubmit={handleJoinByPin} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={quickPin}
                onChange={(e) => setQuickPin(e.target.value.toUpperCase())}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-widest font-extrabold uppercase py-3.5 bg-surface rounded-xl border border-white/20 focus:border-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan/20 text-white placeholder-slate-600"
                autoFocus
              />
              <NeonButton
                variant="cyan"
                size="lg"
                className="w-full"
                type="submit"
                disabled={quickPin.trim().length !== 6}
              >
                Join Game Room
              </NeonButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

