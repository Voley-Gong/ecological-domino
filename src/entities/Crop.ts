import { CropType, CropDef, CROP_DEFS, CropRole } from '../data/crops';
import { GRID_SIZE } from '../utils/constants';
import { Point } from '../utils/pathfinder';

export enum CropState {
  IDLE = 'idle',
  ACTIVE = 'active',
  WITHERED = 'withered',
}

export class Crop {
  type: CropType;
  def: CropDef;
  col: number;
  row: number;
  state: CropState = CropState.IDLE;
  lifespanRemaining: number;
  nutrientsAbsorbed: number = 0;
  activated: boolean = false;

  constructor(type: CropType, col: number, row: number) {
    this.type = type;
    this.def = CROP_DEFS[type];
    this.col = col;
    this.row = row;
    this.lifespanRemaining = this.def.lifespan;
  }

  activate(): void {
    if (!this.activated) {
      this.activated = true;
      this.state = CropState.ACTIVE;
    }
  }

  tickLifespan(): boolean {
    if (this.state === CropState.ACTIVE) {
      this.lifespanRemaining--;
      if (this.lifespanRemaining <= 0) {
        this.state = CropState.WITHERED;
        return true;
      }
    }
    return false;
  }

  pos(): Point {
    return { col: this.col, row: this.row };
  }

  canAbsorbDisease(): boolean {
    return this.def.role === CropRole.TRIGGER;
  }

  canAbsorbNutrient(): boolean {
    return this.def.role === CropRole.AMPLIFIER || this.def.role === CropRole.FINISHER;
  }

  canFinish(): boolean {
    return this.def.role === CropRole.FINISHER && this.nutrientsAbsorbed >= 2;
  }

  nutrientOutputValue(inputValue: number): number {
    if (this.def.role === CropRole.TRIGGER) return 1;
    if (this.def.role === CropRole.AMPLIFIER) return Math.ceil(inputValue * 1.5);
    return inputValue;
  }

  nutrientOutputRange(): number {
    if (this.def.role === CropRole.AMPLIFIER) return this.def.range + 1;
    return this.def.range;
  }

  finishScore(): number {
    if (this.def.role !== CropRole.FINISHER) return 0;
    return this.nutrientsAbsorbed ** 2 * 3;
  }
}
