import type { GridPosition } from '../types'

const TWO_PI = Math.PI * 2

export function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx},${cy + r} A ${r},${r} 0 1,1 ${cx},${cy - r} Z`
}

export function capsulePath(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): string {
  // Calculate the angle between centers
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx)
  const perpAngle = angle + Math.PI / 2

  // Tangent points on circle 1
  const t1x1 = x1 + r1 * Math.cos(perpAngle)
  const t1y1 = y1 + r1 * Math.sin(perpAngle)
  const t1x2 = x1 - r1 * Math.cos(perpAngle)
  const t1y2 = y1 - r1 * Math.sin(perpAngle)

  // Tangent points on circle 2
  const t2x1 = x2 + r2 * Math.cos(perpAngle)
  const t2y1 = y2 + r2 * Math.sin(perpAngle)
  const t2x2 = x2 - r2 * Math.cos(perpAngle)
  const t2y2 = y2 - r2 * Math.sin(perpAngle)

  // Arc flags
  const largeArc1 = 1
  const largeArc2 = 1

  return [
    `M ${t1x1},${t1y1}`,
    `A ${r1},${r1} 0 ${largeArc1} 1 ${t1x2},${t1y2}`,
    `L ${t2x2},${t2y2}`,
    `A ${r2},${r2} 0 ${largeArc2} 1 ${t2x1},${t2y1}`,
    'Z',
  ].join(' ')
}

export function hourglassPath(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
  pinch: number
): string {
  // pinch: 0 = two circles, 1 = fully merged capsule
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx)
  const perpAngle = angle + Math.PI / 2
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // Tangent points
  const t1x1 = x1 + r1 * Math.cos(perpAngle)
  const t1y1 = y1 + r1 * Math.sin(perpAngle)
  const t1x2 = x1 - r1 * Math.cos(perpAngle)
  const t1y2 = y1 - r1 * Math.sin(perpAngle)
  const t2x1 = x2 + r2 * Math.cos(perpAngle)
  const t2y1 = y2 + r2 * Math.sin(perpAngle)
  const t2x2 = x2 - r2 * Math.cos(perpAngle)
  const t2y2 = y2 - r2 * Math.sin(perpAngle)

  // Control points for S-curves (pinch inward based on pinch factor)
  const inwardOffset = (1 - pinch) * Math.min(r1, r2) * 0.6

  // S-curve from circle1 top to circle2 top
  const cp1x = midX + inwardOffset * Math.cos(perpAngle)
  const cp1y = midY + inwardOffset * Math.sin(perpAngle)
  const cp2x = midX - inwardOffset * Math.cos(perpAngle)
  const cp2y = midY - inwardOffset * Math.sin(perpAngle)

  return [
    `M ${t1x1},${t1y1}`,
    `A ${r1},${r1} 0 1 1 ${t1x2},${t1y2}`,
    `C ${t1x2 + (cp2x - t1x2) * 0.5},${t1y2 + (cp2y - t1y2) * 0.5} ${t2x2 + (cp2x - t2x2) * 0.5},${t2y2 + (cp2y - t2y2) * 0.5} ${t2x2},${t2y2}`,
    `A ${r2},${r2} 0 1 1 ${t2x1},${t2y1}`,
    `C ${t2x1 + (cp1x - t2x1) * 0.5},${t2y1 + (cp1y - t2y1) * 0.5} ${t1x1 + (cp1x - t1x1) * 0.5},${t1y1 + (cp1y - t1y1) * 0.5} ${t1x1},${t1y1}`,
    'Z',
  ].join(' ')
}

export function cardPath(
  cx: number,
  cy: number,
  width: number,
  height: number,
  radius: number
): string {
  const x = cx - width / 2
  const y = cy - height / 2
  const r = Math.min(radius, width / 2, height / 2)

  return [
    `M ${x + r},${y}`,
    `L ${x + width - r},${y}`,
    `A ${r},${r} 0 0 1 ${x + width},${y + r}`,
    `L ${x + width},${y + height - r}`,
    `A ${r},${r} 0 0 1 ${x + width - r},${y + height}`,
    `L ${x + r},${y + height}`,
    `A ${r},${r} 0 0 1 ${x},${y + height - r}`,
    `L ${x},${y + r}`,
    `A ${r},${r} 0 0 1 ${x + r},${y}`,
    'Z',
  ].join(' ')
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpPosition(
  a: GridPosition,
  b: GridPosition,
  t: number
): GridPosition {
  return {
    row: Math.round(lerp(a.row, b.row, t)),
    col: Math.round(lerp(a.col, b.col, t)),
  }
}
