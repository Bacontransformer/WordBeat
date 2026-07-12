import type { Point } from './types'
import { cellKey } from './utils'

/**
 * 把屏幕坐标落到可建造格子上：先穿透命中，再找最近格子（放宽半径）。
 */
export function resolveModuleDrop(
  clientX: number,
  clientY: number,
  buildable: Point[],
  occupied: Set<string>,
  mapRoot: Element | null,
): { col: number; row: number } | null {
  const buildSet = new Set(buildable.map((p) => cellKey(p.x, p.y)))
  const canUse = (col: number, row: number) => {
    const key = cellKey(col, row)
    return buildSet.has(key) && !occupied.has(key)
  }

  // 1) 穿透命中：跳过实体/幽灵，找格子
  if (typeof document !== 'undefined' && 'elementsFromPoint' in document) {
    const stack = document.elementsFromPoint(clientX, clientY)
    for (const el of stack) {
      const cell = (el as HTMLElement).closest?.('[data-cell-col][data-cell-row]') as HTMLElement | null
      if (!cell) continue
      const col = Number(cell.dataset.cellCol)
      const row = Number(cell.dataset.cellRow)
      if (Number.isFinite(col) && Number.isFinite(row) && canUse(col, row)) {
        return { col, row }
      }
    }
  }

  // 2) 最近可建造格：半径约 1.15 格，手指不必精确对准中心
  if (!mapRoot) return null
  const cells = mapRoot.querySelectorAll<HTMLElement>('[data-cell-col][data-cell-row]')
  let best: { col: number; row: number } | null = null
  let bestDist = Infinity

  for (const cell of cells) {
    const col = Number(cell.dataset.cellCol)
    const row = Number(cell.dataset.cellRow)
    if (!Number.isFinite(col) || !Number.isFinite(row) || !canUse(col, row)) continue

    const rect = cell.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dist = Math.hypot(clientX - cx, clientY - cy)
    const reach = Math.max(rect.width, rect.height) * 1.35
    if (dist <= reach && dist < bestDist) {
      bestDist = dist
      best = { col, row }
    }
  }

  return best
}
