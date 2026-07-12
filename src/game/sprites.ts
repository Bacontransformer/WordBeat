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

/** 每章独立造型，不再共用「笔」 */
export const MODULE_SPRITE: Record<ModuleKind, string> = {
  thorn: '/sprites/module-thorn.svg',
  mushroom: '/sprites/module-mushroom.svg',
  vine: '/sprites/module-vine.svg',
  firefly: '/sprites/module-firefly.svg',
  hornet: '/sprites/module-hornet.svg',
  boulder: '/sprites/module-boulder.svg',
  harpoon: '/sprites/module-harpoon.svg',
  bubble: '/sprites/module-bubble.svg',
  net: '/sprites/module-net.svg',
  lighthouse: '/sprites/module-lighthouse.svg',
  eel: '/sprites/module-eel.svg',
  trident: '/sprites/module-trident.svg',
  gale: '/sprites/module-gale.svg',
  starfall: '/sprites/module-starfall.svg',
  cloudwrap: '/sprites/module-cloudwrap.svg',
  sunbeam: '/sprites/module-sunbeam.svg',
  thunder: '/sprites/module-thunder.svg',
  meteor: '/sprites/module-meteor.svg',
}

export const PROJECTILE_SPRITE: Partial<Record<ProjectileKind, string>> = {
  dart: '/sprites/proj-dart.svg',
  cloud: '/sprites/proj-cloud.svg',
  arc: '/sprites/proj-arc.svg',
}

/** 章节专属弹道外观 */
export const CHAPTER_PROJECTILE: Record<
  ChapterId,
  { dart: string; cloud: string; arc: string }
> = {
  jungle: {
    dart: '/sprites/proj-dart-jungle.svg',
    cloud: '/sprites/proj-cloud-jungle.svg',
    arc: '/sprites/proj-arc-jungle.svg',
  },
  ocean: {
    dart: '/sprites/proj-dart-ocean.svg',
    cloud: '/sprites/proj-cloud-ocean.svg',
    arc: '/sprites/proj-arc-ocean.svg',
  },
  sky: {
    dart: '/sprites/proj-dart-sky.svg',
    cloud: '/sprites/proj-cloud-sky.svg',
    arc: '/sprites/proj-arc-sky.svg',
  },
}

export function moduleSprite(_chapter: ChapterId, kind: ModuleKind): string {
  return MODULE_SPRITE[kind]
}

export function monsterSprite(chapter: ChapterId, kind: MonsterKind): string {
  return MONSTER_SPRITE[chapter][kind]
}

export function projectileSprite(
  kind: ProjectileKind,
  chapter?: ChapterId,
): string | null {
  if (chapter && (kind === 'dart' || kind === 'cloud' || kind === 'arc')) {
    return CHAPTER_PROJECTILE[chapter][kind]
  }
  return PROJECTILE_SPRITE[kind] ?? null
}
