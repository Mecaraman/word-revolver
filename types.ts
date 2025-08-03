
export interface Question {
  id: number;
  question: string;
  answer: string;
  korean_meaning: string;
  ascii_art: string;
}

export type GameState = 'start' | 'playing' | 'revealing' | 'round-result' | 'game-over';