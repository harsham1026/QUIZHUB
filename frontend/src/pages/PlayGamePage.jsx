import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
  Flame,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import TimerRing from '../components/game/TimerRing';

export const PlayGamePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPin = searchParams.get('pin') || '';

  const { user } = useAuth();
  const {
    pin,
    joinGame,
    gameStatus,
    currentQuestion,
    questionResult,
    submitAnswer,
    hasAnswered,
    selectedOptionIds,
    errorMessage,
    resetGame,
    finalPodium,
    leaderboard,
  } = useGame();

  const [inputPin, setInputPin] = useState(initialPin);
  const [nickname, setNickname] = useState(user?.full_name || '');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (initialPin && initialPin.length === 6 && user) {
      setInputPin(initialPin);
      setNickname(user.full_name);
    }
  }, [initialPin, user]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inputPin.trim() || !nickname.trim()) return;
    joinGame(inputPin.trim().toUpperCase(), nickname.trim());
    setJoined(true);
  };

  // 1. PIN & NICKNAME JOIN SCREEN
  if (!joined && gameStatus === 'idle') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative z-10">
        <GlassCard className="w-full max-w-md p-8 border-neon-cyan/40 shadow-glow-cyan text-center">
          <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center mx-auto mb-4 shadow-glow-cyan">
            <Gamepad2 className="w-8 h-8 text-neon-cyan" />
          </div>

          <h2 className="text-3xl font-black font-heading text-white">JOIN COMPETITION</h2>
          <p className="text-slate-400 text-sm mt-1 mb-6">Enter the host PIN and choose your battle tag</p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Game PIN
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-widest font-extrabold uppercase py-3 bg-surface rounded-xl border border-white/20 text-white focus:outline-none focus:border-neon-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nickname / Tag
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. CyberViper"
                className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/20 text-white text-sm focus:outline-none focus:border-neon-cyan"
              />
            </div>

            <NeonButton
              variant="cyan"
              size="lg"
              type="submit"
              className="w-full mt-2"
              disabled={inputPin.trim().length !== 6 || !nickname.trim()}
            >
              Enter Battle Room
            </NeonButton>
          </form>
        </GlassCard>
      </div>
    );
  }

  // 2. PLAYER LOBBY SCREEN
  if (gameStatus === 'lobby') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative z-10 text-center">
        <GlassCard className="w-full max-w-md p-10 border-neon-blue/30 shadow-glow-blue space-y-6">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full bg-neon-blue/20 border-2 border-neon-blue flex items-center justify-center mx-auto shadow-glow-blue"
          >
            <Zap className="w-10 h-10 text-neon-blue animate-pulse" />
          </motion.div>

          <div>
            <h2 className="text-3xl font-black font-heading text-white">YOU'RE IN!</h2>
            <p className="text-neon-cyan font-mono text-sm mt-1 font-bold">Tag: {nickname}</p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-white/10">
            <span className="text-xs text-slate-400 block font-mono">GAME PIN</span>
            <span className="text-2xl font-mono font-black text-white">{pin}</span>
          </div>

          <p className="text-xs text-slate-400 animate-pulse">
            Waiting for the host to launch the first question...
          </p>
        </GlassCard>
      </div>
    );
  }

  // 3. ACTIVE QUESTION ANSWERING SCREEN
  if (gameStatus === 'question_active' && currentQuestion) {
    const tileColors = [
      'bg-red-600 hover:bg-red-500 border-red-400/40 text-white shadow-lg',
      'bg-blue-600 hover:bg-blue-500 border-blue-400/40 text-white shadow-lg',
      'bg-amber-600 hover:bg-amber-500 border-amber-400/40 text-white shadow-lg',
      'bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40 text-white shadow-lg',
    ];
    const symbols = ['▲', '◆', '●', '■'];

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-4">
        {/* Top Question Info */}
        <div className="flex items-center justify-between px-2">
          <span className="px-3 py-1 rounded-lg bg-surface border border-white/10 text-xs font-mono font-bold text-neon-cyan">
            Q {currentQuestion.question_index + 1} / {currentQuestion.total_questions}
          </span>
          <TimerRing duration={currentQuestion.time_limit} size={64} strokeWidth={5} />
        </div>

        <GlassCard className="p-6 text-center border-neon-blue/30 shadow-glow-blue">
          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
            {currentQuestion.question_text}
          </h2>
        </GlassCard>

        {/* Answer option tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = selectedOptionIds.includes(opt.id);
            return (
              <motion.button
                key={opt.id}
                whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                disabled={hasAnswered}
                onClick={() => submitAnswer([opt.id])}
                className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-150 cursor-pointer text-left select-none ${
                  tileColors[i % 4]
                } ${
                  hasAnswered && isSelected
                    ? 'ring-4 ring-white border-white scale-102'
                    : hasAnswered && !isSelected
                    ? 'opacity-40 cursor-not-allowed'
                    : ''
                }`}
              >
                <span className="text-3xl font-mono font-black shrink-0">{symbols[i % 4]}</span>
                <span className="text-base sm:text-lg font-bold flex-1 leading-snug">
                  {opt.option_text}
                </span>
              </motion.button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className="text-center pt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-neon-cyan/40 text-neon-cyan font-bold text-xs font-mono animate-pulse">
              <CheckCircle className="w-4 h-4" /> Answer Submitted. Waiting for round timer...
            </span>
          </div>
        )}
      </div>
    );
  }

  // 4. ROUND RESULT SCREEN
  if (gameStatus === 'showing_result') {
    const correctIds = questionResult?.correct_option_ids || [];
    const isPlayerCorrect = selectedOptionIds.some((id) => correctIds.includes(id));

    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 relative z-10 text-center">
        <GlassCard className="w-full max-w-md p-10 border-white/20 shadow-glow-blue space-y-6">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center">
            {isPlayerCorrect ? (
              <div className="w-full h-full rounded-2xl bg-neon-emerald/20 border-2 border-neon-emerald flex items-center justify-center text-neon-emerald">
                <CheckCircle className="w-12 h-12" />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl bg-neon-pink/20 border-2 border-neon-pink flex items-center justify-center text-neon-pink">
                <XCircle className="w-12 h-12" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-3xl font-black font-heading text-white">
              {isPlayerCorrect ? 'CORRECT ANSWER!' : 'INCORRECT!'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {isPlayerCorrect
                ? 'Blazing speed bonus applied to your score!'
                : 'Keep your focus for the next round.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-white/10 text-xs text-slate-400 font-mono">
            Host will progress to the next round shortly...
          </div>
        </GlassCard>
      </div>
    );
  }

  // 5. GAME COMPLETED
  if (gameStatus === 'completed') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center relative z-10">
        <GlassCard className="p-8 border-neon-amber/40 shadow-glow-amber space-y-6">
          <Award className="w-16 h-16 text-neon-amber mx-auto animate-bounce" />
          <h2 className="text-3xl font-black font-heading text-white">BATTLE FINISHED!</h2>
          <p className="text-slate-300 text-sm">
            Awesome match, <span className="text-neon-cyan font-bold">{nickname}</span>! Check the host's screen for the 3D podium ceremony.
          </p>

          <NeonButton
            variant="cyan"
            size="lg"
            className="w-full"
            onClick={() => {
              resetGame();
              navigate('/student');
            }}
          >
            Back to Dashboard
          </NeonButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="text-center py-24 text-slate-400">
      Loading game arena...
    </div>
  );
};

export default PlayGamePage;

