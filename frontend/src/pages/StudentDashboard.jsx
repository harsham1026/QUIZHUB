import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Gamepad2,
  Clock,
  ArrowRight,
  TrendingUp,
  Target,
  Edit3,
  X,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const StudentDashboard = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(user?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const profile = user?.profile || {
    xp: 0,
    level: 1,
    streak: 0,
    total_quizzes_played: 0,
    total_wins: 0,
    accuracy_rate: 0,
    next_level_xp: 1000,
    current_level_progress: 0,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshUser();
        const [quizRes, histRes] = await Promise.all([
          api.get('/quizzes?limit=6'),
          api.get('/sessions/my-history').catch(() => ({ data: { history: [] } })),
        ]);
        setQuizzes(quizRes.data.quizzes || []);
        setHistory(histRes.data.history || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshUser]);

  const handleJoinPin = (e) => {
    e.preventDefault();
    if (pin.trim().length === 6) {
      navigate(`/play?pin=${pin.trim()}`);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullNameInput.trim()) return;
    setSavingProfile(true);
    try {
      const res = await api.put('/users/profile', { full_name: fullNameInput.trim() });
      updateUser(res.data.user);
      setProfileMsg('Profile updated!');
      setEditOpen(false);
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const levelProgress = Math.min(100, Math.round(((profile.xp % 1000) / 1000) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
      {/* HEADER HERO BANNER */}
      <GlassCard className="p-8 border-neon-blue/30 shadow-glow-blue relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl bg-surfaceLight border-2 border-neon-blue shadow-glow-blue"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-neon-cyan text-slate-950 font-black text-xs font-mono">
                LVL {profile.level}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-white">
                  Welcome back, {user?.full_name}!
                </h1>
                <Badge variant="blue">Student Gladiator</Badge>
                <button
                  type="button"
                  onClick={() => {
                    setFullNameInput(user?.full_name || '');
                    setEditOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-400 text-sm mt-1">Ready to dominate the leaderboard today?</p>

              {/* XP Progress bar */}
              <div className="mt-4 w-full sm:w-80">
                <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                  <span className="text-neon-cyan font-bold">{profile.xp} XP</span>
                  <span>Next: {profile.level * 1000} XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surfaceLight border border-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-purple rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick PIN Input Widget */}
          <div className="w-full md:w-auto p-4 rounded-2xl glass-panel border border-neon-cyan/40 shadow-glow-cyan">
            <p className="text-xs font-bold text-neon-cyan uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
              <Gamepad2 className="w-4 h-4" /> Instant Game Join
            </p>
            <form onSubmit={handleJoinPin} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="6-DIGIT PIN"
                className="w-36 px-3 py-2 bg-surface text-center font-mono font-bold text-base tracking-widest text-white rounded-xl border border-white/20 focus:border-neon-cyan focus:outline-none"
              />
              <NeonButton variant="cyan" size="sm" type="submit" disabled={pin.trim().length !== 6}>
                Join
              </NeonButton>
            </form>
          </div>
        </div>
      </GlassCard>

      {profileMsg && (
        <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{profileMsg}</span>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Streak', value: `${profile.streak} Days`, icon: Flame, color: 'text-neon-pink', bg: 'bg-neon-pink/10' },
          { label: 'Total Victories', value: profile.total_wins, icon: Trophy, color: 'text-neon-amber', bg: 'bg-neon-amber/10' },
          { label: 'Quizzes Played', value: profile.total_quizzes_played, icon: Target, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
          { label: 'Avg Accuracy', value: `${profile.accuracy_rate}%`, icon: TrendingUp, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
        ].map((item, idx) => (
          <GlassCard key={idx} className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">{item.label}</p>
              <h3 className="text-2xl font-bold font-heading text-white mt-0.5">{item.value}</h3>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* RECENT MATCH HISTORY */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-heading text-white">RECENT MATCH ACTIVITY</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.slice(0, 6).map((item) => (
              <GlassCard key={item.id} className="p-4 border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-neon-amber">
                    RANK #{item.final_rank}
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {item.final_score} PTS
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {item.correct_count} correct • {item.incorrect_count} missed
                  </p>
                </div>
                <Badge variant="cyan">+{item.xp_earned} XP</Badge>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* RECOMMENDED & PRACTICE QUIZZES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-heading text-white">RECOMMENDED TRIVIA</h2>
            <p className="text-xs text-slate-400">Jump into solo practice mode or browse all challenges</p>
          </div>
          <NeonButton variant="ghost" size="sm" onClick={() => navigate('/explore')}>
            View All Quizzes <ArrowRight className="w-4 h-4 ml-1" />
          </NeonButton>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading recommended quizzes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((q) => (
              <GlassCard key={q.id} hoverEffect className="flex flex-col justify-between overflow-hidden p-5 group">
                <div>
                  <div className="relative h-36 rounded-xl overflow-hidden mb-4 bg-surfaceLight">
                    <img
                      src={q.cover_image || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'}
                      alt={q.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <Badge variant={q.difficulty === 'hard' ? 'pink' : q.difficulty === 'easy' ? 'emerald' : 'amber'}>
                        {q.difficulty}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white font-mono">
                        {q.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-1">{q.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{q.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neon-blue" /> {q.time_limit_per_question}s / Q
                  </span>
                  <NeonButton
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/practice/${q.id}`)}
                  >
                    Practice Solo
                  </NeonButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-neon-blue/40 shadow-glow-blue relative">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold font-heading text-white mb-4">Edit Profile</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/20 text-white text-sm focus:outline-none focus:border-neon-blue"
                />
              </div>
              <NeonButton variant="primary" size="md" type="submit" loading={savingProfile} className="w-full">
                Save Changes
              </NeonButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
