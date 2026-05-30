import { Crop } from '../entities/Crop';
import { Disease } from '../entities/Disease';
import { GridSystem } from './GridSystem';
import { CropRole } from '../data/crops';
import { Point } from '../utils/pathfinder';

export interface ChainStep {
  type: 'trigger' | 'amplify' | 'finish';
  sourceCol: number;
  sourceRow: number;
  targetCol: number;
  targetRow: number;
  value: number;
}

export interface ChainResult {
  steps: ChainStep[];
  goldEarned: number;
  diseasesConsumed: number;
  diseasesCleared: number;
  chainLength: number;
}

export class ChainEngine {
  grid: GridSystem;

  constructor(grid: GridSystem) {
    this.grid = grid;
  }

  /**
   * Execute all chain reactions for this turn.
   * Returns chain results for animation.
   */
  resolveChains(): ChainResult[] {
    const results: ChainResult[] = [];
    let safety = 20; // prevent infinite loops

    while (safety-- > 0) {
      const result = this.resolveOneChain();
      if (!result || result.steps.length === 0) break;
      results.push(result);
    }

    return results;
  }

  private resolveOneChain(): ChainResult | null {
    const triggers = this.grid.getCropsInRole(CropRole.TRIGGER).filter(c => c.state !== 'withered');

    // Check if any trigger has adjacent disease
    for (const trigger of triggers) {
      const adjDiseases = this.grid.getAdjacentDiseases(trigger.col, trigger.row, trigger.def.range);
      if (adjDiseases.length === 0) continue;

      return this.executeChain(trigger, adjDiseases);
    }

    return null;
  }

  private executeChain(trigger: Crop, diseases: Disease[]): ChainResult {
    const steps: ChainStep[] = [];
    let diseasesConsumed = 0;
    let diseasesCleared = 0;
    let goldEarned = 0;

    // Step 1: Trigger absorbs diseases
    trigger.activate();
    let totalNutrientValue = 0;
    for (const d of diseases) {
      totalNutrientValue += d.nutrientValue;
      steps.push({
        type: 'trigger',
        sourceCol: d.col,
        sourceRow: d.row,
        targetCol: trigger.col,
        targetRow: trigger.row,
        value: d.nutrientValue,
      });
      this.grid.removeDisease(d);
      diseasesConsumed++;
    }

    const nutrientValue = trigger.nutrientOutputValue(totalNutrientValue);
    const nutrientRange = trigger.nutrientOutputRange();

    // Step 2: Find nearest amplifier or finisher
    let currentCol = trigger.col;
    let currentRow = trigger.row;
    let currentValue = nutrientValue;
    let currentRange = nutrientRange;
    let chainLength = 1;

    let safety = 10;
    while (safety-- > 0 && currentValue > 0) {
      const nextCrop = this.grid.findNearestCrop(
        currentCol, currentRow,
        (c) => (c.def.role === CropRole.AMPLIFIER || c.def.role === CropRole.FINISHER) &&
               c.state !== 'withered' &&
               !(c.col === currentCol && c.row === currentRow) &&
               c.nutrientsAbsorbed < 10,
        currentRange
      );

      if (!nextCrop) break;

      nextCrop.activate();

      if (nextCrop.def.role === CropRole.AMPLIFIER) {
        steps.push({
          type: 'amplify',
          sourceCol: currentCol,
          sourceRow: currentRow,
          targetCol: nextCrop.col,
          targetRow: nextCrop.row,
          value: currentValue,
        });

        currentValue = nextCrop.nutrientOutputValue(currentValue);
        currentRange = nextCrop.nutrientOutputRange();
        currentCol = nextCrop.col;
        currentRow = nextCrop.row;
        chainLength++;
      } else if (nextCrop.def.role === CropRole.FINISHER) {
        nextCrop.nutrientsAbsorbed += currentValue;
        steps.push({
          type: 'finish',
          sourceCol: currentCol,
          sourceRow: currentRow,
          targetCol: nextCrop.col,
          targetRow: nextCrop.row,
          value: currentValue,
        });
        chainLength++;

        if (nextCrop.canFinish()) {
          const score = nextCrop.finishScore();
          goldEarned = score;
          // Clear diseases in 3x3
          const cleared = this.grid.clearDiseasesInArea(nextCrop.col, nextCrop.row, 1);
          diseasesCleared = cleared.length;
          nextCrop.nutrientsAbsorbed = 0; // reset after explosion
        }
        break;
      }
    }

    return {
      steps,
      goldEarned,
      diseasesConsumed,
      diseasesCleared,
      chainLength,
    };
  }

  /**
   * Preview chain path from a potential crop placement (for UI).
   */
  previewChain(col: number, row: number, role: CropRole): Point[] {
    const points: Point[] = [{ col, row }];
    if (role === CropRole.TRIGGER) {
      // Show adjacent disease cells
      const adj = this.grid.getAdjacentDiseases(col, row, 1);
      for (const d of adj) {
        points.push({ col: d.col, row: d.row });
      }
    } else if (role === CropRole.AMPLIFIER) {
      // Show path to nearest finisher
      const target = this.grid.findNearestCrop(
        col, row,
        c => c.def.role === CropRole.FINISHER,
        3
      );
      if (target) points.push({ col: target.col, row: target.row });
    }
    return points;
  }
}
