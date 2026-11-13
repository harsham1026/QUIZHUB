import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const TournamentsPage = () => {
  const { isAuthenticated, role } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create tournament modal state (teacher/admin)
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [maxParticipants, setMaxParticipants] = useState(64);

  const canCreate = isAuthenticated;

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments');
      setTournaments(res.data.tournaments || []);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [isAuthenticated]);

  const handleRegister = async (tourneyId) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setErrorMsg('');
    try {
      await api.post(`/tournaments/${tourneyId}/register`);
      setMessage('Successfully enrolled in the championship tournament!');
      fetchTournaments();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Registration failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setErrorMsg('');
    try {
      const now = new Date();
      const start = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const deadline = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      await api.post('/tournaments', {
        title: title.trim(),
        description: description.trim(),
        category,
        max_participants: Number(maxParticipants),
        status: 'registration_open',
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        registration_deadline: deadline.toISOString(),
      });

      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setMessage('Tournament created successfully!');
      fetchTournaments();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="amber">Esports Championship Brackets</Badge>
        <h1 className="text-4xl sm:text-6xl font-black font-heading text-white">
          PLATFORM TOURNAMENTS
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Enroll in high-stakes bracket competitions, earn exclusive badges, and ascend to the grandmaster hall of fame.
        </p>

        {canCreate && (
          <div className="pt-2">
            <NeonButton variant="cyan" size="md" icon={Plus} onClick={() => setCreateOpen(true)}>
              Create Tournament
            </NeonButton>
          </div>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-neon-emerald/10 border border-neon-emerald/30 text-neon-emerald text-sm flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Tournaments Scheduled</h3>
          <p className="text-slate-400 text-sm mt-1">Check back soon for the next championship kickoff.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((t) => (
            <GlassCard key={t.id} hoverEffect className="p-6 border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={t.status === 'live' ? 'pink' : t.status === 'registration_open' ? 'emerald' : 'blue'}>
                    {t.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{t.category}</span>
                </div>

                <h3 className="text-2xl font-black font-heading text-white mb-2">{t.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{t.description}</p>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface border border-white/10 text-xs font-mono mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neon-cyan" />
                    <span>{t.current_participants} / {t.max_participants} Enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neon-blue" />
                    <span>{new Date(t.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <NeonButton
                variant={t.is_registered ? 'outline' : t.status === 'registration_open' ? 'cyan' : 'outline'}
                size="md"
                className="w-full"
                onClick={() => handleRegister(t.id)}
                disabled={t.is_registered || t.status !== 'registration_open'}
              >
                {t.is_registered
                  ? 'Enrolled ✓'
                  : t.status === 'registration_open'
                  ? 'Enroll in Championship'
                  : t.status.replace('_', ' ').toUpperCase()}
              </NeonButton>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Tournament Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-neon-cyan/40 shadow-glow-cyan relative">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold font-heading text-white mb-4">New Tournament</h3>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tournament Name
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spring Cyber Cup"
                  className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/20 text-white text-sm focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rules & overview..."
                  className="w-full px-4 py-2 bg-surface rounded-xl border border-white/20 text-white text-sm focus:outline-none focus:border-neon-cyan"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface rounded-xl border border-white/20 text-white text-sm"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Science">Science</option>
                    <option value="General Knowledge">General</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Players
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="500"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface rounded-xl border border-white/20 text-white text-sm"
                  />
                </div>
              </div>
              <NeonButton variant="cyan" size="md" type="submit" loading={creating} className="w-full">
                Launch Tournament
              </NeonButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentsPage;
