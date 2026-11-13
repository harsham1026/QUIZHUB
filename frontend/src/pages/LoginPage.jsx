import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';

export const LoginPage = () => {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const [googleClientId, setGoogleClientId] = useState('');
  const [gisLoaded, setGisLoaded] = useState(false);
  const [configChecked, setConfigChecked] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Load Google Identity Services SDK and retrieve Client ID
  useEffect(() => {
    let isMounted = true;

    const fetchConfig = async () => {
      try {
        const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (envClientId) {
          if (isMounted) setGoogleClientId(envClientId);
        } else {
          const res = await api.get('/auth/config');
          if (isMounted && res.data?.google_client_id) {
            setGoogleClientId(res.data.google_client_id);
          }
        }
      } catch (err) {
        console.warn('Could not fetch auth config:', err);
      } finally {
        if (isMounted) setConfigChecked(true);
      }
    };

    fetchConfig();

    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) setGisLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services SDK');
      };
      document.body.appendChild(script);
    } else {
      setGisLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setEmailLoading(true);
    try {
      await login(cleanEmail, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Email login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleContinueWithGoogle = () => {
    setError('');

    if (!googleClientId) {
      setError('Google Sign-In is not configured yet on this server. Please use Email & Password below.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError('Google Sign-In SDK is still initializing. Please wait a moment and try again.');
      return;
    }

    setGoogleLoading(true);

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            if (tokenResponse.error !== 'popup_closed_by_user') {
              setError(`Google Sign-In failed: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            setGoogleLoading(false);
            return;
          }

          try {
            await loginWithGoogle({ access_token: tokenResponse.access_token });
            navigate('/dashboard', { replace: true });
          } catch (err) {
            console.error('Google Auth backend error:', err);
            setError(err.response?.data?.message || 'Authentication failed. Please try again.');
          } finally {
            setGoogleLoading(false);
          }
        },
        error_callback: () => {
          setError('Google popup was closed or blocked. Please allow popups for this site.');
          setGoogleLoading(false);
        },
      });

      client.requestAccessToken();
    } catch (err) {
      console.error('Failed to launch Google auth client:', err);
      setError('Unable to open Google sign-in window. Please check your browser settings.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 sm:p-10 border-neon-cyan/40 shadow-glow-cyan relative overflow-hidden rounded-2xl">
          {/* Subtle neon gradient ambient background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-cyan/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-neon-blue/15 rounded-full blur-3xl pointer-events-none" />

          {/* QuizHub Branding & Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center mx-auto mb-3 shadow-glow-cyan">
              <Zap className="w-7 h-7 text-neon-cyan animate-pulse" />
            </div>
            <h1 className="text-3xl font-black font-heading tracking-wide text-white uppercase">
              WELCOME TO <span className="text-neon-cyan">QUIZHUB</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto leading-relaxed">
              Your ultimate destination for online quiz competitions.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-3.5 rounded-xl bg-neon-pink/15 border border-neon-pink/40 flex items-start gap-2.5 text-xs text-neon-pink"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* 1. Google Sign-In Button */}
          <div className="relative z-10">
            <button
              type="button"
              onClick={handleContinueWithGoogle}
              disabled={googleLoading || emailLoading || (configChecked && !googleClientId)}
              className={`w-full relative group overflow-hidden flex items-center justify-center gap-3 py-3 px-5 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all duration-200 active:scale-[0.98] border ${
                configChecked && !googleClientId
                  ? 'bg-white/10 text-slate-400 border-white/10 cursor-not-allowed opacity-75'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-white/20 hover:shadow-glow-cyan'
              }`}
              title={!googleClientId ? 'Google OAuth is not configured on this server' : 'Sign in with your Google account'}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google G Logo SVG */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="font-heading">Continue with Google</span>
                </>
              )}
            </button>

            {configChecked && !googleClientId && (
              <p className="text-[11px] text-slate-500 text-center mt-1.5">
                (Google OAuth not configured — use Email & Password below)
              </p>
            )}
          </div>

          {/* Divider: OR */}
          <div className="relative my-6 text-center z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-4 text-xs uppercase font-mono tracking-widest text-slate-400 bg-surface">
              OR
            </span>
          </div>

          {/* 2. Email & Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4 relative z-10">
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
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-neon-cyan hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <NeonButton
              variant="cyan"
              size="lg"
              type="submit"
              loading={emailLoading}
              disabled={googleLoading}
              icon={LogIn}
              className="w-full mt-2"
            >
              Sign In
            </NeonButton>
          </form>

          {/* Navigation to Register */}
          <div className="mt-6 text-center text-xs text-slate-400 relative z-10">
            Don't have an account?{' '}
            <Link to="/register" className="text-neon-cyan font-bold hover:underline">
              Register now
            </Link>
          </div>

          {/* Terms and Privacy policy note */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center relative z-10">
            <p className="text-xs text-slate-500 leading-relaxed">
              By continuing, you agree to our{' '}
              <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                Privacy Policy
              </span>
              .
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default LoginPage;
