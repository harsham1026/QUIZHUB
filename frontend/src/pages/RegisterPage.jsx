import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, User, GraduationCap, School, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student'); // student | teacher
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: fullName,
        email,
        password,
        role,
        ...(role === 'teacher' && {
          school_or_organization: school,
          subject_specialization: subject,
        }),
      };
      const user = await register(payload);
      if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <GlassCard className="p-8 border-neon-cyan/30 shadow-glow-cyan relative">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center mx-auto mb-3 shadow-glow-cyan">
              <Zap className="w-6 h-6 text-neon-cyan" />
            </div>
            <h2 className="text-3xl font-black font-heading text-white">CREATE ACCOUNT</h2>
            <p className="text-slate-400 text-sm mt-1">Join the competitive online quiz arena</p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface rounded-xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'student'
                  ? 'bg-neon-blue text-slate-950 shadow-glow-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student Player
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'teacher'
                  ? 'bg-neon-purple text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <School className="w-4 h-4" /> Teacher / Host
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-neon-pink/10 border border-neon-pink/30 flex items-center gap-2.5 text-xs text-neon-pink">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                />
              </div>
            </div>

            {role === 'teacher' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Institution
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="e.g. Stanford University"
                    className="w-full px-3 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-neon-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject Field
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics / Tech"
                    className="w-full px-3 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-neon-purple"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                  />
                </div>
              </div>
            </div>

            <NeonButton
              variant={role === 'teacher' ? 'secondary' : 'cyan'}
              size="lg"
              type="submit"
              loading={loading}
              className="w-full mt-4"
            >
              Complete Registration
            </NeonButton>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-neon-cyan font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

