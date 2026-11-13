import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Gamepad2,
  Clock,
  ArrowRight,
  Target,
  Edit3,
  X,
  CheckCircle,
  Plus,
  Play,
  Copy,
  Trash2,
  Sparkles,
  BookOpen,
  Calendar,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const UserDashboard = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('arena'); // 'arena' | 'creator'
  const [pin, setPin] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launchingId, setLaunchingId] = useState(null);
  const [creatorMsg, setCreatorMsg] = useState('');

  // Profile Edit Modal
  const [editOpen, setEditOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(user?.full_name || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatar_url || '');
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

  const loadData = async () => {
    try {
      await refreshUser();
      const [quizRes, myQuizRes, histRes] = await Promise.all([
        api.get('/quizzes?limit=8'),
        api.get('/quizzes/my').catch(() => ({ data: { quizzes: [] } })),
        api.get('/sessions/my-history').catch(() => ({ data: { history: [] } })),
      ]);
      setQuizzes(quizRes.data.quizzes || []);
      setMyQuizzes(myQuizRes.data.quizzes || []);
      setHistory(histRes.data.history || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshUser]);

  const handleJoinPin = (e) => {
    e.preventDefault();
    if (pin.trim().length === 6) {
      navigate(`/play?pin=${pin.trim()}`);
    }
  };

  const handleStartCompetition = async (quizId) => {
    setLaunchingId(quizId);
    try {
      const res = await api.post('/sessions/create', {
        quiz_id: quizId,
        session_type: 'live_multiplayer',
      });
      const newPin = res.data.pin;
      navigate(`/host?pin=${newPin}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start live competition');
    } finally {
      setLaunchingId(null);
    }
  };

  const handleDuplicate = async (quizId) => {
    try {
      await api.post(`/quizzes/${quizId}/duplicate`);
      setCreatorMsg('Quiz duplicated successfully!');
      loadData();
      setTimeout(() => setCreatorMsg(''), 3000);
    } catch (err) {
      alert('Failed to duplicate quiz');
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      setCreatorMsg('Quiz deleted successfully');
      loadData();
      setTimeout(() => setCreatorMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete quiz');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullNameInput.trim()) return;
    setSavingProfile(true);
    try {
      const res = await api.put('/users/profile', {
        full_name: fullNameInput.trim(),
        avatar_url: avatarUrlInput.trim() || undefined,
      });
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

  const creationDateFormatted = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const lastLoginFormatted = user?.last_login
    ? new Date(user.last_login).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      })
    : 'Just now';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
      {/* HERO BANNER & USER ACCOUNT CARD */}
      <GlassCard className="p-8 border-neon-cyan/30 shadow-glow-cyan relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl border-2 border-neon-cyan/50 shadow-glow-cyan bg-surfaceLight object-cover"
                referrerPolicy="no-referrer"
              />
              <div
                className="absolute -bottom-1 -right-1 bg-surface border border-neon-cyan/60 rounded-full p-1 shadow-sm"
                title="Google Verified Account"
              >
                <ShieldCheck className="w-4 h-4 text-neon-cyan" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-wide">
                  {user?.full_name || 'QuizHub Player'}
                </h1>
                <Badge variant="cyan" className="font-semibold text-xs py-0.5 px-2.5">
                  User Account
                </Badge>
                {user?.google_id && (
                  <Badge variant="blue" className="text-[11px] py-0.5 px-2">
                    Google Connected
                  </Badge>
                )}
              </div>

              <p className="text-slate-400 text-sm mt-1">{user?.email}</p>

              {/* Account Meta: ID, Joined, Last Active */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Joined: <span className="text-slate-300 font-sans">{creationDateFormatted}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Last Active: <span className="text-slate-300 font-sans">{lastLoginFormatted}</span>
                </span>
                <span className="text-slate-500">ID: #{user?.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <NeonButton
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={() => {
                setFullNameInput(user?.full_name || '');
                setAvatarUrlInput(user?.avatar_url || '');
                setEditOpen(true);
              }}
            >
              Edit Profile
            </NeonButton>
            <Link to="/create-quiz">
              <NeonButton variant="primary" size="sm" icon={Plus}>
                Create Quiz
              </NeonButton>
            </Link>
          </div>
        </div>

        {profileMsg && (
          <div className="mt-4 p-2.5 rounded-lg bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {profileMsg}
          </div>
        )}

        {/* Level Progression Bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium">
              Rank Status: <span className="text-white font-bold">Level {profile.level} Challenger</span>
            </span>
            <span className="text-neon-cyan font-bold font-mono">
              {profile.xp % 1000} / 1000 XP to Level {profile.level + 1}
            </span>
          </div>
          <div className="w-full h-3 bg-surfaceLight rounded-full overflow-hidden p-0.5 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan rounded-full shadow-glow-cyan"
            />
          </div>
        </div>
      </GlassCard>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard className="p-4 border-neon-blue/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue shadow-glow-blue">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total XP</p>
            <p className="text-xl font-black text-white font-mono">{profile.xp}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-neon-amber/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neon-amber/20 border border-neon-amber/30 flex items-center justify-center text-neon-amber shadow-glow-amber">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Win Streak</p>
            <p className="text-xl font-black text-white font-mono">{profile.streak} 🔥</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-neon-purple/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center text-neon-purple shadow-glow-purple">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Played</p>
            <p className="text-xl font-black text-white font-mono">{profile.total_quizzes_played}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-neon-cyan/20 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-glow-cyan">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Accuracy</p>
            <p className="text-xl font-black text-white font-mono">{profile.accuracy_rate}%</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-neon-pink/20 flex items-center gap-3.5 col-span-2 md:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-neon-pink/20 border border-neon-pink/30 flex items-center justify-center text-neon-pink shadow-glow-pink">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">My Quizzes</p>
            <p className="text-xl font-black text-white font-mono">{myQuizzes.length}</p>
          </div>
        </GlassCard>
      </div>

      {/* TABS: ARENA VS CREATOR STUDIO */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('arena')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'arena'
              ? 'border-neon-cyan text-neon-cyan'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Play & Practice Arena
        </button>
        <button
          onClick={() => setActiveTab('creator')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'creator'
              ? 'border-neon-purple text-neon-purple'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Quiz Creator Studio ({myQuizzes.length})
        </button>
      </div>

      {/* TAB 1: ARENA (PIN JOIN, PRACTICE, HISTORY) */}
      {activeTab === 'arena' && (
        <div className="space-y-8">
          {/* Quick PIN Join Banner */}
          <GlassCard className="p-6 border-neon-cyan/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shrink-0">
                <Gamepad2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Join Live Match by PIN</h3>
                <p className="text-slate-400 text-xs">Enter a 6-digit game room code to battle other players live</p>
              </div>
            </div>

            <form onSubmit={handleJoinPin} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="123456"
                className="w-36 px-4 py-2 bg-surfaceLight rounded-xl border border-white/20 text-center font-mono font-bold tracking-widest text-white text-lg focus:outline-none focus:border-neon-cyan"
              />
              <NeonButton variant="cyan" size="md" type="submit" disabled={pin.trim().length !== 6}>
                Enter Game
              </NeonButton>
            </form>
          </GlassCard>

          {/* Practice Quizzes Catalog */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-white">Featured Practice Arena</h2>
                <p className="text-slate-400 text-xs">Sharpen your knowledge solo and earn XP</p>
              </div>
              <Link to="/explore" className="text-xs text-neon-cyan hover:underline flex items-center gap-1 font-semibold">
                Explore All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading arena quizzes...</div>
            ) : quizzes.length === 0 ? (
              <GlassCard className="p-8 text-center text-slate-400">No practice quizzes available at the moment.</GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quizzes.map((q) => (
                  <GlassCard key={q.id} className="p-5 flex flex-col justify-between border-white/10 hover:border-neon-cyan/40 transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="blue">{q.category}</Badge>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{q.difficulty}</span>
                      </div>
                      <h4 className="font-bold text-white text-base group-hover:text-neon-cyan transition-colors line-clamp-1">{q.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{q.description || 'Test your speed and accuracy in this quiz arena.'}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {q.time_limit_per_question}s / Q
                      </span>
                      <Link to={`/practice/${q.id}`}>
                        <NeonButton variant="outline" size="xs">
                          Practice
                        </NeonButton>
                      </Link>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Recent Match Activity History */}
          <div>
            <h2 className="text-xl font-bold font-heading text-white mb-4">Recent Match Activity</h2>
            {history.length === 0 ? (
              <GlassCard className="p-8 text-center text-slate-400">
                <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p>No matches played yet. Join a live room with a PIN or jump into Practice mode!</p>
              </GlassCard>
            ) : (
              <GlassCard className="p-0 overflow-hidden border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-surfaceLight/80 text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="py-3 px-6">Match / Quiz</th>
                        <th className="py-3 px-6">Rank</th>
                        <th className="py-3 px-6">Score</th>
                        <th className="py-3 px-6">Correct</th>
                        <th className="py-3 px-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.slice(0, 10).map((h, i) => (
                        <tr key={h.id || i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-white">{h.quiz_title || `Match #${h.id}`}</td>
                          <td className="py-3.5 px-6 font-mono">
                            <span className={h.rank === 1 ? 'text-neon-amber font-bold' : 'text-slate-300'}>
                              {h.rank === 1 ? '🥇 #1' : h.rank === 2 ? '🥈 #2' : h.rank === 3 ? '🥉 #3' : `#${h.rank}`}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-mono font-bold text-neon-cyan">{h.score} pts</td>
                          <td className="py-3.5 px-6 font-mono">{h.correct_answers}/{h.total_questions}</td>
                          <td className="py-3.5 px-6 text-xs text-slate-400">
                            {h.played_at ? new Date(h.played_at).toLocaleDateString() : 'Recent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATOR STUDIO (AUTHORED QUIZZES, HOST LIVE MATCH, AI GENERATOR) */}
      {activeTab === 'creator' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-white">My Created Quizzes</h2>
              <p className="text-slate-400 text-xs">Author quizzes manually or generate complete question packs with Gemini AI</p>
            </div>
            <Link to="/create-quiz">
              <NeonButton variant="purple" size="sm" icon={Sparkles}>
                Create New Quiz
              </NeonButton>
            </Link>
          </div>

          {creatorMsg && (
            <div className="p-3 rounded-xl bg-neon-purple/20 border border-neon-purple/40 text-neon-purple text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {creatorMsg}
            </div>
          )}

          {myQuizzes.length === 0 ? (
            <GlassCard className="p-12 text-center border-dashed border-white/20">
              <div className="w-16 h-16 rounded-2xl bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center mx-auto mb-4 text-neon-purple">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">You haven't created any quizzes yet</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                Build your first quiz! Use the built-in AI Quiz Assistant to generate high-quality questions on any topic in seconds.
              </p>
              <Link to="/create-quiz">
                <NeonButton variant="primary" size="md" icon={Plus}>
                  Launch Quiz Creator
                </NeonButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myQuizzes.map((quiz) => (
                <GlassCard key={quiz.id} className="p-6 border-white/10 hover:border-neon-purple/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="purple">{quiz.category}</Badge>
                      <span className="text-[11px] font-mono text-slate-400">{quiz.total_questions || quiz.questions_count || 0} Questions</span>
                    </div>

                    <h3 className="text-lg font-bold text-white line-clamp-1">{quiz.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{quiz.description || 'Custom user created quiz.'}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                    <NeonButton
                      variant="primary"
                      size="sm"
                      icon={Play}
                      className="w-full"
                      loading={launchingId === quiz.id}
                      onClick={() => handleStartCompetition(quiz.id)}
                    >
                      Host Live Match
                    </NeonButton>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <Link to={`/practice/${quiz.id}`} className="text-slate-400 hover:text-white transition-colors">
                        Preview Solo
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDuplicate(quiz.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Duplicate Quiz"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(quiz.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6 border-neon-cyan/40 shadow-glow-cyan relative">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-neon-cyan" /> Edit Profile Details
                </h3>
                <button
                  onClick={() => setEditOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full px-4 py-2 bg-surfaceLight rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-neon-cyan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-surfaceLight rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-neon-cyan"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Defaults to your official Google account picture.</p>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <NeonButton variant="outline" size="sm" type="button" onClick={() => setEditOpen(false)}>
                    Cancel
                  </NeonButton>
                  <NeonButton variant="cyan" size="sm" type="submit" loading={savingProfile}>
                    Save Changes
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;

