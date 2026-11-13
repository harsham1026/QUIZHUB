import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Play,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Flame,
  Copy,
  AlertCircle,
  Edit3,
  Download,
  Trophy,
  FileText
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
  const searchQuizId = searchParams.get('quiz_id');
  const [copied, setCopied] = useState(false);

  const {
    initHost,
    startGame,
    nextQuestion,
    participants,
    gameStatus,
    currentQuestion,
    leaderboard,
    finalPodium,
    fullStandings,
    answersCount,
    errorMessage,
    quizId,
    quizTitle,
    totalQuestions,
  } = useGame();

  const activeQuizId = quizId || searchQuizId;

  useEffect(() => {
    if (pin) {
      initHost(pin);
    }
  }, [pin, initHost]);

  const handleCopyLink = () => {
    const joinUrl = `${window.location.origin}/play?pin=${pin}`;
    navigator.clipboard?.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (errorMessage && gameStatus === 'lobby' && participants.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center relative z-10">
        <GlassCard className="p-8 border-neon-pink/40 space-y-4">
          <AlertCircle className="w-12 h-12 text-neon-pink mx-auto" />
          <h2 className="text-2xl font-bold font-heading text-white">Session Unavailable</h2>
          <p className="text-sm text-slate-400">{errorMessage}</p>
          <NeonButton variant="outline" size="md" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </NeonButton>
        </GlassCard>
      </div>
    );
  }

  // LOBBY VIEW
  if (gameStatus === 'lobby') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center relative z-10 space-y-8">
        <GlassCard className="p-10 border-neon-cyan/40 shadow-glow-cyan">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-mono font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Competition Lobby Active
            </div>

            {activeQuizId && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(`/create-quiz?edit=${activeQuizId}`, '_blank')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neon-purple/20 border border-neon-purple/40 text-xs font-bold text-neon-purple hover:bg-neon-purple/30 transition-all shadow-sm"
                  title="Open quiz editor in a new tab so this lobby stays active"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Quiz
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/create-quiz?edit=${activeQuizId}`)}
                  className="text-xs text-slate-400 hover:text-white underline transition-colors px-1"
                >
                  Leave & edit
                </button>
              </div>
            )}
          </div>

          {/* Quiz Title & Info */}
          {quizTitle && (
            <div className="mb-4 text-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">HOSTING QUIZ</span>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-wide mt-0.5">
                {quizTitle}
              </h1>
              {totalQuestions > 0 && (
                <span className="inline-block mt-1 text-xs font-mono text-neon-cyan font-semibold">
                  {totalQuestions} Questions Loaded
                </span>
              )}
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-bold text-slate-300">
            JOIN AT <span className="text-white font-mono">{window.location.host}/play</span> WITH PIN:
          </h2>

          <div className="my-6 inline-block px-10 py-5 rounded-3xl bg-surface border-2 border-neon-cyan shadow-glow-cyan">
            <span className="text-6xl sm:text-8xl font-black font-mono tracking-widest text-neon-cyan">
              {pin}
            </span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-slate-400 text-sm">
              Players can also join by clicking "Enter PIN" in the top navbar.
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-surface border border-white/10 text-xs font-mono text-neon-cyan hover:border-neon-cyan/50 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Join Link Copied!' : 'Copy Direct Join Link'}
            </button>
          </div>

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
    const isLastQuestion =
      currentQuestion && currentQuestion.question_index + 1 >= currentQuestion.total_questions;

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
              {isLastQuestion ? 'Finish & Show Podium' : 'Next Question'}
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

  // GAME COMPLETED (FINAL PODIUM & TOURNAMENT REPORT)
  if (gameStatus === 'completed') {
    const standingsList = (fullStandings && fullStandings.length > 0) ? fullStandings : leaderboard;

    const downloadHostReport = () => {
      const dateStr = new Date().toLocaleString();
      let csv = '==================================================\n';
      csv += 'QUIZHUB HOST TOURNAMENT REPORT\n';
      csv += '==================================================\n';
      csv += `Tournament Title,"${(quizTitle || 'Live Competition').replace(/"/g, '""')}"\n`;
      csv += `Room PIN,${pin}\n`;
      csv += `Completed At,"${dateStr}"\n`;
      csv += `Total Competitors,${standingsList.length}\n`;
      csv += `Total Questions,${totalQuestions || 0}\n\n`;

      csv += 'COMPLETE ROSTER RESULTS\n';
      csv += 'Rank,Participant Nickname,Final Score,Correct Count,Incorrect Count,Avg Speed (s),XP Awarded\n';
      standingsList.forEach((p, idx) => {
        const pRank = p.final_rank || p.rank || (idx + 1);
        const pScore = p.final_score ?? p.score ?? 0;
        const pCorrect = p.correct_count ?? '-';
        const pIncorrect = p.incorrect_count ?? '-';
        const pSpeed = p.average_speed ?? '-';
        const pXp = p.xp_earned ?? (Math.floor(pScore / 10) + 50);
        csv += `${pRank},"${p.nickname}",${pScore},${pCorrect},${pIncorrect},${pSpeed},+${pXp} XP\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuizHub_HostReport_PIN_${pin || 'match'}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 relative z-10 space-y-8">
        {/* Championship Podium */}
        <Podium podium={finalPodium} />

        {/* Host Control & Export Action Card */}
        <GlassCard className="p-8 border-neon-cyan/40 shadow-glow-cyan text-center">
          <div className="inline-flex p-3 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan mb-3">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
          <span className="text-xs font-mono text-neon-cyan uppercase tracking-widest block font-bold">
            HOST TOURNAMENT WRAP-UP
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading text-white mt-1">
            {quizTitle || 'Live Tournament Match'}
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            The match has concluded. You can download the full competitor roster report below or manage the quiz.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-mono">
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">TOTAL PLAYERS</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-cyan mt-1 block">
                {standingsList.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">QUESTIONS</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-purple mt-1 block">
                {totalQuestions || 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">ROOM PIN</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-amber mt-1 block">
                {pin}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-xs text-slate-400 block font-sans">TOP SCORE</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-emerald mt-1 block">
                {standingsList[0]?.final_score ?? standingsList[0]?.score ?? 0}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-white/10">
            <NeonButton
              variant="primary"
              size="md"
              icon={Download}
              onClick={downloadHostReport}
              className="shadow-glow-cyan"
            >
              Download Full Report (.CSV)
            </NeonButton>
            {activeQuizId && (
              <NeonButton
                variant="outline"
                size="md"
                icon={Edit3}
                onClick={() => navigate(`/create-quiz?edit=${activeQuizId}`)}
                className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
              >
                Edit Quiz
              </NeonButton>
            )}
            <NeonButton
              variant="outline"
              size="md"
              icon={CheckCircle}
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </NeonButton>
          </div>
        </GlassCard>

        {/* Complete Competitor Standings Table */}
        <GlassCard className="p-6 border-white/10">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-neon-blue" />
                COMPLETE COMPETITOR SCOREBOARD
              </h3>
              <p className="text-xs text-slate-400">All players, scores, accuracy, and XP awarded</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-surface border border-white/10 text-slate-300">
              {standingsList.length} Gladiators
            </span>
          </div>

          <div className="space-y-2">
            {standingsList.map((p, idx) => {
              const rank = p.final_rank || p.rank || (idx + 1);
              const pScore = p.final_score ?? p.score ?? 0;
              const pXp = p.xp_earned ?? (Math.floor(pScore / 10) + 50);

              return (
                <div
                  key={p.id || idx}
                  className="p-3.5 rounded-xl border glass-panel border-white/5 flex items-center justify-between"
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
                      <span className="font-bold text-white text-sm block">{p.nickname}</span>
                      <span className="text-[11px] font-mono text-neon-purple">+{pXp} XP Awarded</span>
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
      Initializing Game Session...
    </div>
  );
};

export default HostGamePage;
