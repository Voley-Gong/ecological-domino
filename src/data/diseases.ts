export interface DiseaseDef {
  name: string;
  spreadSpeed: number; // cells per turn
  nutrientValue: number;
  color: number;
  isSuper: boolean;
}

export const FUNGI_DEF: DiseaseDef = {
  name: '真菌',
  spreadSpeed: 1,
  nutrientValue: 1,
  color: 0x9b59b6,
  isSuper: false,
};

export const SUPER_FUNGI_DEF: DiseaseDef = {
  name: '超级真菌',
  spreadSpeed: 2,
  nutrientValue: 3,
  color: 0x8e44ad,
  isSuper: true,
};
