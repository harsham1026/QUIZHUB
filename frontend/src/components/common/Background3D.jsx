import React from 'react';
import { motion } from 'framer-motion';

export const Background3D = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep esports ambient glow orbs */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.28, 0.15],
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-neon-blue/30 blur-[130px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.12, 0.25, 0.12],
          x: [0, -50, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-neon-purple/25 blur-[150px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 left-1/4 w-[28rem] h-[28rem] rounded-full bg-neon-cyan/20 blur-[140px]"
      />

      {/* Grid cyber aesthetic layer */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(#00D2FF 1px, transparent 1px), linear-gradient(90deg, #00D2FF 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Floating 3D Geometric wireframes */}
      <motion.div
        animate={{
          rotateX: [0, 180, 360],
          rotateY: [0, 360, 0],
          y: [0, -25, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-24 right-[15%] w-24 h-24 border border-neon-blue/20 rounded-2xl opacity-40 shadow-glow-blue"
        style={{ transformStyle: 'preserve-3d' }}
      />

      <motion.div
        animate={{
          rotate: [0, 360],
          y: [0, 30, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-32 left-[10%] w-32 h-32 border border-neon-purple/20 rounded-full opacity-30 shadow-glow-purple"
      />

      <motion.div
        animate={{
          rotate: [45, 225, 45],
          y: [0, -18, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2/3 right-[8%] w-16 h-16 border border-neon-pink/20 rotate-45 opacity-30"
      />
    </div>
  );
};

export default Background3D;

