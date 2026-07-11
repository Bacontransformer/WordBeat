import type { Point } from './types'

/** Buildable cells are adjacent to the path and not on the path. */
export function neighborsOfPath(path: Point[], cols: number, rows: number): Point[] {
  const pathSet = new Set(path.map((p) => `${p.x},${p.y}`))
  const build = new Map<string, Point>()
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]

  for (const cell of path) {
    for (const [dx, dy] of dirs) {
      const x = cell.x + dx
      const y = cell.y + dy
      const key = `${x},${y}`
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue
      if (pathSet.has(key)) continue
      build.set(key, { x, y })
    }
  }
  return [...build.values()]
}
