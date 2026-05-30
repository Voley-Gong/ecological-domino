export interface WaveEntry {
  turn: number;
  fungi: number;
  superFungi: number;
}

export const WAVES: WaveEntry[] = [
  { turn: 1, fungi: 1, superFungi: 0 },
  { turn: 2, fungi: 1, superFungi: 0 },
  { turn: 3, fungi: 2, superFungi: 0 },
  { turn: 4, fungi: 2, superFungi: 1 },
  { turn: 5, fungi: 3, superFungi: 0 },
  { turn: 6, fungi: 3, superFungi: 1 },
  { turn: 7, fungi: 4, superFungi: 0 },
  { turn: 8, fungi: 4, superFungi: 1 },
  { turn: 9, fungi: 5, superFungi: 2 },
  { turn: 10, fungi: 6, superFungi: 3 },
];

export function getWaveForTurn(turn: number): WaveEntry {
  if (turn <= WAVES.length) return WAVES[turn - 1];
  // After wave 10: ramp up
  const base = WAVES[WAVES.length - 1];
  const extra = turn - WAVES.length;
  return {
    turn,
    fungi: base.fungi + extra,
    superFungi: base.superFungi + Math.floor(extra / 2),
  };
}
