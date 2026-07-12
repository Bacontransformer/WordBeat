export type ChapterId = 'jungle' | 'ocean' | 'sky'

export type ChapterTheme = {
  id: ChapterId
  name: string
  tagline: string
  /** CSS accent for map / UI */
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
    cannon: { name: string; desc: string; color: string }
    spray: { name: string; desc: string; color: string }
    slow: { name: string; desc: string; color: string }
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
      cannon: { name: '藤鞭闪卡', desc: '单体抽打，清怪稳妥', color: '#c45c3e' },
      spray: { name: '花粉喷雾', desc: '小范围溅射伤害', color: '#2f6f4a' },
      slow: { name: '树汁减速', desc: '减速路过的怪物', color: '#5a6b3f' },
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
      cannon: { name: '浪花闪卡', desc: '单体射击，稳定清怪', color: '#c45c3e' },
      spray: { name: '盐雾喷溅', desc: '小范围溅射伤害', color: '#2f6f8a' },
      slow: { name: '洋流减速', desc: '减速路过的怪物', color: '#4f5f8a' },
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
      cannon: { name: '雷光闪卡', desc: '单体射击，稳定清怪', color: '#c45c3e' },
      spray: { name: '星屑喷雾', desc: '小范围溅射伤害', color: '#4f6f8a' },
      slow: { name: '气流减速', desc: '减速路过的怪物', color: '#6b4f8a' },
    },
  },
}

export function chapterForSortIndex(index: number): ChapterId {
  if (index < 2) return 'jungle'
  if (index < 4) return 'ocean'
  return 'sky'
}

export function resolveChapter(raw?: string | null, sortIndex = 0): ChapterId {
  if (raw === 'jungle' || raw === 'ocean' || raw === 'sky') return raw
  return chapterForSortIndex(sortIndex)
}
