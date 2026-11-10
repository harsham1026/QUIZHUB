import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, LogIn, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'teacher') navigate('/teacher');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 border-neon-blue/30 shadow-glow-blue relative">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center mx-auto mb-3 shadow-glow-blue">
              <Zap className="w-6 h-6 text-neon-blue" />
            </div>
            <h2 className="text-3xl font-black font-heading text-white">WELCOME BACK</h2>
            <p className="text-slate-400 text-sm mt-1">Enter your credentials to enter the arena</p>
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@quizhub.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-neon-cyan hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-surface border-white/20 text-neon-blue focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="remember_me" className="ml-2 text-xs text-slate-400 select-none cursor-pointer">
                Remember this device
              </label>
            </div>

            <NeonButton
              variant="primary"
              size="lg"
              type="submit"
              loading={loading}
              icon={LogIn}
              className="w-full mt-2"
            >
              Sign In
            </NeonButton>
          </form>

          {/* Quick Demo Switcher for Evaluation */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-semibold">
              Quick Test Accounts:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('student@quizhub.com', 'Student@123456')}
                className="px-2 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-semibold hover:bg-neon-blue/20"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('teacher@quizhub.com', 'Teacher@123456')}
                className="px-2 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-xs font-semibold hover:bg-neon-purple/20"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@quizhub.com', 'Admin@123456')}
                className="px-2 py-1.5 rounded-lg bg-neon-pink/10 border border-neon-pink/20 text-neon-pink text-xs font-semibold hover:bg-neon-pink/20"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon-cyan font-bold hover:underline">
              Register now
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default LoginPage;

