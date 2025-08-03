
import React, { useState, useEffect, useRef } from 'react';

const FRAME_DURATION = 1000 / 12; // approx 83.33ms
const AIMING_LOOP = [3, 4, 5, 6];
const FIRING_SEQUENCE = [7, 8, 9, 10, 11];
const RELEASE_SEQUENCE = [2, 1]; // New sequence for smooth aim-down animation

type AnimationState = 'IDLE' | 'AIMING' | 'FIRING' | 'RELEASING';

interface RevolverAnimationProps {
  isAiming: boolean;
  fireTrigger: number;
}

const allImageUrls = Array.from({ length: 11 }, (_, i) => `/assets/images/revolver_${String(i + 1).padStart(2, '0')}.png`);

const RevolverAnimation: React.FC<RevolverAnimationProps> = ({ isAiming, fireTrigger }) => {
  const [frame, setFrame] = useState(1);
  const [state, setState] = useState<AnimationState>('IDLE');
  const animationTimer = useRef<number | null>(null);
  const lastFireTrigger = useRef(fireTrigger);
  const prevState = useRef<AnimationState>(state);

  useEffect(() => {
    prevState.current = state;
  }, [state]);

  useEffect(() => {
    if (fireTrigger > lastFireTrigger.current) {
      lastFireTrigger.current = fireTrigger;
      setState('FIRING');
    }
  }, [fireTrigger]);

  useEffect(() => {
    if (state === 'FIRING' || state === 'RELEASING') {
      return;
    }

    if (isAiming) {
      setState('AIMING');
    } else {
      if (prevState.current === 'AIMING') {
        setState('RELEASING');
      } else {
        setState('IDLE');
      }
    }
  }, [isAiming, state]);

  useEffect(() => {
    const clearTimer = () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
    clearTimer();

    switch (state) {
      case 'IDLE':
        setFrame(1);
        break;

      case 'AIMING': {
        setFrame(2);
        let loopIndex = 0;
        const aimLoop = () => {
          setFrame(AIMING_LOOP[loopIndex]);
          loopIndex = (loopIndex + 1) % AIMING_LOOP.length;
          animationTimer.current = window.setTimeout(aimLoop, FRAME_DURATION);
        };
        animationTimer.current = window.setTimeout(aimLoop, FRAME_DURATION);
        break;
      }
        
      case 'FIRING': {
        let fireIndex = 0;
        const fireStep = () => {
          setFrame(FIRING_SEQUENCE[fireIndex]);
          fireIndex++;
          if (fireIndex < FIRING_SEQUENCE.length) {
            animationTimer.current = window.setTimeout(fireStep, FRAME_DURATION);
          } else {
            setState(isAiming ? 'AIMING' : 'IDLE');
          }
        };
        fireStep();
        break;
      }
      
      case 'RELEASING': {
        let releaseIndex = 0;
        const releaseStep = () => {
          setFrame(RELEASE_SEQUENCE[releaseIndex]);
          releaseIndex++;
          if (releaseIndex < RELEASE_SEQUENCE.length) {
            animationTimer.current = window.setTimeout(releaseStep, FRAME_DURATION);
          } else {
            setState('IDLE');
          }
        };
        releaseStep();
        break;
      }
    }

    return clearTimer;
  }, [state, isAiming]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      {allImageUrls.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={`Revolver animation frame ${index + 1}`}
          className={`
            w-full h-full object-contain transform scale-[1.5] -translate-y-[145px]
            absolute top-0 left-0
            ${frame === (index + 1) ? 'opacity-100' : 'opacity-0'}
          `}
          loading="eager"
          aria-hidden={frame !== (index + 1)}
        />
      ))}
    </div>
  );
};

export default RevolverAnimation;