import type { ModuleAttack, ModuleDef, ModuleKind, MonsterDef, MonsterKind } from './types'
import type { ChapterId } from './chapters'

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  slime: {
    kind: 'slime',
    name: '错字史莱姆',
    hp: 64,
    speed: 0.53,
    reward: 3,
    leakDamage: 12,
    color: '#3d6b4f',
  },
  beetle: {
    kind: 'beetle',
    name: '近义词甲虫',
    hp: 145,
    speed: 0.37,
    reward: 6,
    leakDamage: 28,
    color: '#8a5a2b',
  },
  ghost: {
    kind: 'ghost',
    name: '同音异形鬼',
    hp: 84,
    speed: 0.68,
    reward: 7,
    leakDamage: 18,
    color: '#5a6b8a',
  },
}

const baseByAttack: Record<
  ModuleAttack,
  Pick<ModuleDef, 'cost' | 'range' | 'damage' | 'cooldown' | 'aoe' | 'slowFactor' | 'slowDuration' | 'beamWidth' | 'chainJumps' | 'chainRange'>
> = {
  single: { cost: 48, range: 1.85, damage: 16, cooldown: 0.72 },
  splash: { cost: 82, range: 1.48, damage: 9, cooldown: 1.15, aoe: 0.92 },
  slow: { cost: 44, range: 1.2, damage: 0, cooldown: 0.4, slowFactor: 0.5, slowDuration: 1.25 },
  beam: { cost: 95, range: 2.35, damage: 11, cooldown: 1.35, beamWidth: 0.28 },
  chain: { cost: 110, range: 1.7, damage: 13, cooldown: 1.05, chainJumps: 3, chainRange: 1.55 },
  blast: { cost: 120, range: 1.35, damage: 22, cooldown: 1.55 },
}

function mod(
  kind: ModuleKind,
  attack: ModuleAttack,
  name: string,
  desc: string,
  color: string,
): ModuleDef {
  return { kind, attack, name, desc, color, ...baseByAttack[attack] }
}

/** 三章各 6 种：外形/名字完全按章节，机制复用 6 种 attack */
export const MODULES: Record<ModuleKind, ModuleDef> = {
  // —— 丛林：自然武器 ——
  thorn: mod('thorn', 'single', '荆棘矛', '尖刺穿刺，单体高速', '#c45c3e'),
  mushroom: mod('mushroom', 'splash', '毒菇台', '溅射毒孢云', '#3d8a4a'),
  vine: mod('vine', 'slow', '缠藤桩', '藤蔓脉冲减速', '#6b8a2f'),
  firefly: mod('firefly', 'beam', '萤火柱', '直线萤光穿透', '#d4a017'),
  hornet: mod('hornet', 'chain', '蜂巢塔', '蜂群在怪间跳跃叮咬', '#4a9a6a'),
  boulder: mod('boulder', 'blast', '滚石台', '巨石砸地爆发', '#8a5a3a'),

  // —— 海洋：海战器械 ——
  harpoon: mod('harpoon', 'single', '鱼叉炮', '鱼叉直射，单体', '#2a7a9e'),
  bubble: mod('bubble', 'splash', '泡泡炮', '泡沫溅射', '#3d9aaa'),
  net: mod('net', 'slow', '渔网架', '渔网脉冲减速', '#3f5f9a'),
  lighthouse: mod('lighthouse', 'beam', '灯塔', '灯柱直线穿透', '#e8c040'),
  eel: mod('eel', 'chain', '电鳗巢', '电流在怪间跳跃', '#4a8fd4'),
  trident: mod('trident', 'blast', '三叉戟', '海叉砸地爆发', '#c43e6a'),

  // —— 天空：气象武器 ——
  gale: mod('gale', 'single', '疾风刃', '风刃切割，单体', '#7a4fc4'),
  starfall: mod('starfall', 'splash', '星屑台', '星尘溅射', '#5a7ab8'),
  cloudwrap: mod('cloudwrap', 'slow', '云茧', '气流茧减速', '#8a5fb0'),
  sunbeam: mod('sunbeam', 'beam', '日光柱', '日光直线穿透', '#f0c020'),
  thunder: mod('thunder', 'chain', '雷云', '雷弧跳跃', '#6a9ae8'),
  meteor: mod('meteor', 'blast', '陨石台', '陨石砸地爆发', '#d44a7a'),
}

/** 每章模组解锁顺序（按机制递进） */
export const CHAPTER_MODULE_PROGRESS: Record<ChapterId, ModuleKind[]> = {
  jungle: ['thorn', 'vine', 'mushroom', 'firefly', 'hornet', 'boulder'],
  ocean: ['harpoon', 'net', 'bubble', 'lighthouse', 'eel', 'trident'],
  sky: ['gale', 'cloudwrap', 'starfall', 'sunbeam', 'thunder', 'meteor'],
}

/** 第 n 关（0–4）解锁到第几个模组（含） */
export function modulesForChapterLevel(chapter: ChapterId, levelIndex: number): ModuleKind[] {
  const all = CHAPTER_MODULE_PROGRESS[chapter]
  const count = Math.min(all.length, Math.max(2, levelIndex + 2))
  return all.slice(0, count)
}
