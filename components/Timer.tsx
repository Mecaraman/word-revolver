
import React from 'react';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, totalTime }) => {
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  const getBarColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full bg-slate-700 rounded-full h-4 my-4 shadow-inner">
      <div
        className={`h-4 rounded-full transition-all duration-500 ease-linear ${getBarColor()}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default Timer;
