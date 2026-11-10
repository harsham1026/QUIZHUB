import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, Shield, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const TournamentsPage = () => {
  const { isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
  }, []);

  const handleRegister = async (tourneyId) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    try {
      await api.post(`/tournaments/${tourneyId}/register`);
      setMessage('Successfully enrolled in the championship tournament!');
      fetchTournaments();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
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
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-neon-emerald/10 border border-neon-emerald/30 text-neon-emerald text-sm flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
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
                variant={t.status === 'registration_open' ? 'cyan' : 'outline'}
                size="md"
                className="w-full"
                onClick={() => handleRegister(t.id)}
                disabled={t.status !== 'registration_open'}
              >
                {t.status === 'registration_open' ? 'Enroll in Championship' : 'View Tournament'}
              </NeonButton>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentsPage;

