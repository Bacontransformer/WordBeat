import type { ModuleDef, ModuleKind, MonsterDef, MonsterKind } from './types'

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  slime: {
    kind: 'slime',
    name: '错字史莱姆',
    hp: 40,
    speed: 0.42,
    reward: 4,
    color: '#3d6b4f',
  },
  beetle: {
    kind: 'beetle',
    name: '近义词甲虫',
    hp: 95,
    speed: 0.3,
    reward: 8,
    color: '#8a5a2b',
  },
  ghost: {
    kind: 'ghost',
    name: '同音异形鬼',
    hp: 55,
    speed: 0.55,
    reward: 10,
    color: '#5a6b8a',
  },
}

export const MODULES: Record<ModuleKind, ModuleDef> = {
  cannon: {
    kind: 'cannon',
    name: '闪卡炮',
    desc: '单体射击，稳定清怪',
    cost: 40,
    range: 1.8,
    damage: 18,
    cooldown: 0.7,
    color: '#c45c3e',
  },
  spray: {
    kind: 'spray',
    name: '词根喷雾',
    desc: '小范围溅射伤害',
    cost: 70,
    range: 1.5,
    damage: 10,
    cooldown: 1.1,
    aoe: 0.9,
    color: '#2f6f6a',
  },
  slow: {
    kind: 'slow',
    name: '词典减速',
    desc: '减速路过的怪物',
    cost: 35,
    range: 1.2,
    damage: 0,
    cooldown: 0.4,
    slowFactor: 0.45,
    slowDuration: 1.4,
    color: '#6b4f8a',
  },
}
