import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
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
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center mx-auto mb-3 shadow-glow-blue">
              <Zap className="w-6 h-6 text-neon-blue" />
            </div>
            <h2 className="text-3xl font-black font-heading text-white">RECOVER ACCESS</h2>
            <p className="text-slate-400 text-sm mt-1">Enter your account email to receive reset instructions</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-neon-pink/10 border border-neon-pink/30 flex items-center gap-2 text-xs text-neon-pink">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Reset link sent! If this email exists in our records, instructions have been delivered.</span>
              </div>
              <Link to="/login" className="inline-flex items-center text-xs font-bold text-neon-cyan hover:underline mt-4">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@quizhub.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <NeonButton
                variant="primary"
                size="lg"
                type="submit"
                loading={loading}
                className="w-full mt-2"
              >
                Send Reset Link
              </NeonButton>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white inline-flex items-center">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;

