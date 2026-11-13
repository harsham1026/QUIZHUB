import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Info, KeyRound } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';

export const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Request Reset State
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [smtpConfigured, setSmtpConfigured] = useState(true);

  // Set New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitMessage(res.data?.message || 'If an account exists for this email, password reset instructions have been sent.');
      setSmtpConfigured(res.data?.smtp_configured ?? true);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setResetSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
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
        <GlassCard className="p-8 sm:p-10 border-neon-cyan/40 shadow-glow-cyan relative overflow-hidden rounded-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center mx-auto mb-3 shadow-glow-cyan">
              {token ? <KeyRound className="w-7 h-7 text-neon-cyan" /> : <Zap className="w-7 h-7 text-neon-cyan" />}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-white uppercase tracking-wide">
              {token ? 'SET NEW PASSWORD' : 'RECOVER ACCESS'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
              {token
                ? 'Create a new secure password for your QuizHub account'
                : 'Enter your email address to receive password reset instructions'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-neon-pink/15 border border-neon-pink/40 flex items-start gap-2.5 text-xs text-neon-pink">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE 1: Token present in URL -> Complete Password Reset */}
          {token ? (
            resetSuccess ? (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-xl bg-neon-cyan/15 border border-neon-cyan/40 text-neon-cyan text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Password updated successfully! You can now log in.</span>
                </div>
                <Link to="/login" className="inline-flex items-center text-xs font-bold text-neon-cyan hover:underline mt-4">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Proceed to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-11 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-10 pr-11 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan"
                    />
                  </div>
                </div>

                <NeonButton
                  variant="cyan"
                  size="lg"
                  type="submit"
                  loading={loading}
                  className="w-full mt-2"
                >
                  Update Password
                </NeonButton>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-xs text-slate-400 hover:text-white inline-flex items-center">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )
          ) : (
            /* MODE 2: No token -> Request Reset Link */
            submitted ? (
              <div className="text-center space-y-4">
                <div className={`p-4 rounded-xl border text-xs sm:text-sm text-left flex items-start gap-2.5 ${
                  smtpConfigured
                    ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                }`}>
                  {smtpConfigured ? (
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                  )}
                  <span className="leading-relaxed">{submitMessage}</span>
                </div>
                <div className="pt-2">
                  <Link to="/login" className="inline-flex items-center text-xs font-bold text-neon-cyan hover:underline">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
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
                      placeholder="player@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan"
                    />
                  </div>
                </div>

                <NeonButton
                  variant="cyan"
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
            )
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
