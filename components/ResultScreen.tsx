import React from 'react';

interface ResultScreenProps {
  score: number;
  onRestart: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ score, onRestart }) => {
    const getGameOverMessage = () => {
        if (score === 0) return "Not your day, partner. Dust off and try again!";
        if (score <= 5) return "A respectable start, gunslinger!";
        if (score <= 20) return "Quick on the draw! You're becoming a sharpshooter.";
        return "A true Word Revolver legend!";
    };
    
    const message = getGameOverMessage();

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4 animate-fade-in">
      <h1 className="font-cowboy text-9xl leading-normal text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] py-6">
        Game Over
      </h1>
      <p className="text-slate-300 text-2xl mb-6">{message}</p>
      <div className="text-4xl font-semibold mb-10">
        <span className="text-slate-400">Rounds Completed: </span>
        <span className="text-green-400 font-bold text-5xl">{score}</span>
      </div>
      <button
        onClick={onRestart}
        className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 text-white font-bold rounded-full text-2xl shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out"
      >
        Play Again
      </button>
    </div>
  );
};

export default ResultScreen;