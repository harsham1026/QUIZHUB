import React from 'react';
import { motion } from 'framer-motion';

export const GlassCard = ({
  children,
  className = '',
  hoverEffect = false,
  glowColor = 'none', // none, blue, purple, cyan, pink
  onClick,
  ...props
}) => {
  const glowStyles = {
    none: '',
    blue: 'shadow-glow-blue border-neon-blue/40',
    purple: 'shadow-glow-purple border-neon-purple/40',
    cyan: 'shadow-glow-cyan border-neon-cyan/40',
    pink: 'shadow-glow-pink border-neon-pink/40',
  };

  const Component = hoverEffect ? motion.div : 'div';
  const animationProps = hoverEffect
    ? {
        whileHover: { y: -4, transition: { duration: 0.2 } },
        whileTap: { scale: 0.98 },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
        glowStyles[glowColor] || ''
      } ${className}`}
      {...animationProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default GlassCard;

