import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Sparkles,
  Save,
  Clock,
  Award,
  Layers,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const QuizCreatorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isAiMode = searchParams.get('mode') === 'ai';

  // Quiz Meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeLimit, setTimeLimit] = useState(30);
  const [coverImage, setCoverImage] = useState('');

  // Questions List
  const [questions, setQuestions] = useState([
    {
      question_text: '',
      question_type: 'multiple_choice',
      time_limit: 30,
      points: 1000,
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ],
    },
  ]);

  // AI Modal
  const [aiModalOpen, setAiModalOpen] = useState(isAiMode);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiConfigured, setAiConfigured] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    api.get('/ai/status')
      .then((res) => setAiConfigured(Boolean(res.data?.configured)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (editId) {
      const loadQuiz = async () => {
        try {
          const res = await api.get(`/quizzes/${editId}`);
          const q = res.data.quiz;
          setTitle(q.title);
          setDescription(q.description || '');
          setCategory(q.category);
          setDifficulty(q.difficulty);
          setTimeLimit(q.time_limit_per_question);
          setCoverImage(q.cover_image || '');
          if (q.questions && q.questions.length > 0) {
            setQuestions(q.questions);
          }
        } catch (err) {
          console.error('Failed to load quiz for edit:', err);
        }
      };
      loadQuiz();
    }
  }, [editId]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        time_limit: timeLimit,
        points: 1000,
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
        ],
      },
    ]);
  };

  const removeQuestion = (qIndex) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTextChange = (qIndex, text) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === qIndex ? { ...q, question_text: text } : q))
    );
  };

  const handleOptionChange = (qIndex, optIndex, field, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOptions = q.options.map((opt, oIdx) => {
          if (field === 'is_correct' && q.question_type !== 'multi_select') {
            return { ...opt, is_correct: oIdx === optIndex };
          }
          return oIdx === optIndex ? { ...opt, [field]: value } : opt;
        });
        return { ...q, options: newOptions };
      })
    );
  };

  const handleTypeChange = (qIndex, newType) => {
    const updated = [...questions];
    const q = updated[qIndex];
    q.question_type = newType;
    if (newType === 'true_false') {
      q.options = [
        { option_text: 'True', is_correct: true },
        { option_text: 'False', is_correct: false },
      ];
    } else if (q.options.length < 4) {
      q.options = [
        { option_text: 'Option A', is_correct: true },
        { option_text: 'Option B', is_correct: false },
        { option_text: 'Option C', is_correct: false },
        { option_text: 'Option D', is_correct: false },
      ];
    }
    setQuestions(updated);
  };

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post('/ai/generate', {
        topic: aiTopic,
        category,
        difficulty,
        num_questions: aiCount,
      });

      if (res.data.questions && res.data.questions.length > 0) {
        setTitle(aiTopic.toUpperCase() + ' CHAMPIONSHIP');
        setDescription(`AI-generated competitive trivia on ${aiTopic}. Test your knowledge and reflexes!`);
        setQuestions(res.data.questions);
        setAiModalOpen(false);
        setStatusMessage(`Successfully generated ${res.data.questions.length} questions with AI!`);
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI generation failed. Please configure GEMINI_API_KEY.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!title.trim()) {
      setErrorMessage('Please provide a quiz title');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setErrorMessage(`Question #${i + 1} has empty text`);
        return;
      }
      const hasCorrect = q.options.some((opt) => opt.is_correct);
      if (!hasCorrect) {
        setErrorMessage(`Question #${i + 1} must have at least one correct answer`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        difficulty,
        time_limit_per_question: Number(timeLimit),
        cover_image: coverImage || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80',
        is_published: true,
        is_public: true,
        questions,
      };

      if (editId) {
        await api.put(`/quizzes/${editId}`, payload);
      } else {
        await api.post('/quizzes', payload);
      }

      navigate('/teacher');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher')}
            className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black font-heading text-white">
              {editId ? 'EDIT QUIZ' : 'QUIZ BUILDER'}
            </h1>
            <p className="text-xs text-slate-400">Design competitive questions, point weights, and timers</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NeonButton
            variant="cyan"
            size="md"
            icon={Sparkles}
            onClick={() => setAiModalOpen(true)}
          >
            Generate with AI
          </NeonButton>
          <NeonButton
            variant="primary"
            size="md"
            icon={Save}
            loading={saving}
            onClick={handleSaveQuiz}
          >
            Publish Quiz
          </NeonButton>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Basic Settings Form */}
      <GlassCard className="p-6 border-white/10">
        <h2 className="text-lg font-bold font-heading text-white mb-4">QUIZ CONFIGURATION</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Quiz Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quantum Computing & Cybernetics"
              className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-neon-blue"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the quiz themes and rules..."
              className="w-full px-4 py-2 bg-surface rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue"
            >
              <option value="Technology">Technology & Coding</option>
              <option value="Science">Science & Quantum</option>
              <option value="General Knowledge">General Knowledge</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Gaming & Esports">Gaming & Esports</option>
              <option value="History">World History</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white text-sm focus:outline-none focus:border-neon-blue"
            >
              <option value="easy">Easy (Recruit)</option>
              <option value="medium">Medium (Gladiator)</option>
              <option value="hard">Hard (Apex Legend)</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Questions Stack */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-neon-cyan" /> QUESTIONS ({questions.length})
          </h2>
          <NeonButton variant="outline" size="sm" icon={Plus} onClick={addQuestion}>
            Add Question
          </NeonButton>
        </div>

        {questions.map((q, qIndex) => (
          <GlassCard key={qIndex} className="p-6 border-white/10 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-bold font-heading text-neon-blue">
                QUESTION #{qIndex + 1}
              </span>
              <div className="flex items-center gap-3">
                <select
                  value={q.question_type}
                  onChange={(e) => handleTypeChange(qIndex, e.target.value)}
                  className="px-3 py-1 bg-surface rounded-lg border border-white/10 text-xs text-slate-200"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="multi_select">Multi-Select</option>
                </select>

                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-neon-blue" />
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={q.time_limit}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIndex].time_limit = Number(e.target.value);
                      setQuestions(updated);
                    }}
                    className="w-14 px-2 py-0.5 bg-surface rounded border border-white/10 text-center text-xs"
                  />
                  <span>s</span>
                </div>

                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="p-1.5 text-slate-400 hover:text-neon-pink rounded-lg hover:bg-white/5"
                    title="Remove Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Question Text */}
            <input
              type="text"
              value={q.question_text}
              onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
              placeholder="Enter your question statement..."
              className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-neon-cyan"
            />

            {/* Options list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {q.options.map((opt, optIndex) => (
                <div
                  key={optIndex}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                    opt.is_correct
                      ? 'bg-neon-emerald/10 border-neon-emerald/40'
                      : 'bg-surface border-white/10'
                  }`}
                >
                  <input
                    type={q.question_type === 'multi_select' ? 'checkbox' : 'radio'}
                    name={`correct_${qIndex}`}
                    checked={opt.is_correct}
                    onChange={(e) =>
                      handleOptionChange(
                        qIndex,
                        optIndex,
                        'is_correct',
                        q.question_type === 'multi_select' ? e.target.checked : true
                      )
                    }
                    className="w-4 h-4 text-neon-emerald cursor-pointer"
                  />
                  <input
                    type="text"
                    value={opt.option_text}
                    onChange={(e) =>
                      handleOptionChange(qIndex, optIndex, 'option_text', e.target.value)
                    }
                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        ))}

        <div className="pt-2 flex justify-center">
          <NeonButton variant="outline" size="md" icon={Plus} onClick={addQuestion}>
            Add Another Question
          </NeonButton>
        </div>
      </div>

      {/* AI Generator Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-neon-cyan/40 shadow-glow-cyan relative">
            <h3 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-neon-cyan" /> AI Quiz Generator
            </h3>
            <p className="text-slate-400 text-xs mt-1 mb-6">
              Enter any topic and Gemini AI will synthesize complete competitive questions with correct answers.
            </p>

            {!aiConfigured && !aiError && (
              <div className="mb-4 p-3 rounded-xl bg-neon-amber/10 border border-neon-amber/30 text-neon-amber text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>GEMINI_API_KEY is not set in Vercel Environment Variables yet.</span>
              </div>
            )}

            {aiError && (
              <div className="mb-4 p-3 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateAI} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quiz Topic or Subject
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Black Holes & Astrophysics"
                  className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/20 text-white text-sm focus:outline-none focus:border-neon-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="2"
                  max="15"
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-surface rounded-xl border border-white/20 text-white text-sm focus:outline-none focus:border-neon-cyan"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <NeonButton
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setAiModalOpen(false)}
                >
                  Cancel
                </NeonButton>
                <NeonButton
                  variant="cyan"
                  size="md"
                  className="flex-1"
                  type="submit"
                  loading={aiLoading}
                  icon={Sparkles}
                >
                  Generate
                </NeonButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCreatorPage;

