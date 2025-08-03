import React from 'react';

const VolumeMuteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
);

const VolumeMaxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
);


interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onVolumeChange: (volume: number) => void;
  volume: number;
  onVolumeChangeEnd: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, volume, onVolumeChange, onVolumeChangeEnd }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-8 w-full max-w-md text-center animate-fade-in">
        <h2 className="text-4xl font-bold text-cyan-400 mb-6">Paused</h2>
        
        <div className="space-y-4 mb-8">
            <button
                onClick={onResume}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-full text-xl shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out"
            >
                Resume
            </button>
            <button
                onClick={onRestart}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-full text-xl shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out"
            >
                Restart Game
            </button>
        </div>

        <div className="space-y-3">
            <label htmlFor="volume-slider-pause" className="text-slate-400 font-semibold">Volume</label>
            <div className="flex items-center gap-3">
                <VolumeMuteIcon />
                <input
                    id="volume-slider-pause"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    onMouseUp={onVolumeChangeEnd}
                    onTouchEnd={onVolumeChangeEnd}
                    className="w-full"
                    aria-label="Volume"
                />
                <VolumeMaxIcon />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PauseMenu;