import React from 'react';
import { motion } from 'framer-motion';

export const NeonButton = ({
  children,
  variant = 'primary', // primary (blue), secondary (purple), cyan, pink, outline, ghost
  size = 'md', // sm, md, lg
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-gradient-to-r from-neon-blue to-blue-600 text-white shadow-glow-blue hover:from-cyan-400 hover:to-blue-500',
    secondary: 'bg-gradient-to-r from-neon-purple to-indigo-600 text-white shadow-glow-purple hover:from-purple-500 hover:to-indigo-500',
    cyan: 'bg-gradient-to-r from-neon-cyan to-teal-500 text-slate-950 font-bold shadow-glow-cyan hover:from-teal-300 hover:to-cyan-400',
    pink: 'bg-gradient-to-r from-neon-pink to-rose-600 text-white shadow-glow-pink hover:from-rose-400 hover:to-pink-500',
    outline: 'border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base font-bold rounded-xl gap-2.5',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`inline-flex items-center justify-center transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </motion.button>
  );
};

export default NeonButton;

