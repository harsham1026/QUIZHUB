import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  Award,
  Zap,
  ArrowLeft,
  Flame
} from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';

export const PracticePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);

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

  const handleSelectOption = (opt) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    if (opt.is_correct) {
      setScore((prev) => prev + currentQ.points);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center relative z-10">
        <GlassCard className="p-8 border-neon-cyan/40 shadow-glow-cyan space-y-6">
          <Award className="w-16 h-16 text-neon-cyan mx-auto" />
          <h2 className="text-3xl font-black font-heading text-white">PRACTICE COMPLETE!</h2>
          <div className="p-4 rounded-xl bg-surface border border-white/10 space-y-2">
            <p className="text-sm text-slate-400 font-mono">Final Practice Score</p>
            <p className="text-4xl font-black font-mono text-neon-cyan">{score} PTS</p>
          </div>
          <div className="flex gap-3">
            <NeonButton variant="outline" size="md" icon={RotateCcw} onClick={handleRestart} className="flex-1">
              Retry
            </NeonButton>
            <NeonButton variant="cyan" size="md" onClick={() => navigate('/student')} className="flex-1">
              Dashboard
            </NeonButton>
          </div>
        </GlassCard>
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
            const isSelected = selectedOption?.id === opt.id;
            let btnStyle = 'bg-surface hover:bg-surfaceLight border-white/10 text-white';

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

        {isAnswered && (
          <div className="mt-6 flex justify-end">
            <NeonButton variant="cyan" size="md" icon={ArrowRight} onClick={handleNext}>
              {currentIndex + 1 < quiz.questions.length ? 'Next Question' : 'View Results'}
            </NeonButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default PracticePage;

