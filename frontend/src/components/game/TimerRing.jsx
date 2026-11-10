import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const TimerRing = ({
  duration = 30,
  onExpire,
  size = 90,
  strokeWidth = 6,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / duration;
  const strokeDashoffset = circumference - progress * circumference;

  const isUrgent = timeLeft <= 5;
  const isWarning = timeLeft <= 10 && !isUrgent;

  const color = isUrgent
    ? '#FF007A'
    : isWarning
    ? '#FFB800'
    : '#00D2FF';

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'linear' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={`font-heading font-extrabold text-2xl ${
            isUrgent ? 'text-neon-pink animate-pulse' : isWarning ? 'text-neon-amber' : 'text-neon-blue'
          }`}
        >
          {timeLeft}
        </motion.span>
      </div>
    </div>
  );
};

export default TimerRing;

