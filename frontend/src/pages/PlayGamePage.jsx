import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Zap,
  CheckCircle,
  XCircle,
  Award,
  Send,
  Download,
  Trophy,
  Users,
  RotateCcw,
  Flame,
  FileText
} from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import TimerRing from '../components/game/TimerRing';
import Podium from '../components/game/Podium';

export const PlayGamePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPin = searchParams.get('pin') || '';

  const { user } = useAuth();
  const {
    pin,
    participantId,
    joinGame,
    gameStatus,
    currentQuestion,
    questionResult,
    submitAnswer,
    hasAnswered,
    selectedOptionIds,
    errorMessage,
    resetGame,
    leaderboard,
    finalPodium,
    fullStandings,
    quizTitle,
    totalQuestions,
  } = useGame();

  const [inputPin, setInputPin] = useState(initialPin);
  const [nickname, setNickname] = useState(user?.full_name || '');
  const [joined, setJoined] = useState(false);
  const [multiSelection, setMultiSelection] = useState([]);

  useEffect(() => {
    if (initialPin && initialPin.length === 6) {
      setInputPin(initialPin);
    }
    if (user?.full_name) {
      setNickname(user.full_name);
    }
  }, [initialPin, user]);

  useEffect(() => {
    setMultiSelection([]);
  }, [currentQuestion?.id]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inputPin.trim() || !nickname.trim()) return;
    const ok = await joinGame(inputPin.trim().toUpperCase(), nickname.trim());
    if (ok) {
      setJoined(true);
    }
  };

  // 1. PIN & NICKNAME JOIN SCREEN
  if (!joined || gameStatus === 'idle') {
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
    const isMulti = currentQuestion.question_type === 'multi_select';

    const handleTileClick = (optId) => {
      if (hasAnswered) return;
      if (isMulti) {
        setMultiSelection((prev) =>
          prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
        );
      } else {
        submitAnswer([optId]);
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-10 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-surface border border-white/10 text-xs font-mono font-bold text-neon-cyan">
              Q {currentQuestion.question_index + 1} / {currentQuestion.total_questions}
            </span>
            {isMulti && (
              <span className="px-2.5 py-1 rounded-lg bg-neon-purple/20 border border-neon-purple/40 text-[11px] font-mono font-bold text-neon-purple">
                MULTI-SELECT
              </span>
            )}
          </div>
          <TimerRing
            key={currentQuestion.id}
            duration={currentQuestion.remaining_seconds ?? currentQuestion.time_limit}
            size={64}
            strokeWidth={5}
          />
        </div>

        <GlassCard className="p-6 text-center border-neon-blue/30 shadow-glow-blue">
          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
            {currentQuestion.question_text}
          </h2>
        </GlassCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = hasAnswered
              ? selectedOptionIds.includes(opt.id)
              : multiSelection.includes(opt.id);

            return (
              <motion.button
                key={opt.id}
                whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                disabled={hasAnswered}
                onClick={() => handleTileClick(opt.id)}
                className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-150 cursor-pointer text-left select-none ${
                  tileColors[i % 4]
                } ${
                  isSelected
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

        {isMulti && !hasAnswered && (
          <div className="pt-4 flex justify-center">
            <NeonButton
              variant="cyan"
              size="lg"
              icon={Send}
              disabled={multiSelection.length === 0}
              onClick={() => submitAnswer(multiSelection)}
            >
              Submit Selected ({multiSelection.length})
            </NeonButton>
          </div>
        )}

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
    const myServerResult = questionResult?.my_result;
    const isPlayerCorrect = myServerResult
      ? myServerResult.is_correct
      : correctIds.length > 0 &&
        selectedOptionIds.length === correctIds.length &&
        selectedOptionIds.every((id) => correctIds.includes(id));

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
            {myServerResult && isPlayerCorrect ? (
              <p className="text-neon-cyan font-mono font-bold text-lg mt-2">
                +{myServerResult.points_awarded} PTS ({myServerResult.response_time_seconds}s)
              </p>
            ) : (
              <p className="text-slate-400 text-xs mt-1">
                {isPlayerCorrect
                  ? 'Blazing speed bonus applied to your score!'
                  : 'Keep your focus for the next round.'}
              </p>
            )}
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
    const standingsList = (fullStandings && fullStandings.length > 0) ? fullStandings : leaderboard;
    const myStanding = standingsList.find(
      (s) => s.id === participantId || s.nickname === nickname
    );
    const myRank = myStanding?.final_rank || myStanding?.rank || 1;
    const myScore = myStanding?.final_score ?? myStanding?.score ?? 0;
    const myXp = myStanding?.xp_earned ?? Math.round(myScore / 10 + (myRank === 1 ? 300 : myRank === 2 ? 200 : myRank === 3 ? 100 : 50));

    const downloadPlayerReport = () => {
      const dateStr = new Date().toLocaleString();
      let csv = '==================================================\n';
      csv += 'QUIZHUB MULTIPLAYER BATTLE REPORT\n';
      csv += '==================================================\n';
      csv += `Competition Title,"${(quizTitle || 'Live Multiplayer Match').replace(/"/g, '""')}"\n`;
      csv += `Room PIN,${pin}\n`;
      csv += `Completed At,"${dateStr}"\n`;
      csv += `Player Nickname,"${nickname}"\n`;
      csv += `Final Rank,#${myRank}\n`;
      csv += `Final Score,${myScore} PTS\n`;
      csv += `XP Awarded,+${myXp} XP\n`;
      csv += `Total Competitors,${standingsList.length}\n\n`;

      csv += 'COMPLETE MATCH STANDINGS\n';
      csv += 'Rank,Player Nickname,Final Score,XP Awarded,Result\n';
      standingsList.forEach((p, idx) => {
        const pRank = p.final_rank || p.rank || (idx + 1);
        const pScore = p.final_score ?? p.score ?? 0;
        const pXp = p.xp_earned ?? (Math.floor(pScore / 10) + 50);
        const isMe = (p.id === participantId || p.nickname === nickname) ? ' (YOU)' : '';
        csv += `${pRank},"${p.nickname}${isMe}",${pScore},+${pXp} XP,${pRank <= 3 ? 'Podium Winner' : 'Gladiator'}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuizHub_Match_${pin || 'battle'}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 relative z-10 space-y-8">
        {/* Championship Podium */}
        {finalPodium && finalPodium.length > 0 && (
          <Podium podium={finalPodium} />
        )}

        {/* Player's Personal Victory Card */}
        <GlassCard className="p-8 border-neon-cyan/40 shadow-glow-cyan text-center">
          <div className="inline-flex p-3 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan mb-3">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
          <span className="text-xs font-mono text-neon-cyan uppercase tracking-widest block font-bold">
            COMPETITION COMPLETED
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading text-white mt-1">
            BATTLE FINISHED!
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Awesome performance, <span className="text-neon-cyan font-bold">{nickname}</span>!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-mono">
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">FINAL RANK</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-amber mt-1 block">
                #{myRank}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">FINAL SCORE</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-cyan mt-1 block">
                {myScore} PTS
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">XP EARNED</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-purple mt-1 block">
                +{myXp} XP
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">PLAYERS</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-200 mt-1 block">
                {standingsList.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-white/10">
            <NeonButton
              variant="primary"
              size="md"
              icon={Download}
              onClick={downloadPlayerReport}
              className="shadow-glow-cyan"
            >
              Download Report (.CSV)
            </NeonButton>
            <NeonButton
              variant="outline"
              size="md"
              icon={RotateCcw}
              onClick={() => {
                resetGame();
                navigate('/play');
              }}
            >
              Play Another Match
            </NeonButton>
            <NeonButton
              variant="outline"
              size="md"
              onClick={() => {
                resetGame();
                navigate('/dashboard');
              }}
            >
              Back to Dashboard
            </NeonButton>
          </div>
        </GlassCard>

        {/* Complete Match Standings Table */}
        <GlassCard className="p-6 border-white/10">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-neon-blue" />
                COMPLETE MATCH RESULTS & LEADERBOARD
              </h3>
              <p className="text-xs text-slate-400">Official match rankings for all participating gladiators</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-surface border border-white/10 text-slate-300">
              {standingsList.length} Competitors
            </span>
          </div>

          <div className="space-y-2">
            {standingsList.map((p, idx) => {
              const rank = p.final_rank || p.rank || (idx + 1);
              const pScore = p.final_score ?? p.score ?? 0;
              const pXp = p.xp_earned ?? (Math.floor(pScore / 10) + 50);
              const isMe = p.id === participantId || p.nickname === nickname;

              return (
                <div
                  key={p.id || idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-neon-cyan/15 border-neon-cyan shadow-glow-cyan/20'
                      : 'glass-panel border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading font-black text-sm ${
                      rank === 1 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' :
                      rank === 2 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40' :
                      rank === 3 ? 'bg-amber-700/20 text-amber-400 border border-amber-700/40' :
                      'bg-surface text-slate-400 border border-white/5'
                    }`}>
                      #{rank}
                    </span>
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.nickname}`}
                      alt={p.nickname}
                      className="w-9 h-9 rounded-lg bg-surface border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{p.nickname}</span>
                        {isMe && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-neon-purple">+{pXp} XP</span>
                    </div>
                  </div>

                  <span className="text-lg font-mono font-black text-neon-cyan">
                    {pScore} PTS
                  </span>
                </div>
              );
            })}
          </div>
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
