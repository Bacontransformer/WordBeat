import type { ModuleDef, ModuleKind, MonsterDef, MonsterKind } from './types'

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  slime: {
    kind: 'slime',
    name: '错字史莱姆',
    hp: 64,
    speed: 0.53,
    reward: 3,
    color: '#3d6b4f',
  },
  beetle: {
    kind: 'beetle',
    name: '近义词甲虫',
    hp: 145,
    speed: 0.37,
    reward: 6,
    color: '#8a5a2b',
  },
  ghost: {
    kind: 'ghost',
    name: '同音异形鬼',
    hp: 84,
    speed: 0.68,
    reward: 7,
    color: '#5a6b8a',
  },
}

export const MODULES: Record<ModuleKind, ModuleDef> = {
  cannon: {
    kind: 'cannon',
    name: '闪卡炮',
    desc: '单体射击，稳定清怪',
    cost: 50,
    range: 1.72,
    damage: 15,
    cooldown: 0.8,
    color: '#c45c3e',
  },
  spray: {
    kind: 'spray',
    name: '词根喷雾',
    desc: '小范围溅射伤害',
    cost: 84,
    range: 1.42,
    damage: 8,
    cooldown: 1.2,
    aoe: 0.86,
    color: '#2f6f6a',
  },
  slow: {
    kind: 'slow',
    name: '词典减速',
    desc: '减速路过的怪物',
    cost: 45,
    range: 1.16,
    damage: 0,
    cooldown: 0.42,
    slowFactor: 0.52,
    slowDuration: 1.15,
    color: '#6b4f8a',
  },
}
