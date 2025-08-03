
import { Question } from '../types';
import questionsData from '../data/questions.json';

// Module-level caches to hold promises for each asset.
// This ensures that we only trigger a fetch/load once per asset.
const imagePromisesCache: Record<string, Promise<void>> = {};
let questionsPromiseCache: Promise<Question[]> | null = null;

// The main promise for the combined asset loading operation.
let combinedPromise: Promise<{ questions: Question[] }> | null = null;

const fetchQuestionsInternal = (): Promise<Question[]> => {
    if (questionsPromiseCache) {
        return questionsPromiseCache;
    }
    // By importing the JSON directly, we bypass the need for a network request.
    // We wrap the static data in a resolved promise to fit the existing async structure.
    questionsPromiseCache = Promise.resolve(questionsData as Question[]);
    return questionsPromiseCache;
};

const preloadImageInternal = (src: string): Promise<void> => {
    if (imagePromisesCache[src]) {
        return imagePromisesCache[src];
    }
    imagePromisesCache[src] = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => {
            console.error(`Failed to load image asset: ${src}`);
            // Allow retrying by removing the failed promise from the cache.
            delete imagePromisesCache[src];
            reject(new Error(`Failed to load image asset: ${src}`));
        };
    });
    return imagePromisesCache[src];
};

/**
 * Fetches all necessary game data (questions.json) and preloads all
 * critical images. This function is idempotent; it will only perform
 * the network requests once per asset.
 *
 * @returns {Promise<{ questions: Question[] }>} A promise that resolves with the game data.
 */
export const loadGameAssets = (): Promise<{ questions: Question[] }> => {
    if (combinedPromise) {
        return combinedPromise;
    }

    combinedPromise = (async () => {
        try {
            const imageUrls: string[] = [];
            for (let i = 1; i <= 11; i++) {
                imageUrls.push(`/assets/images/revolver_${String(i).padStart(2, '0')}.png`);
            }

            const imagePromises = imageUrls.map(preloadImageInternal);
            // Now gets the questions from the imported static data.
            const questionsPromise = fetchQuestionsInternal();

            const [, questions] = await Promise.all([
                Promise.all(imagePromises),
                questionsPromise
            ]);

            return { questions };
        } catch (error) {
            // If loading fails, nullify the combined promise to allow a full retry.
            // The individual caches inside have already been managed for retries.
            combinedPromise = null;
            // Re-throw the error to be caught by the caller.
            throw error;
        }
    })();
    
    return combinedPromise;
};

/**
 * Clears all asset loading caches. This should be called before retrying
 * a failed `loadGameAssets` call to ensure a fresh attempt.
 */
export const clearAssetCache = () => {
    // Clear all promises to allow a full refetch
    Object.keys(imagePromisesCache).forEach(key => delete imagePromisesCache[key]);
    questionsPromiseCache = null;
    combinedPromise = null;
};
