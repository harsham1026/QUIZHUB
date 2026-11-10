import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Medal, Sparkles } from 'lucide-react';
import GlassCard from '../common/GlassCard';

export const Podium = ({ podium = [] }) => {
  useEffect(() => {
    // Fire celebratory confetti cannons
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00D2FF', '#9D4EDD', '#00F5D4', '#FFB800'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00D2FF', '#9D4EDD', '#00F5D4', '#FF007A'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const first = podium.find((p) => p.rank === 1) || { nickname: 'Champion', score: 0, xp_earned: 300 };
  const second = podium.find((p) => p.rank === 2) || { nickname: 'Runner Up', score: 0, xp_earned: 200 };
  const third = podium.find((p) => p.rank === 3) || { nickname: '3rd Place', score: 0, xp_earned: 100 };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10 }}
          className="inline-flex p-3 rounded-2xl bg-neon-amber/10 border border-neon-amber/30 shadow-glow-amber mb-3"
        >
          <Trophy className="w-10 h-10 text-neon-amber animate-bounce" />
        </motion.div>
        <h2 className="text-4xl sm:text-5xl font-black font-heading gradient-text-gold">
          CHAMPIONSHIP PODIUM
        </h2>
        <p className="text-slate-400 mt-2">Glory, XP, and bragging rights awarded to the podium masters</p>
      </div>

      <div className="flex items-end justify-center gap-4 sm:gap-6 pt-16">
        {/* 2nd Place (Silver) */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 max-w-[220px] flex flex-col items-center"
        >
          <div className="mb-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surfaceLight border-2 border-slate-300 p-0.5 mx-auto mb-2 relative">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${second.nickname}`}
                alt={second.nickname}
                className="w-full h-full rounded-xl"
              />
              <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center">
                2
              </span>
            </div>
            <p className="font-bold text-white text-sm truncate max-w-[140px]">{second.nickname}</p>
            <p className="text-neon-cyan font-mono text-xs font-semibold">{second.score} pts</p>
          </div>
          <div className="w-full h-44 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700/80 border-t-2 border-slate-300 flex flex-col items-center justify-center shadow-lg">
            <Medal className="w-8 h-8 text-slate-300 mb-1" />
            <span className="text-2xl font-black font-heading text-slate-200">2ND</span>
            <span className="text-xs text-neon-cyan font-mono">+{second.xp_earned} XP</span>
          </div>
        </motion.div>

        {/* 1st Place (Gold) */}
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex-1 max-w-[250px] flex flex-col items-center relative -top-6"
        >
          <motion.div
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-1"
          >
            <Crown className="w-10 h-10 text-neon-amber fill-neon-amber/20" />
          </motion.div>
          <div className="mb-3 text-center">
            <div className="w-20 h-20 rounded-2xl bg-surfaceLight border-2 border-neon-amber p-0.5 mx-auto mb-2 relative shadow-glow-amber">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${first.nickname}`}
                alt={first.nickname}
                className="w-full h-full rounded-xl"
              />
              <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-neon-amber text-slate-950 font-black text-sm flex items-center justify-center">
                1
              </span>
            </div>
            <p className="font-bold text-white text-base truncate max-w-[160px]">{first.nickname}</p>
            <p className="text-neon-amber font-mono text-sm font-bold">{first.score} pts</p>
          </div>
          <div className="w-full h-60 rounded-t-3xl bg-gradient-to-t from-amber-950/60 to-neon-amber/30 border-t-4 border-neon-amber flex flex-col items-center justify-center shadow-glow-amber">
            <Trophy className="w-12 h-12 text-neon-amber mb-1" />
            <span className="text-4xl font-black font-heading text-neon-amber">1ST</span>
            <span className="text-sm text-neon-amber font-mono font-bold">+{first.xp_earned} XP</span>
          </div>
        </motion.div>

        {/* 3rd Place (Bronze) */}
        <motion.div
          initial={{ opacity: 0, y: 90 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 max-w-[220px] flex flex-col items-center"
        >
          <div className="mb-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surfaceLight border-2 border-amber-700 p-0.5 mx-auto mb-2 relative">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${third.nickname}`}
                alt={third.nickname}
                className="w-full h-full rounded-xl"
              />
              <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
            </div>
            <p className="font-bold text-white text-sm truncate max-w-[140px]">{third.nickname}</p>
            <p className="text-neon-cyan font-mono text-xs font-semibold">{third.score} pts</p>
          </div>
          <div className="w-full h-36 rounded-t-2xl bg-gradient-to-t from-amber-950/40 to-amber-900/60 border-t-2 border-amber-700 flex flex-col items-center justify-center shadow-lg">
            <Medal className="w-7 h-7 text-amber-600 mb-1" />
            <span className="text-2xl font-black font-heading text-amber-500">3RD</span>
            <span className="text-xs text-neon-cyan font-mono">+{third.xp_earned} XP</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Podium;

