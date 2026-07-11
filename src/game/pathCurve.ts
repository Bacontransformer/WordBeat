import type { Point } from './types'

export type Vec2 = { x: number; y: number }

function cellCenter(p: Point): Vec2 {
  return { x: p.x + 0.5, y: p.y + 0.5 }
}

/** Catmull-Rom spline sample between p1→p2 */
export function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

function pointAt(centers: Vec2[], index: number): Vec2 {
  if (index < 0) return centers[0]
  if (index >= centers.length) return centers[centers.length - 1]
  return centers[index]
}

/**
 * Turn orthogonal grid path into softer float waypoints by chamfering corners
 * and adding a slight outward sway on long straights.
 */
export function buildSmoothWaypoints(path: Point[], chamfer = 0.42): Vec2[] {
  if (path.length === 0) return []
  const raw = path.map(cellCenter)
  if (raw.length < 3) return raw

  const out: Vec2[] = [raw[0]]

  for (let i = 1; i < raw.length - 1; i += 1) {
    const prev = raw[i - 1]
    const cur = raw[i]
    const next = raw[i + 1]
    const inDx = Math.sign(cur.x - prev.x)
    const inDy = Math.sign(cur.y - prev.y)
    const outDx = Math.sign(next.x - cur.x)
    const outDy = Math.sign(next.y - cur.y)
    const isCorner = inDx !== outDx || inDy !== outDy

    if (isCorner) {
      out.push({
        x: cur.x - inDx * chamfer,
        y: cur.y - inDy * chamfer,
      })
      const turn = inDx * outDy - inDy * outDx
      const bulge = 0.22 * Math.sign(turn || 1)
      out.push({
        x: cur.x + (-inDy + outDy) * bulge * 0.5,
        y: cur.y + (inDx - outDx) * bulge * 0.5,
      })
      out.push({
        x: cur.x + outDx * chamfer,
        y: cur.y + outDy * chamfer,
      })
    } else {
      const wave = i % 2 === 0 ? 0.12 : -0.12
      const nx = -inDy
      const ny = inDx
      out.push({
        x: cur.x + nx * wave,
        y: cur.y + ny * wave,
      })
    }
  }

  out.push(raw[raw.length - 1])
  return out
}

function segmentCount(path: Point[]): number {
  return Math.max(1, path.length - 1)
}

/** Map progress [0, path.length-1] onto smooth waypoint polyline length */
function progressToWaypointT(path: Point[], progress: number, waypoints: Vec2[]): number {
  const max = segmentCount(path)
  const clamped = Math.max(0, Math.min(max, progress))
  const ratio = clamped / max
  return ratio * (waypoints.length - 1)
}

/** Smooth position along grid waypoints. progress ∈ [0, path.length-1] */
export function curvedPositionOnPath(
  path: Point[],
  progress: number,
): { x: number; y: number; finished: boolean; angle: number } {
  if (path.length === 0) return { x: 0, y: 0, finished: true, angle: 0 }
  const waypoints = buildSmoothWaypoints(path)
  const maxGrid = segmentCount(path)

  if (progress >= maxGrid) {
    const last = waypoints[waypoints.length - 1]
    const prev = waypoints[Math.max(0, waypoints.length - 2)]
    return {
      x: last.x,
      y: last.y,
      finished: true,
      angle: Math.atan2(last.y - prev.y, last.x - prev.x),
    }
  }
  if (progress <= 0) {
    const a = waypoints[0]
    const b = waypoints[Math.min(1, waypoints.length - 1)]
    return {
      x: a.x,
      y: a.y,
      finished: false,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    }
  }

  const wt = progressToWaypointT(path, progress, waypoints)
  const i = Math.floor(wt)
  const t = wt - i
  const p0 = pointAt(waypoints, i - 1)
  const p1 = pointAt(waypoints, i)
  const p2 = pointAt(waypoints, i + 1)
  const p3 = pointAt(waypoints, i + 2)
  const pos = catmullRom(p0, p1, p2, p3, t)
  const ahead = catmullRom(p0, p1, p2, p3, Math.min(1, t + 0.05))
  return {
    x: pos.x,
    y: pos.y,
    finished: false,
    angle: Math.atan2(ahead.y - pos.y, ahead.x - pos.x),
  }
}

/** Convert path into SVG cubic ribbon (viewBox = cols x rows units). */
export function pathToSmoothSvgD(path: Point[]): string {
  const centers = buildSmoothWaypoints(path)
  if (centers.length === 0) return ''
  if (centers.length === 1) {
    return `M ${centers[0].x} ${centers[0].y}`
  }

  const parts: string[] = [`M ${centers[0].x} ${centers[0].y}`]

  for (let i = 0; i < centers.length - 1; i += 1) {
    const p0 = pointAt(centers, i - 1)
    const p1 = pointAt(centers, i)
    const p2 = pointAt(centers, i + 1)
    const p3 = pointAt(centers, i + 2)
    const c1x = p1.x + (p2.x - p0.x) / 3.2
    const c1y = p1.y + (p2.y - p0.y) / 3.2
    const c2x = p2.x - (p3.x - p1.x) / 3.2
    const c2y = p2.y - (p3.y - p1.y) / 3.2
    parts.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`)
  }

  return parts.join(' ')
}
