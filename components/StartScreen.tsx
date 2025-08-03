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


interface StartScreenProps {
  onStart: () => void;
  disabled: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onVolumeChangeEnd: () => void;
  loadingError: string | null;
  onRetry: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, disabled, volume, onVolumeChange, onVolumeChangeEnd, loadingError, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <h1 className="font-cowboy text-7xl md:text-9xl leading-normal text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] py-12">
        Word Revolver
      </h1>
      <div className="text-slate-300 text-lg md:text-xl max-w-3xl mb-8 space-y-2">
          <p>Spin the cylinder to read the jumbled phrase.</p>
          <p>Be careful - it can be read clockwise or counter-clockwise!</p>
          <p className="py-2">
              Aim with your <b className="font-bold text-cyan-400">MOUSE</b>,
              fire spaces with <b className="font-bold text-cyan-400">SPACE</b>,
              and submit with <b className="font-bold text-cyan-400">ENTER</b>.
          </p>
          <p>A single mistake ends the game.</p>
          <p>Survive as long as you can for the high score!</p>
      </div>

      {loadingError ? (
        <div className="text-center animate-fade-in">
            <p className="text-red-400 text-lg mb-4">{loadingError.includes("questions") ? "Failed to load game data." : "Failed to load game assets."}</p>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">{loadingError.includes("questions") ? "The question file may be missing or corrupt." : "Please check your connection and try again."}</p>
            <button
                onClick={onRetry}
                className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-600 text-white font-bold rounded-full text-2xl shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out"
            >
                Retry
            </button>
        </div>
      ) : (
        <button
          onClick={onStart}
          disabled={disabled}
          className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-full text-2xl shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out disabled:bg-slate-500 disabled:from-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed disabled:scale-100"
        >
          {disabled ? 'Loading...' : 'Start Game'}
        </button>
      )}


      <div className="mt-12 w-full max-w-xs space-y-3">
          <label htmlFor="volume-slider-start" className="text-slate-400 font-semibold">Volume</label>
          <div className="flex items-center gap-3">
              <VolumeMuteIcon />
              <input
                  id="volume-slider-start"
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
  );
};

export default StartScreen;