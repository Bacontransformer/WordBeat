import type { ModuleDef, ModuleKind, MonsterDef, MonsterKind } from './types'

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  slime: {
    kind: 'slime',
    name: '错字史莱姆',
    hp: 55,
    speed: 0.48,
    reward: 4,
    color: '#3d6b4f',
  },
  beetle: {
    kind: 'beetle',
    name: '近义词甲虫',
    hp: 120,
    speed: 0.34,
    reward: 7,
    color: '#8a5a2b',
  },
  ghost: {
    kind: 'ghost',
    name: '同音异形鬼',
    hp: 70,
    speed: 0.62,
    reward: 8,
    color: '#5a6b8a',
  },
}

export const MODULES: Record<ModuleKind, ModuleDef> = {
  cannon: {
    kind: 'cannon',
    name: '闪卡炮',
    desc: '单体射击，稳定清怪',
    cost: 45,
    range: 1.75,
    damage: 16,
    cooldown: 0.75,
    color: '#c45c3e',
  },
  spray: {
    kind: 'spray',
    name: '词根喷雾',
    desc: '小范围溅射伤害',
    cost: 78,
    range: 1.45,
    damage: 9,
    cooldown: 1.15,
    aoe: 0.88,
    color: '#2f6f6a',
  },
  slow: {
    kind: 'slow',
    name: '词典减速',
    desc: '减速路过的怪物',
    cost: 40,
    range: 1.18,
    damage: 0,
    cooldown: 0.4,
    slowFactor: 0.48,
    slowDuration: 1.25,
    color: '#6b4f8a',
  },
}
