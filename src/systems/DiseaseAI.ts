import { Disease } from '../entities/Disease';
import { GridSystem } from './GridSystem';
import { getNeighbors, Point } from '../utils/pathfinder';
import { GRID_SIZE } from '../utils/constants';

export class DiseaseAI {
  /**
   * Spread all diseases by one step. Returns newly created diseases.
   */
  spreadAll(grid: GridSystem): Disease[] {
    const existingDiseases = grid.getAllDiseases();
    const newDiseases: Disease[] = [];
    const spreadTargets = new Map<string, { pos: Point; isSuper: boolean }>();

    for (const disease of existingDiseases) {
      disease.resetSpread();
      const neighbors = getNeighbors(disease.col, disease.row);
      // Shuffle for randomness
      this.shuffle(neighbors);

      let spreads = 0;
      for (const n of neighbors) {
        if (spreads >= disease.def.spreadSpeed) break;

        const cell = grid.get(n.col, n.row);
        // Only spread into empty cells
        if (cell.kind === 'empty') {
          const key = `${n.col},${n.row}`;
          if (!spreadTargets.has(key)) {
            spreadTargets.set(key, { pos: n, isSuper: disease.isSuper });
          }
          spreads++;
        }
        // Don't spread onto other disease cells or crop cells
      }
    }

    // Resolve spread targets
    for (const [key, target] of spreadTargets) {
      const existing = grid.get(target.pos.col, target.pos.row);
      if (existing.kind === 'empty') {
        const d = new Disease(target.pos.col, target.pos.row, target.isSuper);
        grid.placeDisease(d);
        newDiseases.push(d);
      }
    }

    // Check for merge: if two diseases ended on same cell
    this.mergeDiseases(grid);

    return newDiseases;
  }

  /**
   * Track disease-crop overlaps for chain resolution
   */
  getDiseasesOnCrops(grid: GridSystem): Map<string, Disease> {
    const result = new Map<string, Disease>();
    // We check adjacent cells — diseases adjacent to crops
    const crops = grid.getAllCrops();
    for (const crop of crops) {
      if (crop.def.role !== ('trigger' as any)) continue;
      const adj = grid.getAdjacentDiseases(crop.col, crop.row, crop.def.range);
      for (const d of adj) {
        result.set(`${d.col},${d.row}`, d);
      }
    }
    return result;
  }

  private mergeDiseases(grid: GridSystem): void {
    // After spread, check if two standard fungi are adjacent — merge into super
    const diseases = grid.getAllDiseases();
    const byPos = new Map<string, Disease[]>();
    for (const d of diseases) {
      const key = `${d.col},${d.row}`;
      if (!byPos.has(key)) byPos.set(key, []);
      byPos.get(key)!.push(d);
    }

    // Note: with our current model, diseases occupy cells, so merging happens
    // when spread targets overlap — handled during placement
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}
