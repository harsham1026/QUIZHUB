import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Play,
  ArrowRight,
  Trophy,
  CheckCircle,
  Clock,
  Sparkles,
  QrCode,
  LogOut,
  Flame,
  Volume2
} from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import TimerRing from '../components/game/TimerRing';
import Podium from '../components/game/Podium';

export const HostGamePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pin = searchParams.get('pin');

  const {
    initHost,
    startGame,
    nextQuestion,
    endGame,
    participants,
    gameStatus,
    currentQuestion,
    questionResult,
    leaderboard,
    finalPodium,
    answersCount,
  } = useGame();

  useEffect(() => {
    if (pin) {
      initHost(pin);
    }
  }, [pin]);

  // LOBBY VIEW
  if (gameStatus === 'lobby') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center relative z-10 space-y-8">
        <GlassCard className="p-10 border-neon-cyan/40 shadow-glow-cyan">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono font-bold uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Competition Lobby Active
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-300">
            JOIN AT <span className="text-white font-mono">{window.location.host}/play</span> WITH PIN:
          </h2>

          <div className="my-6 inline-block px-10 py-5 rounded-3xl bg-surface border-2 border-neon-cyan shadow-glow-cyan">
            <span className="text-6xl sm:text-8xl font-black font-mono tracking-widest text-neon-cyan">
              {pin}
            </span>
          </div>

          <p className="text-slate-400 text-sm">
            Players can also join by clicking "Enter PIN" in the top navbar.
          </p>

          <div className="mt-8 flex justify-center">
            <NeonButton
              variant="cyan"
              size="lg"
              icon={Play}
              disabled={participants.length === 0}
              onClick={startGame}
              className="text-lg px-10 py-4"
            >
              Start Game ({participants.length} Players)
            </NeonButton>
          </div>
        </GlassCard>

        {/* Connected Participants Lobby */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-blue" />
              WAITING FOR GLADIATORS ({participants.length})
            </h3>
            {participants.length === 0 && (
              <span className="text-xs text-slate-500 italic">Waiting for first participant to join...</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {participants.map((p) => (
              <motion.div
                key={p.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 rounded-2xl glass-panel border-white/10 flex flex-col items-center text-center shadow-md"
              >
                <img
                  src={p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.nickname}`}
                  alt={p.nickname}
                  className="w-12 h-12 rounded-xl bg-surface mb-2 border border-neon-blue/30"
                />
                <span className="text-xs font-bold text-white truncate max-w-full">
                  {p.nickname}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION VIEW
  if (gameStatus === 'question_active' && currentQuestion) {
    const totalConnected = Math.max(1, participants.filter((p) => p.is_connected).length);

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10 space-y-6">
        <GlassCard className="p-8 border-neon-blue/30 shadow-glow-blue relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-surface border border-white/10 text-xs font-mono font-bold text-neon-cyan">
                Q {currentQuestion.question_index + 1} / {currentQuestion.total_questions}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {currentQuestion.points} MAX PTS
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block">ANSWERS</span>
                <span className="text-lg font-bold font-mono text-neon-cyan">
                  {answersCount} / {totalConnected}
                </span>
              </div>
              <TimerRing
                key={currentQuestion.id}
                duration={currentQuestion.remaining_seconds ?? currentQuestion.time_limit}
                onExpire={nextQuestion}
                size={70}
                strokeWidth={5}
              />
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-white text-center py-6 leading-snug">
            {currentQuestion.question_text}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {currentQuestion.options.map((opt, i) => {
              const colors = [
                'bg-red-500/20 border-red-500/50 text-red-300',
                'bg-blue-500/20 border-blue-500/50 text-blue-300',
                'bg-amber-500/20 border-amber-500/50 text-amber-300',
                'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
              ];
              const letters = ['▲', '◆', '●', '■'];
              return (
                <div
                  key={opt.id}
                  className={`p-5 rounded-2xl border flex items-center gap-4 ${colors[i % 4]}`}
                >
                  <span className="text-2xl font-black font-mono">{letters[i % 4]}</span>
                  <span className="text-base sm:text-lg font-bold text-white">{opt.option_text}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <NeonButton variant="cyan" size="md" icon={ArrowRight} onClick={nextQuestion}>
              Skip / Close Question
            </NeonButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // QUESTION RESULT & LEADERBOARD INTERMISSION
  if (gameStatus === 'showing_result') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 space-y-6">
        <GlassCard className="p-8 border-neon-purple/30 shadow-glow-purple">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-mono font-bold text-neon-cyan uppercase">
                Round Complete
              </span>
              <h2 className="text-2xl font-bold font-heading text-white">LIVE SCOREBOARD</h2>
            </div>
            <NeonButton variant="cyan" size="md" icon={ArrowRight} onClick={nextQuestion}>
              Next Question
            </NeonButton>
          </div>

          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl glass-panel border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center font-heading font-black text-neon-blue">
                    #{p.rank}
                  </span>
                  <span className="font-bold text-white text-base">{p.nickname}</span>
                  {p.streak > 1 && (
                    <span className="flex items-center gap-1 text-xs text-neon-pink font-mono font-bold">
                      <Flame className="w-3.5 h-3.5 fill-current" /> {p.streak} Streak
                    </span>
                  )}
                </div>
                <span className="text-xl font-mono font-black text-neon-cyan">
                  {p.score} PTS
                </span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  // GAME COMPLETED (FINAL PODIUM)
  if (gameStatus === 'completed') {
    return (
      <div className="relative z-10">
        <Podium podium={finalPodium} />
        <div className="flex justify-center pb-12">
          <NeonButton
            variant="cyan"
            size="lg"
            icon={CheckCircle}
            onClick={() => navigate('/teacher')}
          >
            Return to Teacher Studio
          </NeonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-24 text-slate-400">
      Initializing Game Session...
    </div>
  );
};

export default HostGamePage;

