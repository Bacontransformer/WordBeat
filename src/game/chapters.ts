export type ChapterId = 'jungle' | 'ocean' | 'sky'

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
}

export const CHAPTERS: Record<ChapterId, ChapterTheme> = {
  jungle: {
    id: 'jungle',
    name: '丛林',
    tagline: '荆棘、毒菇与缠藤的密林防线',
    accent: '#2f6b4f',
    accentSoft: 'rgba(47, 107, 79, 0.14)',
    mapFrom: '#e4efdf',
    mapTo: '#cfd9c4',
    monsters: {
      slime: { name: '苔藓史莱姆', color: '#3d6b4f' },
      beetle: { name: '甲壳词虫', color: '#6b4f2f' },
      ghost: { name: '雾影异形', color: '#4f6b5a' },
    },
  },
  ocean: {
    id: 'ocean',
    name: '海洋',
    tagline: '鱼叉、灯塔与电鳗的潮汐防线',
    accent: '#2f5f8a',
    accentSoft: 'rgba(47, 95, 138, 0.14)',
    mapFrom: '#dde8f2',
    mapTo: '#c5d6e6',
    monsters: {
      slime: { name: '墨水水母', color: '#3d6b8a' },
      beetle: { name: '甲壳寄居蟹', color: '#8a5a3d' },
      ghost: { name: '同音海妖', color: '#5a6b9a' },
    },
  },
  sky: {
    id: 'sky',
    name: '天空',
    tagline: '疾风、雷云与陨石的云上防线',
    accent: '#6b4f8a',
    accentSoft: 'rgba(107, 79, 138, 0.14)',
    mapFrom: '#ebe4f2',
    mapTo: '#d8d0e6',
    monsters: {
      slime: { name: '云絮错字', color: '#6b7f9a' },
      beetle: { name: '雷羽甲虫', color: '#8a6b3d' },
      ghost: { name: '疾风异形', color: '#5a5a8a' },
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
