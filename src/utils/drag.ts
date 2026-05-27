interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function clampHard(valueX: number, valueY: number, bounds: Bounds) {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, valueX)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, valueY)),
  }
}

export function clampElastic(valueX: number, valueY: number, bounds: Bounds) {
  const BOUNCE_ELASTIC = 0.12
  const MAX_OVERSHOOT = 12
  const hard = clampHard(valueX, valueY, bounds)
  const overshootX = valueX - hard.x
  const overshootY = valueY - hard.y
  return {
    x: hard.x + Math.max(-MAX_OVERSHOOT, Math.min(MAX_OVERSHOOT, overshootX * BOUNCE_ELASTIC)),
    y: hard.y + Math.max(-MAX_OVERSHOOT, Math.min(MAX_OVERSHOOT, overshootY * BOUNCE_ELASTIC)),
  }
}

export function offsetToPage(
  offsetX: number,
  offsetY: number,
  containerLeft: number,
  containerTop: number,
  gridX: number,
  gridY: number,
  cellSize: number,
) {
  return {
    x: containerLeft + gridX + offsetX + cellSize / 2,
    y: containerTop + gridY + offsetY + cellSize / 2,
  }
}

export function computeBounds(
  containerLeft: number,
  containerTop: number,
  gridX: number,
  gridY: number,
  cellSize: number,
): Bounds {
  return {
    minX: -containerLeft - gridX,
    maxX: window.innerWidth - cellSize - containerLeft - gridX,
    minY: -containerTop - gridY,
    maxY: window.innerHeight - cellSize - containerTop - gridY,
  }
}

