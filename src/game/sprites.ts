import type { ChapterId } from './chapters'
import type { ModuleKind, MonsterKind, ProjectileKind } from './types'

export const MONSTER_SPRITE: Record<ChapterId, Record<MonsterKind, string>> = {
  jungle: {
    slime: '/sprites/monster-slime-jungle.svg',
    beetle: '/sprites/monster-beetle-jungle.svg',
    ghost: '/sprites/monster-ghost-jungle.svg',
  },
  ocean: {
    slime: '/sprites/monster-slime-ocean.svg',
    beetle: '/sprites/monster-beetle-ocean.svg',
    ghost: '/sprites/monster-ghost-ocean.svg',
  },
  sky: {
    slime: '/sprites/monster-slime-sky.svg',
    beetle: '/sprites/monster-beetle-sky.svg',
    ghost: '/sprites/monster-ghost-sky.svg',
  },
}

/** 每种模组独立造型（非书本换皮） */
export const MODULE_SPRITE: Record<ModuleKind, string> = {
  quill: '/sprites/module-quill.svg',
  spore: '/sprites/module-spore.svg',
  snare: '/sprites/module-snare.svg',
  beam: '/sprites/module-beam.svg',
  chain: '/sprites/module-chain.svg',
  stamp: '/sprites/module-stamp.svg',
}

export const PROJECTILE_SPRITE: Partial<Record<ProjectileKind, string>> = {
  dart: '/sprites/proj-dart.svg',
  cloud: '/sprites/proj-cloud.svg',
  arc: '/sprites/proj-arc.svg',
}

export function moduleSprite(_chapter: ChapterId, kind: ModuleKind): string {
  return MODULE_SPRITE[kind]
}

export function monsterSprite(chapter: ChapterId, kind: MonsterKind): string {
  return MONSTER_SPRITE[chapter][kind]
}

export function projectileSprite(kind: ProjectileKind): string | null {
  return PROJECTILE_SPRITE[kind] ?? null
}
