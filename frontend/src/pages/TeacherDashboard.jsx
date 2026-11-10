import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  Edit,
  Trash2,
  Copy,
  BookOpen,
  Users,
  Sparkles,
  Trophy,
  CheckCircle,
  Eye,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launchingId, setLaunchingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchMyQuizzes = async () => {
    try {
      const res = await api.get('/quizzes/my');
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error('Failed to load teacher quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyQuizzes();
  }, []);

  const handleStartCompetition = async (quizId) => {
    setLaunchingId(quizId);
    try {
      const res = await api.post('/sessions/create', {
        quiz_id: quizId,
        session_type: 'live_multiplayer',
      });
      const pin = res.data.pin;
      navigate(`/host?pin=${pin}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start live competition');
    } finally {
      setLaunchingId(null);
    }
  };

  const handleDuplicate = async (quizId) => {
    try {
      await api.post(`/quizzes/${quizId}/duplicate`);
      setMessage('Quiz duplicated successfully!');
      fetchMyQuizzes();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to duplicate quiz');
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      setMessage('Quiz deleted successfully');
      fetchMyQuizzes();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to delete quiz');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
      {/* Top Banner */}
      <GlassCard className="p-8 border-neon-purple/30 shadow-glow-purple flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black font-heading text-white">TEACHER & HOST STUDIO</h1>
            <Badge variant="purple">Educator Edition</Badge>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Author quizzes, launch live student competitions, and inspect performance analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NeonButton
            variant="cyan"
            size="md"
            icon={Sparkles}
            onClick={() => navigate('/create-quiz?mode=ai')}
          >
            AI Quiz Generator
          </NeonButton>
          <NeonButton
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/create-quiz')}
          >
            Create New Quiz
          </NeonButton>
        </div>
      </GlassCard>

      {message && (
        <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Quizzes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-neon-blue" /> YOUR QUIZ ARSENAL ({quizzes.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading your quizzes...</div>
        ) : quizzes.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Quizzes Created Yet</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">Create your first quiz or use the AI generator to draft one instantly.</p>
            <NeonButton variant="primary" size="md" icon={Plus} onClick={() => navigate('/create-quiz')}>
              Create Your First Quiz
            </NeonButton>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <GlassCard key={quiz.id} className="flex flex-col justify-between p-5 border-white/10 group hover:border-neon-blue/30 transition-all">
                <div>
                  <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-surfaceLight">
                    <img
                      src={quiz.cover_image || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'}
                      alt={quiz.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                      <Badge variant={quiz.is_published ? 'emerald' : 'amber'}>
                        {quiz.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white font-mono">
                        {quiz.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-heading text-white line-clamp-1">{quiz.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{quiz.description}</p>

                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-neon-blue" /> {quiz.total_questions} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neon-cyan" /> {quiz.time_limit_per_question}s / Q
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <NeonButton
                    variant="cyan"
                    size="md"
                    className="w-full"
                    icon={Play}
                    loading={launchingId === quiz.id}
                    onClick={() => handleStartCompetition(quiz.id)}
                  >
                    Start Live Competition
                  </NeonButton>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/create-quiz?edit=${quiz.id}`)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit Quiz"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(quiz.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-neon-cyan hover:bg-white/5 transition-colors"
                        title="Duplicate Quiz"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-neon-pink hover:bg-white/5 transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <Link
                      to={`/practice/${quiz.id}`}
                      className="text-xs text-slate-400 hover:text-neon-blue flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </Link>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;

