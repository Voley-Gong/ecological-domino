import { GRID_SIZE, manhattan } from './constants';

export interface Point {
  col: number;
  row: number;
}

const DIRS: Point[] = [
  { col: 0, row: -1 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
  { col: 1, row: 0 },
];

function inBounds(p: Point): boolean {
  return p.col >= 0 && p.col < GRID_SIZE && p.row >= 0 && p.row < GRID_SIZE;
}

export function findPathBFS(
  from: Point,
  isValidTarget: (p: Point) => boolean,
  maxRange: number,
  blocked?: (p: Point) => boolean
): Point[] | null {
  if (isValidTarget(from)) return [from];
  if (manhattan(from.col, from.row, from.col, from.row) > maxRange) return null;

  const visited = new Set<string>();
  const key = (p: Point) => `${p.col},${p.row}`;
  const queue: { pos: Point; path: Point[] }[] = [{ pos: from, path: [from] }];
  visited.add(key(from));

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    if (path.length - 1 > maxRange) continue;

    for (const d of DIRS) {
      const next: Point = { col: pos.col + d.col, row: pos.row + d.row };
      if (!inBounds(next)) continue;
      const k = key(next);
      if (visited.has(k)) continue;
      visited.add(k);

      const newPath = [...path, next];

      if (isValidTarget(next)) {
        return newPath;
      }

      if (!blocked || !blocked(next)) {
        queue.push({ pos: next, path: newPath });
      }
    }
  }
  return null;
}

export function getNeighbors(col: number, row: number): Point[] {
  return DIRS.map(d => ({ col: col + d.col, row: row + d.row })).filter(inBounds);
}

export function getAdjacentInBounds(col: number, row: number): Point[] {
  return getNeighbors(col, row);
}

export function getEdgeCell(side: 'north' | 'south' | 'east' | 'west'): Point {
  switch (side) {
    case 'north': return { col: Math.floor(Math.random() * GRID_SIZE), row: 0 };
    case 'south': return { col: Math.floor(Math.random() * GRID_SIZE), row: GRID_SIZE - 1 };
    case 'east': return { col: GRID_SIZE - 1, row: Math.floor(Math.random() * GRID_SIZE) };
    case 'west': return { col: 0, row: Math.floor(Math.random() * GRID_SIZE) };
  }
}

export function randomEdge(): 'north' | 'south' | 'east' | 'west' {
  const sides: Array<'north' | 'south' | 'east' | 'west'> = ['north', 'south', 'east', 'west'];
  return sides[Math.floor(Math.random() * 4)];
}
