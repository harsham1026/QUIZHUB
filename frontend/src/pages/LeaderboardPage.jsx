import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flame, Zap, Crown, Award, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import Badge from '../components/common/Badge';

export const LeaderboardPage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('all'); // all, weekly, monthly
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/leaderboard/global?period=${period}`);
        setLeaders(res.data.leaderboard || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-neon-amber/10 border border-neon-amber/30 mb-2">
          <Trophy className="w-8 h-8 text-neon-amber animate-bounce" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-heading text-white">
          GLOBAL LEADERBOARD
        </h1>
        <p className="text-slate-400 text-sm">
          The ultimate hall of fame. Contenders ranked by total XP points, streaks, and tournament victories.
        </p>

        {/* Period Selector Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-surface border border-white/10 mt-4">
          {['all', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-1.5 rounded-lg text-xs font-bold font-mono uppercase transition-all ${
                period === p
                  ? 'bg-neon-blue text-slate-950 shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All-Time' : p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Calculating rankings...</div>
      ) : leaders.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Rankings Recorded Yet</h3>
          <p className="text-slate-400 text-sm mt-1">
            No multiplayer matches have been completed in this time period yet.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/80 border-b border-white/10 text-xs uppercase font-mono text-slate-400">
                <tr>
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Gladiator</th>
                  <th className="py-4 px-6 text-center">Level</th>
                  <th className="py-4 px-6 text-center">Streak</th>
                  <th className="py-4 px-6 text-center">Wins</th>
                  <th className="py-4 px-6 text-center">Accuracy</th>
                  <th className="py-4 px-6 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaders.map((p) => {
                  const isCurrentUser = user && user.id === p.user_id;
                  return (
                    <tr
                      key={p.user_id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-neon-blue/10 border-l-4 border-neon-blue'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-4 px-6 text-center font-mono font-bold">
                        {p.rank === 1 ? (
                          <Crown className="w-5 h-5 text-neon-amber mx-auto" />
                        ) : p.rank === 2 ? (
                          <Medal className="w-5 h-5 text-slate-300 mx-auto" />
                        ) : p.rank === 3 ? (
                          <Medal className="w-5 h-5 text-amber-700 mx-auto" />
                        ) : (
                          <span className="text-slate-400">#{p.rank}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img
                          src={p.avatar_url}
                          alt={p.full_name}
                          className="w-10 h-10 rounded-xl bg-surface border border-white/10"
                        />
                        <div>
                          <p className="font-bold text-white flex items-center gap-2">
                            {p.full_name}
                            {isCurrentUser && <Badge variant="cyan" className="text-[10px] py-0">You</Badge>}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-xs font-bold text-slate-300">
                        LVL {p.level}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-neon-pink">
                          <Flame className="w-3.5 h-3.5 fill-current" /> {p.streak}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-slate-200">
                        {p.total_wins}
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-xs text-neon-cyan">
                        {p.accuracy_rate}%
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-extrabold text-neon-cyan text-base">
                        {p.xp.toLocaleString()} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default LeaderboardPage;

