import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  Trophy,
  Swords,
  Sparkles,
  Shield,
  Play,
  ArrowRight,
  Flame,
  Award,
  Users,
  Compass,
  CheckCircle2,
  Gamepad2
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [pinInput, setPinInput] = useState('');

  const handleJoinPin = (e) => {
    e.preventDefault();
    if (pinInput.trim().length === 6) {
      navigate(`/play?pin=${pinInput.trim()}`);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Esports pill badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-neon-cyan/40 shadow-glow-cyan mb-8"
        >
          <Sparkles className="w-4 h-4 text-neon-cyan animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-neon-cyan font-mono">
            Next-Gen Multiplayer Arena
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black font-heading tracking-tight text-white max-w-5xl leading-[1.05]"
        >
          THE NEXT LEVEL OF <br />
          <span className="gradient-text-electric">QUIZ COMPETITION.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed"
        >
          Think Fast. Play Smart. Win Big. Enter high-stakes live trivia battles with server-authoritative anti-cheat, speed bonuses, and real-time tournament brackets.
        </motion.p>

        {/* Quick Join PIN Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 w-full max-w-md"
        >
          <form
            onSubmit={handleJoinPin}
            className="p-2 rounded-2xl glass-panel border border-neon-blue/30 shadow-glow-blue flex items-center gap-2"
          >
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
              placeholder="ENTER 6-DIGIT PIN"
              className="flex-1 bg-transparent px-4 py-3 text-center text-lg sm:text-xl font-mono tracking-widest font-extrabold uppercase text-white placeholder-slate-500 focus:outline-none"
            />
            <NeonButton
              variant="cyan"
              size="md"
              type="submit"
              icon={Gamepad2}
              disabled={pinInput.trim().length !== 6}
            >
              JOIN
            </NeonButton>
          </form>
        </motion.div>

        {/* CTA Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-4"
        >
          <NeonButton
            variant="primary"
            size="lg"
            icon={Play}
            onClick={() => navigate('/teacher')}
          >
            Create Competition
          </NeonButton>
          <NeonButton
            variant="outline"
            size="lg"
            icon={Compass}
            onClick={() => navigate('/explore')}
          >
            Explore Quizzes
          </NeonButton>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-20">
          {[
            { label: 'Active Gladiators', value: '15,000+', icon: Users, color: 'blue' },
            { label: 'Multiplayer Matches', value: '48,000+', icon: Swords, color: 'purple' },
            { label: 'Real-time Latency', value: '< 45ms', icon: Zap, color: 'cyan' },
            { label: 'Tournament Prize XP', value: '1,000,000+', icon: Trophy, color: 'amber' },
          ].map((stat, i) => (
            <GlassCard key={i} className="text-center p-5">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-neon-cyan" />
              <div className="text-2xl font-bold font-heading text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-mono mt-0.5">{stat.label}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <Badge variant="purple" className="mb-3">Gameplay Loop</Badge>
          <h2 className="text-3xl sm:text-5xl font-black font-heading text-white">HOW QUIZHUB WORKS</h2>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto">Three seamless steps from lobby countdown to victory celebration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Host or Launch',
              desc: 'Select any public trivia deck or author your own questions. Click Start to generate a live 6-digit Game PIN and QR code.',
              badge: 'Teacher / Host',
            },
            {
              step: '02',
              title: 'Join & Compete',
              desc: 'Contenders enter the PIN from any mobile device or desktop. Answer synchronized questions in real-time under authoritative countdown timers.',
              badge: 'Multiplayer Arena',
            },
            {
              step: '03',
              title: 'Climb The Podium',
              desc: 'Scores scale with instant speed bonuses and hot answer streaks. Watch the 3D winner podium reveal champions in a flurry of confetti.',
              badge: 'Victory & XP',
            },
          ].map((item, idx) => (
            <GlassCard key={idx} hoverEffect className="relative overflow-hidden group">
              <div className="text-6xl font-black font-heading text-white/5 absolute top-2 right-4 group-hover:text-neon-blue/10 transition-colors">
                {item.step}
              </div>
              <Badge variant="cyan" className="mb-4">{item.badge}</Badge>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 border-t border-white/[0.08]">
        <div className="text-center mb-16">
          <Badge variant="blue" className="mb-3">Engine Highlights</Badge>
          <h2 className="text-3xl sm:text-5xl font-black font-heading text-white">ENGINEERED FOR VICTORY</h2>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto">Modern technology delivering low-latency competitive gaming.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Server-Authoritative Anti-Cheat',
              desc: 'Correct answers are never leaked to client memory until the countdown ends. Timers and double-submissions are locked down by backend workers.',
              icon: Shield,
            },
            {
              title: 'Dynamic Streak Multipliers',
              desc: 'Maintain consecutive correct responses to unlock streak bonuses up to +250 points, rewarding relentless accuracy and fast fingers.',
              icon: Flame,
            },
            {
              title: 'AI Trivia Generator',
              desc: 'Teachers can generate complete quizzes in seconds on any academic or entertainment topic via integrated Gemini AI models.',
              icon: Sparkles,
            },
            {
              title: 'Championship Tournaments',
              desc: 'Scheduled bracket events with participant caps, registration deadlines, and permanent trophies on student profile records.',
              icon: Trophy,
            },
            {
              title: '1v1 Duels & Friend Challenges',
              desc: 'Challenge classmates to direct head-to-head match-ups and track personal rivalry victory records.',
              icon: Swords,
            },
            {
              title: 'Solo Practice Mode',
              desc: 'Self-paced training with instant answer explanations to polish your reflexes before stepping into live multiplayer rooms.',
              icon: Award,
            },
          ].map((feat, idx) => (
            <GlassCard key={idx} hoverEffect className="p-6">
              <div className="w-12 h-12 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mb-4">
                <feat.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative z-10">
        <GlassCard className="p-12 sm:p-16 border-neon-purple/40 shadow-glow-purple relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl sm:text-6xl font-black font-heading text-white">
              READY TO CLAIM THE <span className="gradient-text-electric">PODIUM?</span>
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto text-base sm:text-lg">
              Sign up today and experience the future of gamified competitions, classrooms, and trivia leagues.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <NeonButton
                variant="cyan"
                size="lg"
                icon={ArrowRight}
                onClick={() => navigate('/register')}
              >
                Create Free Account
              </NeonButton>
              <NeonButton
                variant="outline"
                size="lg"
                onClick={() => navigate('/explore')}
              >
                Browse Public Trivia
              </NeonButton>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

export default LandingPage;

