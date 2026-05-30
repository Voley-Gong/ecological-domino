export class Nutrient {
  value: number;
  range: number;
  sourceCol: number;
  sourceRow: number;

  constructor(value: number, range: number, col: number, row: number) {
    this.value = value;
    this.range = range;
    this.sourceCol = col;
    this.sourceRow = row;
  }
}
