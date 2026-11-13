import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  Award,
  ArrowLeft,
  Flame,
  Send,
  Download,
  FileText,
  Target,
  Trophy,
  Sparkles,
  Compass
} from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const PracticePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const res = await api.get(`/quizzes/${id}/practice`);
        setQuiz(res.data.quiz);
      } catch (err) {
        console.error('Failed to load practice quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPractice();
  }, [id]);

  if (loading) {
    return <div className="text-center py-24 text-slate-400">Loading practice questions...</div>;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-bold text-white">Quiz has no questions yet</h2>
        <NeonButton variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </NeonButton>
      </div>
    );
  }

  const currentQ = quiz.questions[currentIndex];
  const isMulti = currentQ.question_type === 'multi_select';

  const evaluateSelection = (chosenIds) => {
    const correctOpts = currentQ.options.filter((o) => o.is_correct);
    const correctIds = correctOpts.map((o) => o.id);
    const isExactMatch =
      chosenIds.length === correctIds.length &&
      chosenIds.every((cid) => correctIds.includes(cid));

    setIsAnswered(true);
    if (isExactMatch) {
      setScore((prev) => prev + currentQ.points);
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setQuestionHistory((prev) => [
      ...prev,
      {
        question_index: currentIndex + 1,
        question_text: currentQ.question_text,
        chosen_options: currentQ.options.filter((o) => chosenIds.includes(o.id)),
        correct_options: correctOpts,
        is_correct: isExactMatch,
        points: isExactMatch ? currentQ.points : 0,
        options: currentQ.options,
      },
    ]);
  };

  const handleSelectOption = (opt) => {
    if (isAnswered) return;
    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(opt.id) ? prev.filter((oid) => oid !== opt.id) : [...prev, opt.id]
      );
    } else {
      const next = [opt.id];
      setSelectedIds(next);
      evaluateSelection(next);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIds([]);
      setIsAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedIds([]);
    setIsAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setFinished(false);
    setQuestionHistory([]);
  };

  const downloadPracticeReport = () => {
    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
    const dateStr = new Date().toLocaleString();

    let csv = '==================================================\n';
    csv += 'QUIZHUB PERFORMANCE & ACCURACY REPORT\n';
    csv += '==================================================\n';
    csv += `Quiz Title,"${quiz.title.replace(/"/g, '""')}"\n`;
    csv += `Category,"${quiz.category}"\n`;
    csv += `Difficulty,"${quiz.difficulty}"\n`;
    csv += `Completed At,"${dateStr}"\n`;
    csv += `Final Score,${score} PTS\n`;
    csv += `Accuracy,${accuracy}%\n`;
    csv += `Correct Answers,${correctCount} / ${quiz.questions.length}\n`;
    csv += `Estimated XP Earned,+${Math.floor(score / 10) + 50} XP\n\n`;

    csv += 'QUESTION BREAKDOWN\n';
    csv += 'Question #,Question Text,Your Answer,Correct Answer,Status,Points Awarded\n';
    questionHistory.forEach((item) => {
      const qText = `"${(item.question_text || '').replace(/"/g, '""')}"`;
      const yourAns = `"${(item.chosen_options.map((o) => o.option_text).join('; ') || 'No Selection').replace(/"/g, '""')}"`;
      const correctAns = `"${(item.correct_options.map((o) => o.option_text).join('; ') || '').replace(/"/g, '""')}"`;
      const status = item.is_correct ? 'CORRECT' : 'INCORRECT';
      csv += `${item.question_index},${qText},${yourAns},${correctAns},${status},${item.points}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `QuizHub_Report_${safeTitle}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (finished) {
    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 relative z-10 space-y-8">
        {/* Top Summary Card */}
        <GlassCard className="p-8 border-neon-cyan/40 shadow-glow-cyan text-center relative overflow-hidden">
          <div className="inline-flex p-3 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan mb-3">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
          <span className="text-xs font-mono text-neon-cyan uppercase tracking-widest block font-bold">
            PRACTICE SESSION COMPLETE
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white mt-1">
            {quiz.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Here are your detailed performance results and question review.
          </p>

          {/* 4 Performance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 font-mono">
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-sans">Final Score</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-cyan mt-1 block">
                {score}
              </span>
              <span className="text-[10px] text-slate-400">PTS</span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-sans">Accuracy</span>
              <span className={`text-2xl sm:text-3xl font-black mt-1 block ${accuracy >= 70 ? 'text-neon-emerald' : 'text-neon-pink'}`}>
                {accuracy}%
              </span>
              <span className="text-[10px] text-slate-400">{correctCount}/{quiz.questions.length} Correct</span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-sans">Win Streak</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-amber mt-1 block flex items-center justify-center gap-1">
                {streak} <Flame className="w-5 h-5 fill-current" />
              </span>
              <span className="text-[10px] text-slate-400">Streak Combo</span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-sans">XP Earned</span>
              <span className="text-2xl sm:text-3xl font-black text-neon-purple mt-1 block">
                +{Math.round(score / 10 + 50)}
              </span>
              <span className="text-[10px] text-slate-400">XP Points</span>
            </div>
          </div>

          {/* Action Row with Download Report */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-white/10">
            <NeonButton
              variant="primary"
              size="md"
              icon={Download}
              onClick={downloadPracticeReport}
              className="shadow-glow-cyan"
            >
              Download Report (.CSV)
            </NeonButton>
            <NeonButton
              variant="outline"
              size="md"
              icon={RotateCcw}
              onClick={handleRestart}
            >
              Retry Practice
            </NeonButton>
            <NeonButton
              variant="outline"
              size="md"
              icon={Compass}
              onClick={() => navigate('/explore')}
            >
              Explore More Quizzes
            </NeonButton>
          </div>
        </GlassCard>

        {/* Question-By-Question Detailed Results Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-neon-cyan" />
                QUESTION-BY-QUESTION RESULTS REVIEW
              </h2>
              <p className="text-xs text-slate-400">Review your choices and check correct answers below</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-surface border border-white/10 text-slate-300">
              {correctCount} / {quiz.questions.length} Correct
            </span>
          </div>

          <div className="space-y-3">
            {questionHistory.map((item, idx) => (
              <GlassCard
                key={idx}
                className={`p-5 border transition-all ${
                  item.is_correct ? 'border-neon-emerald/30 bg-neon-emerald/5' : 'border-neon-pink/30 bg-neon-pink/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-surface border border-white/10 text-xs font-mono font-bold flex items-center justify-center text-white">
                      Q{item.question_index}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {item.question_text}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0 ${
                      item.is_correct
                        ? 'bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/40'
                        : 'bg-neon-pink/20 text-neon-pink border border-neon-pink/40'
                    }`}
                  >
                    {item.is_correct ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> +{item.points} PTS
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> 0 PTS
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                  {item.options.map((opt) => {
                    const isChosen = item.chosen_options.some((o) => o.id === opt.id);
                    const isCorrect = opt.is_correct;

                    let optBg = 'bg-surface/50 border-white/5 text-slate-400';
                    if (isCorrect) {
                      optBg = 'bg-neon-emerald/20 border-neon-emerald/60 text-neon-emerald font-semibold';
                    } else if (isChosen && !isCorrect) {
                      optBg = 'bg-neon-pink/20 border-neon-pink/60 text-neon-pink line-through';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optBg}`}
                      >
                        <span className="truncate pr-2">{opt.option_text}</span>
                        {isCorrect && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neon-emerald/20 border border-neon-emerald/40 uppercase">
                            Correct
                          </span>
                        )}
                        {isChosen && !isCorrect && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neon-pink/20 border border-neon-pink/40 uppercase">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 relative z-10 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-surface border border-white/10 text-xs font-mono font-bold text-neon-cyan">
            Question {currentIndex + 1} / {quiz.questions.length}
          </span>
          {isMulti && (
            <span className="px-2.5 py-1 rounded-lg bg-neon-purple/20 border border-neon-purple/40 text-[11px] font-mono font-bold text-neon-purple">
              MULTI-SELECT
            </span>
          )}
          {streak > 1 && (
            <span className="flex items-center gap-1 text-xs text-neon-pink font-bold font-mono">
              <Flame className="w-4 h-4 fill-current" /> {streak} Streak
            </span>
          )}
        </div>
      </div>

      <GlassCard className="p-8 border-neon-blue/30 shadow-glow-blue">
        <h2 className="text-2xl font-bold font-heading text-white text-center py-4">
          {currentQ.question_text}
        </h2>

        <div className="grid grid-cols-1 gap-3 mt-6">
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedIds.includes(opt.id);
            let btnStyle = isSelected
              ? 'bg-neon-blue/20 border-neon-blue text-white'
              : 'bg-surface hover:bg-surfaceLight border-white/10 text-white';

            if (isAnswered) {
              if (opt.is_correct) {
                btnStyle = 'bg-neon-emerald/20 border-neon-emerald text-neon-emerald';
              } else if (isSelected && !opt.is_correct) {
                btnStyle = 'bg-neon-pink/20 border-neon-pink text-neon-pink';
              } else {
                btnStyle = 'opacity-40 border-white/5';
              }
            }

            return (
              <button
                key={opt.id || i}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt)}
                className={`p-4 rounded-xl border-2 font-medium text-left flex items-center justify-between transition-all ${btnStyle}`}
              >
                <span>{opt.option_text}</span>
                {isAnswered && opt.is_correct && <CheckCircle className="w-5 h-5 text-neon-emerald" />}
                {isAnswered && isSelected && !opt.is_correct && <XCircle className="w-5 h-5 text-neon-pink" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {isMulti && !isAnswered && (
            <NeonButton
              variant="primary"
              size="md"
              icon={Send}
              disabled={selectedIds.length === 0}
              onClick={() => evaluateSelection(selectedIds)}
            >
              Check Answer
            </NeonButton>
          )}
          {isAnswered && (
            <NeonButton variant="cyan" size="md" icon={ArrowRight} onClick={handleNext}>
              {currentIndex + 1 < quiz.questions.length ? 'Next Question' : 'View Results'}
            </NeonButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default PracticePage;
