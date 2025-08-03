import React from 'react';

interface AsciiArtDisplayProps {
  art: string;
  visible: boolean;
}

const AsciiArtDisplay: React.FC<AsciiArtDisplayProps> = ({ art, visible }) => {
  return (
    <div
      className={`
        transition-opacity duration-[3000ms] ease-in
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      aria-hidden={!visible}
    >
      <div className="bg-slate-800/50 p-4 rounded-xl shadow-lg border border-slate-700/50 backdrop-blur-sm">
        <pre className="text-cyan-300 font-mono text-center leading-none text-xs select-none">
          {art}
        </pre>
      </div>
    </div>
  );
};

export default AsciiArtDisplay;