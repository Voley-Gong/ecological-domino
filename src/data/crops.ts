export enum CropType {
  FLYTRAP = 'flytrap',
  SUNFLOWER = 'sunflower',
  PUMPKIN = 'pumpkin',
}

export enum CropRole {
  TRIGGER = 'trigger',
  AMPLIFIER = 'amplifier',
  FINISHER = 'finisher',
}

export interface CropDef {
  type: CropType;
  role: CropRole;
  name: string;
  icon: string;
  cost: number;
  lifespan: number;
  range: number;
  color: number;
  description: string;
}

export const CROP_DEFS: Record<CropType, CropDef> = {
  [CropType.FLYTRAP]: {
    type: CropType.FLYTRAP,
    role: CropRole.TRIGGER,
    name: '捕蝇草',
    icon: '🌿',
    cost: 3,
    lifespan: 5,
    range: 1,
    color: 0x27ae60,
    description: '吸收邻近疾病，产出酶',
  },
  [CropType.SUNFLOWER]: {
    type: CropType.SUNFLOWER,
    role: CropRole.AMPLIFIER,
    name: '向日葵',
    icon: '🌻',
    cost: 5,
    lifespan: 4,
    range: 2,
    color: 0xf1c40f,
    description: '吸收养分并放大传播',
  },
  [CropType.PUMPKIN]: {
    type: CropType.PUMPKIN,
    role: CropRole.FINISHER,
    name: '南瓜',
    icon: '🎃',
    cost: 8,
    lifespan: 6,
    range: 2,
    color: 0xe67e22,
    description: '积累养分爆炸得金',
  },
};
