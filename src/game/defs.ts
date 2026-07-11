import type { ModuleDef, ModuleKind, MonsterDef, MonsterKind } from './types'

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  slime: {
    kind: 'slime',
    name: '错字史莱姆',
    hp: 72,
    speed: 0.58,
    reward: 3,
    color: '#3d6b4f',
  },
  beetle: {
    kind: 'beetle',
    name: '近义词甲虫',
    hp: 165,
    speed: 0.4,
    reward: 5,
    color: '#8a5a2b',
  },
  ghost: {
    kind: 'ghost',
    name: '同音异形鬼',
    hp: 95,
    speed: 0.74,
    reward: 6,
    color: '#5a6b8a',
  },
}

export const MODULES: Record<ModuleKind, ModuleDef> = {
  cannon: {
    kind: 'cannon',
    name: '闪卡炮',
    desc: '单体射击，稳定清怪',
    cost: 55,
    range: 1.7,
    damage: 14,
    cooldown: 0.85,
    color: '#c45c3e',
  },
  spray: {
    kind: 'spray',
    name: '词根喷雾',
    desc: '小范围溅射伤害',
    cost: 90,
    range: 1.4,
    damage: 8,
    cooldown: 1.25,
    aoe: 0.85,
    color: '#2f6f6a',
  },
  slow: {
    kind: 'slow',
    name: '词典减速',
    desc: '减速路过的怪物',
    cost: 50,
    range: 1.15,
    damage: 0,
    cooldown: 0.45,
    slowFactor: 0.55,
    slowDuration: 1.1,
    color: '#6b4f8a',
  },
}
