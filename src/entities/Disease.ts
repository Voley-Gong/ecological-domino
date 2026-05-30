import { DiseaseDef, FUNGI_DEF, SUPER_FUNGI_DEF } from '../data/diseases';
import { Point } from '../utils/pathfinder';

export class Disease {
  col: number;
  row: number;
  def: DiseaseDef;
  spreadRemaining: number;

  constructor(col: number, row: number, isSuper: boolean = false) {
    this.col = col;
    this.row = row;
    this.def = isSuper ? SUPER_FUNGI_DEF : FUNGI_DEF;
    this.spreadRemaining = this.def.spreadSpeed;
  }

  get isSuper(): boolean {
    return this.def.isSuper;
  }

  get nutrientValue(): number {
    return this.def.nutrientValue;
  }

  pos(): Point {
    return { col: this.col, row: this.row };
  }

  resetSpread(): void {
    this.spreadRemaining = this.def.spreadSpeed;
  }
}
