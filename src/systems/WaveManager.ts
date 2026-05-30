import { Disease } from '../entities/Disease';
import { GridSystem } from './GridSystem';
import { getEdgeCell, randomEdge } from '../utils/pathfinder';
import { WaveEntry, getWaveForTurn } from '../data/waves';

export class WaveManager {
  private grid: GridSystem;

  constructor(grid: GridSystem) {
    this.grid = grid;
  }

  spawnWave(turn: number): Disease[] {
    const wave = getWaveForTurn(turn);
    const newDiseases: Disease[] = [];

    for (let i = 0; i < wave.fungi + wave.superFungi; i++) {
      const isSuper = i >= wave.fungi;
      const edge = randomEdge();
      let attempts = 0;
      while (attempts < 20) {
        const pos = getEdgeCell(edge);
        if (this.grid.isEmpty(pos.col, pos.row)) {
          const d = new Disease(pos.col, pos.row, isSuper);
          this.grid.placeDisease(d);
          newDiseases.push(d);
          break;
        }
        // Try different edge position
        attempts++;
        const altPos = getEdgeCell(randomEdge());
        if (this.grid.isEmpty(altPos.col, altPos.row)) {
          const d = new Disease(altPos.col, altPos.row, isSuper);
          this.grid.placeDisease(d);
          newDiseases.push(d);
          break;
        }
      }
    }

    return newDiseases;
  }
}
