import type { ChapterId } from './chapters'
import type { ModuleKind, MonsterKind } from './types'

export const MONSTER_SPRITE: Record<MonsterKind, string> = {
  slime: '/sprites/monster-slime.svg',
  beetle: '/sprites/monster-beetle.svg',
  ghost: '/sprites/monster-ghost.svg',
}

/** 章节专属模组外观（形状不同，不只是换名） */
export const MODULE_SPRITE: Record<ChapterId, Record<ModuleKind, string>> = {
  jungle: {
    cannon: '/sprites/module-cannon-jungle.svg',
    spray: '/sprites/module-spray-jungle.svg',
    slow: '/sprites/module-slow-jungle.svg',
  },
  ocean: {
    cannon: '/sprites/module-cannon-ocean.svg',
    spray: '/sprites/module-spray-ocean.svg',
    slow: '/sprites/module-slow-ocean.svg',
  },
  sky: {
    cannon: '/sprites/module-cannon-sky.svg',
    spray: '/sprites/module-spray-sky.svg',
    slow: '/sprites/module-slow-sky.svg',
  },
}

export const PROJECTILE_SPRITE: Record<
  ChapterId,
  { card: string; mist: string }
> = {
  jungle: {
    card: '/sprites/proj-card-jungle.svg',
    mist: '/sprites/proj-mist-jungle.svg',
  },
  ocean: {
    card: '/sprites/proj-card-ocean.svg',
    mist: '/sprites/proj-mist-ocean.svg',
  },
  sky: {
    card: '/sprites/proj-card-sky.svg',
    mist: '/sprites/proj-mist-sky.svg',
  },
}

export function moduleSprite(chapter: ChapterId, kind: ModuleKind): string {
  return MODULE_SPRITE[chapter][kind]
}

export function projectileSprite(chapter: ChapterId, kind: 'card' | 'mist'): string {
  return PROJECTILE_SPRITE[chapter][kind]
}
