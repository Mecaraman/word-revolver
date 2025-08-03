import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Question } from '../types';
import { SoundPlayer } from '../hooks/useSounds';

interface WordRingProps {
  question: Question;
  onSubmission: (completedSentence: string) => void;
  isRevealing: boolean;
  onRevealComplete: () => void;
  userSubmission: string;
  isAiming: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onSpacePress: () => void;
  play: SoundPlayer;
}

const Pointer = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-400 absolute top-[-20px] left-1/2 -translate-x-1/2 z-30">
        <path d="M12 22L2 7h20z" />
    </svg>
);

const WordRing: React.FC<WordRingProps> = ({ question, onSubmission, isRevealing, onRevealComplete, userSubmission, isAiming, onDragStart, onDragEnd, onSpacePress, play }) => {
  const [isClockwise, setIsClockwise] = useState(true);
  const [displayText, setDisplayText] = useState(question.question);
  const [rotation, setRotation] = useState(0);
  const [spaceIndices, setSpaceIndices] = useState<number[]>([]);
  const [charColors, setCharColors] = useState<string[]>([]);
  const [revealProgress, setRevealProgress] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);

  const animationIntervalRef = useRef<number | null>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ startAngle: 0, startRotation: 0 });
  const isFirstMove = useRef(false);
  
  const getSnapIndexFromRotation = useCallback((currentRotation: number) => {
    const len = displayText.length;
    if (len === 0) return 0;
    const anglePerChar = 360 / len;
    
    // Normalize rotation to be positive
    const normalizedRotation = (currentRotation % 360 + 360) % 360;

    let snapIndex;
    if (isClockwise) {
      const positiveRotation = (-currentRotation % 360 + 360) % 360;
      snapIndex = Math.round(positiveRotation / anglePerChar);
    } else {
      snapIndex = Math.round(normalizedRotation / anglePerChar);
    }
    
    return ((snapIndex % len) + len) % len;
  }, [displayText.length, isClockwise]);
  
  const resetForNewQuestion = useCallback((q: Question) => {
    const newIsClockwise = Math.random() > 0.5;
    setIsClockwise(newIsClockwise);
    setDisplayText(q.question);
    setSpaceIndices([]);
    setCharColors([]);
    setRevealProgress(-1);
    if(animationIntervalRef.current) clearInterval(animationIntervalRef.current);

    const len = q.question.length;
    if (len > 0) {
      const anglePerChar = 360 / len;
      const randomStartIndex = Math.floor(Math.random() * len);
      
      const targetIndexRotation = randomStartIndex * anglePerChar;
      const initialRotation = newIsClockwise ? -targetIndexRotation : targetIndexRotation;
      
      setRotation(initialRotation);
    } else {
      setRotation(0);
    }
  }, []);

  useEffect(() => {
    resetForNewQuestion(question);
  }, [question, resetForNewQuestion]);
  
  const snapToNearest = useCallback((currentRotation: number) => {
      const len = displayText.length;
      if (len === 0) return 0;

      const anglePerChar = 360 / len;
      const targetIndex = getSnapIndexFromRotation(currentRotation);
      
      const baseTargetRotation = isClockwise
          ? -targetIndex * anglePerChar
          : targetIndex * anglePerChar;

      // Find the closest angle, might be in a different revolution
      const revolutions = Math.round(currentRotation / 360);
      let targetRotation = baseTargetRotation + (360 * revolutions);
      
      const diff = Math.abs(currentRotation - targetRotation);
      
      // Check if the other direction is shorter
      const altTarget1 = targetRotation - 360;
      if (Math.abs(currentRotation - altTarget1) < diff) {
        targetRotation = altTarget1;
      }
      
      const altTarget2 = targetRotation + 360;
      if (Math.abs(currentRotation - altTarget2) < diff) {
        targetRotation = altTarget2;
      }

      return targetRotation;
  }, [displayText.length, isClockwise, getSnapIndexFromRotation]);

  useEffect(() => {
    if (isRevealing) {
        onDragEnd(); // Ensure dragging state is reset

        const userWordsSet = new Set(userSubmission.trim().toLowerCase().split(/\s+/g));
        const correctWords = question.answer.split(' ');
        const finalColors: string[] = [];

        correctWords.forEach((word, index) => {
            const isWordCorrect = userWordsSet.has(word.toLowerCase());
            const color = isWordCorrect ? '#34d399' : '#f87171';
            finalColors.push(...Array(word.length).fill(color));
            if (index < correctWords.length - 1) {
                finalColors.push('white');
            }
        });
        setCharColors(finalColors);
        setDisplayText(question.answer);

        setRevealProgress(0);
        animationIntervalRef.current = window.setInterval(() => {
            setRevealProgress(prev => prev + 1);
        }, 50);

    } else {
       if(animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    }
    return () => {
       if(animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    }
  }, [isRevealing, userSubmission, question.answer, onDragEnd]);

  useEffect(() => {
      if (!isRevealing) return;
      if (revealProgress > displayText.length) {
          if(animationIntervalRef.current) clearInterval(animationIntervalRef.current);
          setTimeout(onRevealComplete, 500);
      } else if (revealProgress >= 0) {
          const anglePerChar = 360 / displayText.length;
          const targetRotation = -(revealProgress + 0.5) * anglePerChar;
          setRotation(targetRotation);
          if (revealProgress < displayText.length && revealProgress % 2 === 0) {
            play('snap', 0.4);
          }
      }
  }, [revealProgress, displayText.length, onRevealComplete, play, isRevealing]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (isRevealing || !ringRef.current) return;
    
    const rect = ringRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);

    dragInfo.current = { startAngle: angle, startRotation: rotation };
    isFirstMove.current = true;
    setIsDragging(true);
  }, [isRevealing, rotation]);
  
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (isRevealing || !ringRef.current) return;
    
    if (isFirstMove.current) {
        onDragStart();
        play('spin', 0.4);
        isFirstMove.current = false;
    }

    const rect = ringRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const currentAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    const deltaAngle = currentAngle - dragInfo.current.startAngle;
    const newRotation = dragInfo.current.startRotation + deltaAngle;

    const oldSnapIndex = getSnapIndexFromRotation(rotation);
    const newSnapIndex = getSnapIndexFromRotation(newRotation);
    if(oldSnapIndex !== newSnapIndex) play('snap', 0.4);
    
    setRotation(newRotation);
  }, [isRevealing, getSnapIndexFromRotation, rotation, play, onDragStart]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || isRevealing) return;
    
    setIsDragging(false);
    
    if (isAiming) {
        onDragEnd();
    }
    setRotation(snapToNearest(rotation));
  }, [isAiming, isDragging, isRevealing, rotation, snapToNearest, onDragEnd]);
  
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
        const { clientX, clientY } = 'touches' in e ? e.touches[0] : e;
        handleDragMove(clientX, clientY);
    };
    
    const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        onMove(e);
    };

    const onEnd = () => handleDragEnd();

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchend', onEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
      if (isAiming) {
          document.body.style.cursor = 'grabbing';
      } else {
          document.body.style.cursor = '';
      }
      return () => {
          document.body.style.cursor = '';
      }
  }, [isAiming]);

  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX, e.clientY);
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRevealing) return;
      
      const snapIndex = getSnapIndexFromRotation(rotation);

      if (e.code === 'Space') {
        e.preventDefault();
        const len = displayText.length;

        if (len > 0 && displayText[(snapIndex + len - 1) % len] !== ' ' && displayText[snapIndex % len] !== ' ') {
            onSpacePress();
            const newText = displayText.slice(0, snapIndex) + ' ' + displayText.slice(snapIndex);
            setDisplayText(newText);
            
            setSpaceIndices(current => {
                const updatedIndices = current.map(idx => idx >= snapIndex ? idx + 1 : idx);
                return [...updatedIndices, snapIndex];
            });
            
            const newLen = newText.length;
            const anglePerChar = 360 / newLen;
            const newRotation = isClockwise ? rotation - (anglePerChar / 2) : rotation + (anglePerChar / 2);
            setRotation(snapToNearest(newRotation));
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        onSubmission(displayText);
      } else if (e.code === 'KeyZ') {
          e.preventDefault();
          if (spaceIndices.length > 0) {
              const indicesCopy = [...spaceIndices];
              const lastSpaceAbsoluteIndex = indicesCopy.pop()!;
              
              const newText = displayText.substring(0, lastSpaceAbsoluteIndex) + displayText.substring(lastSpaceAbsoluteIndex + 1);
              setDisplayText(newText);
              
              const finalIndices = indicesCopy.map(idx => idx > lastSpaceAbsoluteIndex ? idx - 1 : idx);
              setSpaceIndices(finalIndices);

              const newLen = newText.length;
              const anglePerChar = 360 / newLen;
              const newRotation = isClockwise ? rotation + (anglePerChar / 2) : rotation - (anglePerChar / 2);
              setRotation(snapToNearest(newRotation));
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayText, rotation, getSnapIndexFromRotation, onSubmission, spaceIndices, isRevealing, isClockwise, snapToNearest, onSpacePress]);


  const BASE_FONT_SIZE = 44;
  const FONT_SCALE_THRESHOLD = 25;
  const FONT_SCALE_FACTOR = 0.4;
  const MIN_FONT_SIZE = 28;
  const radius = 240;
  const viewBoxSize = 600;
  const center = viewBoxSize / 2;

  const dynamicFontSize = useMemo(() => {
    const len = displayText.length;
    if (len <= FONT_SCALE_THRESHOLD) {
      return BASE_FONT_SIZE;
    }
    const newSize = BASE_FONT_SIZE - (len - FONT_SCALE_THRESHOLD) * FONT_SCALE_FACTOR;
    return Math.max(newSize, MIN_FONT_SIZE);
  }, [displayText.length]);


  const anglePerCharRad = (2 * Math.PI) / displayText.length;
  const currentDisplayText = isRevealing ? question.answer : displayText;

  return (
    <div className="flex flex-col items-center justify-center p-4 z-10">
        <div 
            ref={ringRef}
            className="relative w-[600px] h-[600px] select-none cursor-grab touch-none"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            <Pointer />
            <div 
                className="w-full h-full relative z-20" 
                style={{ 
                    transform: `rotate(${rotation}deg)`, 
                    transition: isAiming ? 'none' : 'transform 0.3s ease-out' 
                }}>
                <svg
                    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                    className="w-full h-full pointer-events-none"
                >
                    <g>
                        {currentDisplayText.split('').map((char, i) => {
                        const directionModifier = (isRevealing || isClockwise) ? 1 : -1;
                        const angleRad = directionModifier * (i + 0.5) * anglePerCharRad - Math.PI / 2;

                        const x = center + radius * Math.cos(angleRad);
                        const y = center + radius * Math.sin(angleRad);
                        
                        let color = 'white';
                        if (isRevealing) {
                            if (i < revealProgress) {
                                color = charColors[i] || 'white';
                            }
                        }

                        return (
                            <text
                            key={`${i}-${char}`}
                            x={x}
                            y={y}
                            fill={color}
                            fontSize={dynamicFontSize}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{ 
                                textRendering: 'geometricPrecision', 
                                fontWeight: 500, 
                                transition: 'fill 0.2s ease-in-out',
                                transform: `rotate(${-rotation}deg)`,
                                transformOrigin: `${x}px ${y}px`,
                             }}
                            >
                            {char}
                            </text>
                        );
                        })}
                    </g>
                </svg>
            </div>
        </div>
        <div className="text-center h-24 mt-8">
            <p className="text-2xl font-semibold text-slate-400 tracking-widest">
                {question.answer.split(' ').map((word, i) => (
                    <span key={i} className="mr-3 opacity-40">{'_'.repeat(word.length)}</span>
                ))}
            </p>
            {!isRevealing && spaceIndices.length > 0 && (
              <p className="text-sm text-slate-500 mt-4 animate-fade-in h-6">
                  Press <kbd className="px-2 py-1 text-xs font-semibold text-slate-300 bg-slate-700 border border-slate-600 rounded-md">Z</kbd> to undo last space
              </p>
            )}
             {isRevealing && (
                <div className="mt-4 h-6">
                    <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-red-400 animate-pulse">
                        Revealing answer...
                    </p>
                </div>
            )}
        </div>
    </div>
  );
};

export default WordRing;