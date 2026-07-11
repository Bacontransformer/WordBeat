import type { ModuleKind, MonsterKind } from './types'

export const MONSTER_SPRITE: Record<MonsterKind, string> = {
  slime: '/sprites/monster-slime.svg',
  beetle: '/sprites/monster-beetle.svg',
  ghost: '/sprites/monster-ghost.svg',
}

export const MODULE_SPRITE: Record<ModuleKind, string> = {
  cannon: '/sprites/module-cannon.svg',
  spray: '/sprites/module-spray.svg',
  slow: '/sprites/module-slow.svg',
}

export const PROJECTILE_SPRITE = {
  card: '/sprites/proj-card.svg',
  mist: '/sprites/proj-mist.svg',
} as const
