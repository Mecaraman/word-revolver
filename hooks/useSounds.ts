

import { useRef, useCallback, useEffect, useState } from 'react';

const SOUND_CONFIG = {
  start: { files: ['/assets/sounds/start.webm'], strategy: 'single' as const },
  win: { files: ['/assets/sounds/win.webm'], strategy: 'single' as const },
  lose: { files: ['/assets/sounds/lose.webm'], strategy: 'single' as const },
  spin: { files: ['/assets/sounds/spin_1.webm', '/assets/sounds/spin_2.webm'], strategy: 'alternate' as const },
  snap: { files: ['/assets/sounds/snap_1.webm', '/assets/sounds/snap_2.webm', '/assets/sounds/snap_3.webm'], strategy: 'random_no_repeat' as const },
  fire: { files: ['/assets/sounds/fire_1.webm', '/assets/sounds/fire_2.webm', '/assets/sounds/fire_3.webm', '/assets/sounds/fire_4.webm', '/assets/sounds/fire_5.webm', '/assets/sounds/fire_6.webm'], strategy: 'random_no_repeat' as const },
  ui_click: { files: ['/assets/sounds/fire_1.webm'], strategy: 'single' as const },
};

export type SoundCategory = keyof typeof SOUND_CONFIG;
export type SoundPlayer = (category: SoundCategory, volume?: number) => void;
export type UnlockAudio = () => void;

export const useSounds = () => {
    const audioPool = useRef<{ [key: string]: HTMLAudioElement }>({});
    const failedAudios = useRef<Set<string>>(new Set());
    const lastPlayedIndex = useRef<{ [key in SoundCategory]?: number }>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);

    useEffect(() => {
        // Use a Set to ensure we only load each unique audio file once.
        const allFiles = [...new Set(Object.values(SOUND_CONFIG).flatMap(config => config.files))];
        
        if (allFiles.length === 0 || Object.keys(audioPool.current).length > 0) {
            if (Object.keys(audioPool.current).length > 0) setIsLoaded(true);
            return;
        }

        let loadedCount = 0;
        const totalFiles = allFiles.length;

        if (totalFiles === 0) {
          setIsLoaded(true);
          return;
        }

        allFiles.forEach(src => {
            const audio = new Audio(src);
            audio.preload = 'auto';
            audioPool.current[src] = audio;

            const onCanPlayThrough = () => {
                loadedCount++;
                if (loadedCount === totalFiles) {
                    setIsLoaded(true);
                }
                audio.removeEventListener('canplaythrough', onCanPlayThrough);
                audio.removeEventListener('error', onError);
            };

            const onError = () => {
                console.error(`Failed to load audio: ${src}`);
                failedAudios.current.add(src); // Track failed audio files.
                loadedCount++;
                if (loadedCount === totalFiles) {
                    setIsLoaded(true); // Mark as loaded to not block the UI.
                }
                audio.removeEventListener('canplaythrough', onCanPlayThrough);
                audio.removeEventListener('error', onError);
            }

            audio.addEventListener('canplaythrough', onCanPlayThrough);
            audio.addEventListener('error', onError);

            audio.load();
        });
    }, []);

    const unlock: UnlockAudio = useCallback(() => {
        if (isUnlocked || !isLoaded) {
            return;
        }
        setIsUnlocked(true); // Latch to prevent re-entry.

        // This function must be called from within a user gesture (e.g., a click handler).
        // It attempts to play and pause every loaded sound silently, which is a robust
        // way to unlock the browser's audio context for all of them.
        Object.values(audioPool.current).forEach(audio => {
            const wasMuted = audio.muted;
            audio.muted = true; // Force silent playback.

            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.muted = wasMuted; // Restore state on success
                }).catch(() => {
                    // An error is expected if the context is locked for some sounds. We tried.
                    // The main thing is to restore the muted state.
                    audio.muted = wasMuted; // Restore state on failure
                });
            } else {
                 audio.muted = wasMuted; // Fallback for older browsers
            }
        });
    }, [isLoaded, isUnlocked]);

    const play: SoundPlayer = useCallback((category, volume = 0.5) => {
        if (!isLoaded) return;

        const config = SOUND_CONFIG[category];
        if (!config) return;

        let src: string;
        const lastIndex = lastPlayedIndex.current[category];
        const files = config.files;

        switch (config.strategy) {
            case 'alternate': {
                const nextIndex = (lastIndex === undefined ? -1 : lastIndex + 1) % files.length;
                src = files[nextIndex];
                lastPlayedIndex.current[category] = nextIndex;
                break;
            }
            case 'random_no_repeat': {
                let nextIndex;
                if (files.length === 1) {
                    nextIndex = 0;
                } else {
                    do {
                        nextIndex = Math.floor(Math.random() * files.length);
                    } while (nextIndex === lastIndex);
                }
                src = files[nextIndex];
                lastPlayedIndex.current[category] = nextIndex;
                break;
            }
            case 'single':
            default:
                src = files[0];
                break;
        }
        
        // Do not attempt to play an audio file if it failed to load.
        if (failedAudios.current.has(src)) {
            return;
        }

        const audio = audioPool.current[src];
        if (audio) {
            audio.volume = volume;
            audio.currentTime = 0;
            audio.play().catch(e => {
              // Log error only if it's not the typical "interrupted" error
              if ((e as DOMException).name !== 'AbortError') {
                console.error(`Audio play failed for ${src}:`, e)
              }
            });
        }
    }, [isLoaded]);
    
    return { play, isLoaded, unlock };
};