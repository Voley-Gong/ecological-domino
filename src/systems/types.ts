export type GamePhase = 'planning' | 'disease' | 'chain' | 'cleanup' | 'gameover';

export interface TurnSummary {
  goldEarned: number;
  chainsCompleted: number;
  diseasesCleared: number;
  newDiseases: number;
  cropsWithered: number;
}

export interface GameState {
  turn: number;
  gold: number;
  energy: number;
  phase: GamePhase;
  totalChains: number;
  totalGoldEarned: number;
  totalDiseasesCleared: number;
}
