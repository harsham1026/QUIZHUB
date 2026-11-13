import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Compass, Layers, Filter, Play, Edit3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const ExplorePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quizzes', {
        params: { search, category, difficulty, limit: 24 },
      });
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [category, difficulty]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQuizzes();
  };

  const categories = ['All', 'Technology', 'Science', 'General Knowledge', 'Gaming & Esports', 'History'];
  const difficulties = ['All', 'easy', 'medium', 'hard'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="blue">Public Trivia Vault</Badge>
        <h1 className="text-4xl sm:text-5xl font-black font-heading text-white">
          EXPLORE QUIZZES
        </h1>
        <p className="text-slate-400 text-sm">
          Browse verified trivia challenges across science, cyber systems, and competitive esports.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 border-white/10 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trivia by title or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan"
            />
          </div>
          <NeonButton variant="cyan" size="md" type="submit">
            Search
          </NeonButton>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-2 font-mono">CATEGORY:</span>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  category === c
                    ? 'bg-neon-blue text-slate-950 font-bold'
                    : 'bg-surface text-slate-400 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-2 font-mono">DIFFICULTY:</span>
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                  difficulty === d
                    ? 'bg-neon-purple text-white font-bold'
                    : 'bg-surface text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Searching trivia archive...</div>
      ) : quizzes.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Matching Quizzes Found</h3>
          <p className="text-slate-400 text-sm mt-1">Try clearing your filters or search keywords.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((q) => (
            <GlassCard key={q.id} hoverEffect className="flex flex-col justify-between overflow-hidden p-5 group">
              <div>
                <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-surfaceLight">
                  <img
                    src={q.cover_image || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'}
                    alt={q.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant={q.difficulty === 'hard' ? 'pink' : q.difficulty === 'easy' ? 'emerald' : 'amber'}>
                      {q.difficulty}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white font-mono">
                      {q.category}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold font-heading text-white line-clamp-1">{q.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{q.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-neon-blue" /> {q.time_limit_per_question}s / Q
                </span>
                <div className="flex items-center gap-2">
                  {user?.id === q.creator_id && (
                    <NeonButton
                      variant="outline"
                      size="sm"
                      icon={Edit3}
                      onClick={() => navigate(`/create-quiz?edit=${q.id}`)}
                      className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10"
                    >
                      Edit
                    </NeonButton>
                  )}
                  <NeonButton
                    variant="primary"
                    size="sm"
                    icon={Play}
                    onClick={() => navigate(`/practice/${q.id}`)}
                  >
                    Play Solo
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;

