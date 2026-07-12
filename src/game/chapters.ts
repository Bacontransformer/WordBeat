export type ChapterId = 'jungle' | 'ocean' | 'sky'

export type ModuleFlavor = { name: string; desc: string; color: string }

export type ChapterTheme = {
  id: ChapterId
  name: string
  tagline: string
  accent: string
  accentSoft: string
  mapFrom: string
  mapTo: string
  monsters: {
    slime: { name: string; color: string }
    beetle: { name: string; color: string }
    ghost: { name: string; color: string }
  }
  modules: {
    quill: ModuleFlavor
    spore: ModuleFlavor
    snare: ModuleFlavor
    beam: ModuleFlavor
    chain: ModuleFlavor
    stamp: ModuleFlavor
  }
}

export const CHAPTERS: Record<ChapterId, ChapterTheme> = {
  jungle: {
    id: 'jungle',
    name: '丛林',
    tagline: '藤蔓与错题本交织的密林',
    accent: '#2f6b4f',
    accentSoft: 'rgba(47, 107, 79, 0.14)',
    mapFrom: '#e4efdf',
    mapTo: '#cfd9c4',
    monsters: {
      slime: { name: '苔藓史莱姆', color: '#3d6b4f' },
      beetle: { name: '甲壳词虫', color: '#6b4f2f' },
      ghost: { name: '雾影异形', color: '#4f6b5a' },
    },
    modules: {
      quill: { name: '翠羽墨针', desc: '羽笔发射墨针，单体高速', color: '#c45c3e' },
      spore: { name: '雨林孢囊', desc: '蘑菇弹溅射孢子云', color: '#3d8a4a' },
      snare: { name: '缠藤网', desc: '藤蔓脉冲减速路过怪', color: '#6b8a2f' },
      beam: { name: '萤光标线', desc: '直线穿透光束', color: '#d4a017' },
      chain: { name: '虫鸣链', desc: '电弧在怪之间跳跃', color: '#4a9a6a' },
      stamp: { name: '苔印爆', desc: '印章砸地范围爆发', color: '#a63d3d' },
    },
  },
  ocean: {
    id: 'ocean',
    name: '海洋',
    tagline: '潮汐里漂来的四级词浪',
    accent: '#2f5f8a',
    accentSoft: 'rgba(47, 95, 138, 0.14)',
    mapFrom: '#dde8f2',
    mapTo: '#c5d6e6',
    monsters: {
      slime: { name: '墨水水母', color: '#3d6b8a' },
      beetle: { name: '甲壳寄居蟹', color: '#8a5a3d' },
      ghost: { name: '同音海妖', color: '#5a6b9a' },
    },
    modules: {
      quill: { name: '浪尖羽笔', desc: '羽笔发射墨针，单体高速', color: '#2a7a9e' },
      spore: { name: '泡沫孢囊', desc: '水母孢溅射伤害', color: '#3d9aaa' },
      snare: { name: '渔网困', desc: '洋流网减速路过怪', color: '#3f5f9a' },
      beam: { name: '灯塔扫射', desc: '直线穿透光束', color: '#e8c040' },
      chain: { name: '雷霆链', desc: '电弧在怪之间跳跃', color: '#4a8fd4' },
      stamp: { name: '锚印轰', desc: '印章砸地范围爆发', color: '#c43e6a' },
    },
  },
  sky: {
    id: 'sky',
    name: '天空',
    tagline: '云层之上的终局听写',
    accent: '#6b4f8a',
    accentSoft: 'rgba(107, 79, 138, 0.14)',
    mapFrom: '#ebe4f2',
    mapTo: '#d8d0e6',
    monsters: {
      slime: { name: '云絮错字', color: '#6b7f9a' },
      beetle: { name: '雷羽甲虫', color: '#8a6b3d' },
      ghost: { name: '疾风异形', color: '#5a5a8a' },
    },
    modules: {
      quill: { name: '星羽笔', desc: '羽笔发射墨针，单体高速', color: '#7a4fc4' },
      spore: { name: '星尘孢', desc: '星屑云溅射伤害', color: '#5a7ab8' },
      snare: { name: '气流茧', desc: '气流茧减速路过怪', color: '#8a5fb0' },
      beam: { name: '虹光标', desc: '直线穿透光束', color: '#f0c020' },
      chain: { name: '雷羽链', desc: '电弧在怪之间跳跃', color: '#6a9ae8' },
      stamp: { name: '天印碎', desc: '印章砸地范围爆发', color: '#d44a7a' },
    },
  },
}

export function chapterForSortIndex(index: number): ChapterId {
  if (index < 5) return 'jungle'
  if (index < 10) return 'ocean'
  return 'sky'
}

export function resolveChapter(raw?: string | null, sortIndex = 0): ChapterId {
  if (raw === 'jungle' || raw === 'ocean' || raw === 'sky') return raw
  return chapterForSortIndex(sortIndex)
}
