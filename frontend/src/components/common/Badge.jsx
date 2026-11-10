import React from 'react';

export const Badge = ({
  children,
  variant = 'blue', // blue, purple, cyan, pink, emerald, amber
  className = '',
}) => {
  const styles = {
    blue: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
    purple: 'bg-neon-purple/10 text-neon-purple border-neon-purple/30',
    cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
    pink: 'bg-neon-pink/10 text-neon-pink border-neon-pink/30',
    emerald: 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/30',
    amber: 'bg-neon-amber/10 text-neon-amber border-neon-amber/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[variant] || styles.blue
      } ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

