import { GRID_SIZE, manhattan } from '../utils/constants';
import { Point } from '../utils/pathfinder';
import { Crop } from '../entities/Crop';
import { Disease } from '../entities/Disease';
import { CropRole } from '../data/crops';

export type CellContent =
  | { kind: 'empty' }
  | { kind: 'crop'; crop: Crop }
  | { kind: 'disease'; disease: Disease };

export class GridSystem {
  grid: CellContent[][];

  constructor() {
    this.grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      this.grid[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        this.grid[r][c] = { kind: 'empty' };
      }
    }
  }

  get(col: number, row: number): CellContent {
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
      return { kind: 'empty' };
    }
    return this.grid[row][col];
  }

  set(col: number, row: number, content: CellContent): void {
    this.grid[row][col] = content;
  }

  isEmpty(col: number, row: number): boolean {
    return this.grid[row][col].kind === 'empty';
  }

  placeCrop(crop: Crop): boolean {
    if (!this.isEmpty(crop.col, crop.row)) return false;
    this.grid[crop.row][crop.col] = { kind: 'crop', crop };
    return true;
  }

  removeCrop(crop: Crop): void {
    const cell = this.grid[crop.row][crop.col];
    if (cell.kind === 'crop' && cell.crop === crop) {
      this.grid[crop.row][crop.col] = { kind: 'empty' };
    }
  }

  placeDisease(disease: Disease): boolean {
    const cell = this.grid[disease.row][disease.col];
    if (cell.kind === 'disease') {
      // Merge into super if two fungi overlap
      const existing = cell.disease;
      if (!existing.isSuper) {
        this.grid[disease.row][disease.col] = {
          kind: 'disease',
          disease: new Disease(disease.col, disease.row, true),
        };
      }
      return true;
    }
    if (cell.kind !== 'empty') {
      return false;
    }
    this.grid[disease.row][disease.col] = { kind: 'disease', disease };
    return true;
  }

  removeDisease(disease: Disease): void {
    const cell = this.grid[disease.row][disease.col];
    if (cell.kind === 'disease' && cell.disease === disease) {
      this.grid[disease.row][disease.col] = { kind: 'empty' };
    }
  }

  clearDiseasesInArea(centerCol: number, centerRow: number, radius: number): Disease[] {
    const removed: Disease[] = [];
    for (let r = centerRow - radius; r <= centerRow + radius; r++) {
      for (let c = centerCol - radius; c <= centerCol + radius; c++) {
        if (c < 0 || c >= GRID_SIZE || r < 0 || r >= GRID_SIZE) continue;
        const cell = this.grid[r][c];
        if (cell.kind === 'disease') {
          removed.push(cell.disease);
          this.grid[r][c] = { kind: 'empty' };
        }
      }
    }
    return removed;
  }

  getCropsInRole(role: CropRole): Crop[] {
    const result: Crop[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        if (cell.kind === 'crop' && cell.crop.def.role === role) {
          result.push(cell.crop);
        }
      }
    }
    return result;
  }

  getAllCrops(): Crop[] {
    const result: Crop[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        if (cell.kind === 'crop') result.push(cell.crop);
      }
    }
    return result;
  }

  getAllDiseases(): Disease[] {
    const result: Disease[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        if (cell.kind === 'disease') result.push(cell.disease);
      }
    }
    return result;
  }

  getAdjacentDiseases(col: number, row: number, range: number): Disease[] {
    const result: Disease[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        if (cell.kind === 'disease' && manhattan(col, row, c, r) <= range) {
          result.push(cell.disease);
        }
      }
    }
    return result;
  }

  findNearestCrop(
    fromCol: number,
    fromRow: number,
    predicate: (crop: Crop) => boolean,
    maxRange: number
  ): Crop | null {
    let best: Crop | null = null;
    let bestDist = Infinity;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = this.grid[r][c];
        if (cell.kind === 'crop' && predicate(cell.crop)) {
          const d = manhattan(fromCol, fromRow, c, r);
          if (d <= maxRange && d < bestDist && d > 0) {
            bestDist = d;
            best = cell.crop;
          }
        }
      }
    }
    return best;
  }

  diseaseCount(): number {
    let count = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c].kind === 'disease') count++;
      }
    }
    return count;
  }

  cropCount(): number {
    let count = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.grid[r][c].kind === 'crop') count++;
      }
    }
    return count;
  }

  clone(): GridSystem {
    const g = new GridSystem();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        g.grid[r][c] = this.grid[r][c]; // shallow clone is ok for snapshot
      }
    }
    return g;
  }
}
