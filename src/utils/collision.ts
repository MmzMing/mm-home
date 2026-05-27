import type { GridPosition } from '../types'
import defaults from '../config/defaults.json'

export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function gridDistance(p1: GridPosition, p2: GridPosition): number {
  const dx = p2.col - p1.col
  const dy = p2.row - p1.row
  return Math.sqrt(dx * dx + dy * dy)
}

export function checkCollision(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  radius: number
): { preFusion: boolean; fusion: boolean } {
  const dist = distance(pos1, pos2)
  const radiusSum = radius * 2

  return {
    preFusion: dist <= radiusSum * defaults.fusion.preFusionDistance,
    fusion: dist <= radiusSum * defaults.fusion.fusionDistance,
  }
}

/**
 * Hit-test for group shapes (capsule/card).
 * Checks if `pos` is within the shape's bounding box plus `padding` pixels.
 * `center` is the center of the shape, `halfW`/`halfH` are half the shape's dimensions.
 */
export function hitTestGroup(
  pos: { x: number; y: number },
  center: { x: number; y: number },
  halfW: number,
  halfH: number,
  padding: number
): boolean {
  return (
    pos.x >= center.x - halfW - padding &&
    pos.x <= center.x + halfW + padding &&
    pos.y >= center.y - halfH - padding &&
    pos.y <= center.y + halfH + padding
  )
}

export function isOccupied(
  positions: Record<string, GridPosition>,
  target: GridPosition,
  excludeId?: string
): boolean {
  for (const [id, pos] of Object.entries(positions)) {
    if (id === excludeId) continue
    if (pos.row === target.row && pos.col === target.col) {
      return true
    }
  }
  return false
}

export function findNearestFree(
  positions: Record<string, GridPosition>,
  target: GridPosition,
  cols: number,
  excludeId?: string
): GridPosition {
  if (!isOccupied(positions, target, excludeId)) {
    return target
  }

  // Search outward in expanding squares
  for (let radius = 1; radius < 20; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue
        const candidate: GridPosition = {
          row: target.row + dr,
          col: ((target.col + dc) % cols + cols) % cols,
        }
        if (candidate.row >= 0 && !isOccupied(positions, candidate, excludeId)) {
          return candidate
        }
      }
    }
  }

  return target
}
