export type Direction = 'north' | 'south' | 'east' | 'west';

export const GRID_SIZE = 8;
export const CELL_SIZE = 64;
export const GRID_OFFSET_X = 200;
export const GRID_OFFSET_Y = 60;

export const COLORS = {
  SOIL_DARK: 0x1a1208,
  SOIL_MID: 0x2d4a1e,
  CELL_EMPTY: 0x3a2815,
  CELL_BORDER: 0x4a3825,
  CELL_TILLED: 0x4a3018,
  DISEASE: 0x9b59b6,
  DISEASE_SUPER: 0x8e44ad,
  NUTRIENT: 0x00d4ff,
  GOLD: 0xc9a227,
  GOLD_BRIGHT: 0xffd700,
  PANEL_BG: 0x1a1208,
  PANEL_BORDER: 0xc9a227,
  TEXT_PRIMARY: 0xf5e6c8,
  TEXT_GOLD: 0xffd700,
  HIGHLIGHT_VALID: 0x27ae60,
  HIGHLIGHT_HOVER: 0x44bd7e,
  ENERGY: 0x3498db,
};

export function cellToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
    y: GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

export function pixelToCell(px: number, py: number): { col: number; row: number } | null {
  const col = Math.floor((px - GRID_OFFSET_X) / CELL_SIZE);
  const row = Math.floor((py - GRID_OFFSET_Y) / CELL_SIZE);
  if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;
  return { col, row };
}

export function manhattan(c1: number, r1: number, c2: number, r2: number): number {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2);
}
