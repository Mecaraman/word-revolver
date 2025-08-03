

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Question, GameState } from './types';
import { 
    INITIAL_ROUND_TIME_SECONDS, 
    RESULT_SCREEN_DELAY,
    PHASE_1_END_ROUND,
    PHASE_2_END_ROUND,
    TIME_DECREMENT_START_ROUND,
    TIME_DECREMENT_PER_ROUND,
    MIN_ROUND_TIME_SECONDS
} from './constants';
import StartScreen from './components/StartScreen';
import ResultScreen from './components/ResultScreen';
import WordRing from './components/WordRing';
import Timer from './components/Timer';
import { useSounds, SoundPlayer, SoundCategory } from './hooks/useSounds';
import AsciiArtDisplay from './components/AsciiArtDisplay';
import RevolverAnimation from './components/RevolverAnimation';
import PauseMenu from './components/PauseMenu';
import { loadGameAssets, clearAssetCache } from './services/assetLoader';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
    </svg>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [isPaused, setIsPaused] = useState(false);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionPools, setQuestionPools] = useState<{ p1: Question[], p2: Question[], p3: Question[] }>({ p1: [], p2: [], p3: []});
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_ROUND_TIME_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [lastRoundResult, setLastRoundResult] = useState<'correct' | 'incorrect' | null>(null);
  const [userSubmission, setUserSubmission] = useState('');
  const [showAsciiArt, setShowAsciiArt] = useState(false);
  
  // State for revolver animation
  const [isAiming, setIsAiming] = useState(false);
  const [fireTrigger, setFireTrigger] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const { play: basePlay, isLoaded: soundsAreLoaded, unlock: unlockAudio } = useSounds();
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const play = useCallback((category: SoundCategory, relativeVolume: number = 1.0) => {
    if (!soundsAreLoaded) return;
    basePlay(category, volume * relativeVolume);
  }, [basePlay, volume, soundsAreLoaded]);


  const handleLoadAssets = useCallback(async () => {
    setLoadingError(null);
    setAssetsLoaded(false);

    try {
        const { questions } = await loadGameAssets();
        setAllQuestions(questions);
        setAssetsLoaded(true);
    } catch (error) {
        console.error("Asset loading failed:", error);
        setLoadingError(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  }, []);

  useEffect(() => {
    handleLoadAssets();
  }, [handleLoadAssets]);

  const handleRetry = () => {
    clearAssetCache();
    handleLoadAssets();
  };

  const getRoundTimeLimit = useCallback((roundIndex: number) => {
    const roundNumber = roundIndex + 1;
    if (roundNumber < TIME_DECREMENT_START_ROUND) { // Rounds 1-5
        return INITIAL_ROUND_TIME_SECONDS;
    }
    // Time decreases from Round 6 onwards
    const time = INITIAL_ROUND_TIME_SECONDS - (roundNumber - TIME_DECREMENT_START_ROUND) * TIME_DECREMENT_PER_ROUND;
    return Math.max(time, MIN_ROUND_TIME_SECONDS);
  }, []);

  const startGame = useCallback(() => {
    if (!assetsLoaded || !soundsAreLoaded || loadingError) return;

    const p1Data = allQuestions.filter(q => q.id >= 1 && q.id <= 100);
    if (p1Data.length === 0) {
        console.error("No questions available for initial rounds. Cannot start game.");
        setLoadingError("Failed to load questions: No questions available for the first rounds.");
        return;
    }

    // Unlock the browser's audio context by trying to play sounds silently.
    // This must be done inside a user gesture handler (like this click event).
    unlockAudio();
    
    play('start', 0.6);
    
    let p2Data = allQuestions.filter(q => q.id >= 101 && q.id <= 300);
    let p3Data = allQuestions.filter(q => q.id >= 301 && q.id <= 400);

    if (p3Data.length === 0) p3Data = p2Data;
    if (p2Data.length === 0) p2Data = p1Data;
    
    setQuestionPools({
        p1: shuffleArray(p1Data),
        p2: shuffleArray(p2Data),
        p3: shuffleArray(p3Data),
    });

    setCurrentRound(0);
    setScore(0);
    setGameState('playing');
    setTimerActive(true);
    setIsPaused(false);
    setTimeLeft(INITIAL_ROUND_TIME_SECONDS);
    setUserSubmission('');
    setShowAsciiArt(false);
    setIsAiming(false);
    setFireTrigger(0);
  }, [allQuestions, soundsAreLoaded, assetsLoaded, play, loadingError, unlockAudio]);
  
  const restartGame = useCallback(() => {
    setIsPaused(false);
    startGame();
  }, [startGame]);

  const currentQuestion = useMemo(() => {
      if (gameState === 'start' || allQuestions.length === 0 || questionPools.p1.length === 0) {
        return null;
      }
      const roundNumber = currentRound + 1;
      if (roundNumber <= PHASE_1_END_ROUND) {
          return questionPools.p1[currentRound % questionPools.p1.length];
      } else if (roundNumber <= PHASE_2_END_ROUND) {
          const indexInPool = currentRound - PHASE_1_END_ROUND;
          return questionPools.p2[indexInPool % questionPools.p2.length];
      } else {
          const indexInPool = currentRound - PHASE_2_END_ROUND;
          return questionPools.p3[indexInPool % questionPools.p3.length];
      }
  }, [currentRound, questionPools, gameState, allQuestions.length]);
  
  const endRound = useCallback((submissionText: string) => {
      if (gameState !== 'playing' || !currentQuestion) return;
      setTimerActive(false);
      setUserSubmission(submissionText);
      
      const isCorrect = submissionText.trim().replace(/\s+/g, ' ').toLowerCase() === currentQuestion.answer.toLowerCase();
      if(isCorrect) {
          play('win', 0.6);
          setScore(prev => prev + 1);
          setLastRoundResult('correct');
      } else {
          setLastRoundResult('incorrect');
      }

      setGameState('revealing');
  }, [gameState, currentQuestion, play]);
  
  const endRoundRef = useRef(endRound);
  useEffect(() => {
    endRoundRef.current = endRound;
  }, [endRound]);

  useEffect(() => {
    if (!timerActive || gameState !== 'playing' || isPaused) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTimeLeft => {
        if (prevTimeLeft <= 1) {
          clearInterval(intervalId);
          endRoundRef.current(''); 
          return 0;
        }
        const newTimeLeft = prevTimeLeft - 1;
        if (newTimeLeft === 15) {
          setShowAsciiArt(true);
        }
        return newTimeLeft;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerActive, gameState, isPaused]);

  const handleRevealComplete = useCallback(() => {
    setGameState('round-result');
  }, []);

  useEffect(() => {
    if (gameState !== 'round-result') return;

    const timer = setTimeout(() => {
        if (lastRoundResult === 'incorrect') {
            play('lose', 0.6);
            setGameState('game-over');
            setTimerActive(false);
        } else {
            // Proceed to next round
            setLastRoundResult(null);
            setUserSubmission('');
            setShowAsciiArt(false);
            setIsAiming(false);
            const nextRoundIndex = currentRound + 1;
            setCurrentRound(nextRoundIndex);
            setTimeLeft(getRoundTimeLimit(nextRoundIndex));
            setGameState('playing');
            setTimerActive(true);
        }
    }, RESULT_SCREEN_DELAY);
    
    return () => clearTimeout(timer);
  }, [gameState, lastRoundResult, currentRound, getRoundTimeLimit, play]);
  
  // Callbacks for revolver animation
  const handleDragStart = useCallback(() => setIsAiming(true), []);
  const handleDragEnd = useCallback(() => setIsAiming(false), []);
  const handleSpacePress = useCallback(() => {
    play('fire', 0.5);
    setFireTrigger(c => c + 1);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 150);
  }, [play]);

  const handleVolumeChangeEnd = useCallback(() => {
    play('ui_click', 0.5);
  }, [play]);

  const renderGameState = () => {
    const isLoading = !assetsLoaded || !soundsAreLoaded;
    
    if (!currentQuestion && (gameState !== 'start' && gameState !== 'game-over')) {
        return <div className="text-2xl text-slate-400">Loading assets...</div>;
    }

    switch (gameState) {
      case 'start':
        return <StartScreen 
          onStart={startGame} 
          disabled={isLoading || !!loadingError} 
          volume={volume}
          onVolumeChange={setVolume}
          onVolumeChangeEnd={handleVolumeChangeEnd}
          loadingError={loadingError}
          onRetry={handleRetry}
        />;
      
      case 'playing':
      case 'revealing':
      case 'round-result':
        if (!currentQuestion) return null;
        return (
          <div className="relative w-full h-full flex items-center justify-center">
              {/* Main Game Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] w-full max-w-screen-2xl mx-auto h-full items-center justify-items-center gap-y-4 lg:gap-x-8 px-4">
                <div className="hidden lg:block" />
                <div className="relative flex-shrink-0 w-[600px] h-[600px] flex items-center justify-center">
                    {gameState === 'playing' && (
                      <RevolverAnimation isAiming={isAiming} fireTrigger={fireTrigger} />
                    )}
                    <WordRing 
                        key={currentQuestion.id}
                        question={currentQuestion} 
                        onSubmission={endRound}
                        isRevealing={gameState === 'revealing' || gameState === 'round-result'}
                        onRevealComplete={handleRevealComplete}
                        userSubmission={userSubmission}
                        isAiming={isAiming}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onSpacePress={handleSpacePress}
                        play={play as SoundPlayer}
                    />
                </div>
                <div className="lg:justify-self-start">
                  <AsciiArtDisplay
                      art={currentQuestion.ascii_art}
                      visible={showAsciiArt || gameState === 'round-result'}
                  />
                </div>
            </div>
            
            {/* Result Overlay */}
            {gameState === 'round-result' && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900/75 backdrop-blur-lg animate-fade-in z-50">
                    {(() => {
                        const message = lastRoundResult === 'correct' ? 'Bullseye!' : 'Missed!';
                        const color = lastRoundResult === 'correct' ? 'text-green-400' : 'text-red-500';
                        return (
                            <div className="text-center">
                                <h2 className={`font-cowboy text-9xl animate-pulse ${color} drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`}>{message}</h2>
                                {lastRoundResult === 'incorrect' && <p className="text-2xl mt-4 text-slate-300">The correct answer was: "{currentQuestion.answer}"</p>}
                            </div>
                        );
                    })()}
                </div>
            )}
          </div>
        );

      case 'game-over':
        return <ResultScreen score={score} onRestart={startGame} />;
      default:
        return null;
    }
  };

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-4 ${isShaking ? 'animate-screen-shake' : ''}`}>
      {(gameState === 'playing' || gameState === 'revealing') && currentQuestion && (
        <div className="w-full max-w-4xl mx-auto absolute top-4 px-4 z-40">
            <div className="flex justify-between items-center text-xl font-bold text-slate-300 mb-2">
                <span>Round: {currentRound + 1}</span>
                <span>Score: {score}</span>
            </div>
          <Timer timeLeft={timeLeft} totalTime={getRoundTimeLimit(currentRound)} />
        </div>
      )}
      {gameState === 'playing' && !isPaused && (
        <button
            onClick={() => setIsPaused(true)}
            className="fixed top-5 right-5 z-50 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors"
            aria-label="Pause Game"
        >
            <PauseIcon />
        </button>
      )}
      {isPaused && (
        <PauseMenu 
            onResume={() => setIsPaused(false)}
            onRestart={restartGame}
            volume={volume}
            onVolumeChange={setVolume}
            onVolumeChangeEnd={handleVolumeChangeEnd}
        />
      )}
      <div className="w-full h-full flex-grow flex items-center justify-center pt-20">
        {renderGameState()}
      </div>
    </main>
  );
};

export default App;