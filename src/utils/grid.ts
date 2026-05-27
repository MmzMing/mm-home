import defaults from '../config/defaults.json'
import type { GridPosition } from '../types'

export interface ResponsiveConfig {
  cellSize: number
  cols: number
  gap: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  dockScale: number
}

export function getResponsiveConfig(width: number = window.innerWidth): ResponsiveConfig {
  const gap = defaults.grid.gap
  if (width < 360) {
    return { cellSize: 56, cols: 3, gap, isMobile: true, isTablet: false, isDesktop: false, dockScale: 0.7 }
  }
  if (width < 480) {
    return { cellSize: 60, cols: 4, gap, isMobile: true, isTablet: false, isDesktop: false, dockScale: 0.75 }
  }
  if (width < 768) {
    return { cellSize: 68, cols: 5, gap, isMobile: false, isTablet: true, isDesktop: false, dockScale: 0.85 }
  }
  if (width < 1024) {
    return { cellSize: 72, cols: 6, gap, isMobile: false, isTablet: true, isDesktop: false, dockScale: 1 }
  }
  return { cellSize: 72, cols: 8, gap, isMobile: false, isTablet: false, isDesktop: true, dockScale: 1 }
}

export function getGridColumns(): number {
  return getResponsiveConfig().cols
}

/** Pixel offset of a cell's top-left corner (includes gap stride) */
export function cellOffset(pos: GridPosition, cellSize: number, gap: number): { x: number; y: number } {
  const stride = cellSize + gap
  return { x: pos.col * stride, y: pos.row * stride }
}

/** Center of a cell in pixels */
export function gridToPixel(pos: GridPosition, cellSize: number, gap: number): { x: number; y: number } {
  const stride = cellSize + gap
  return {
    x: pos.col * stride + cellSize / 2,
    y: pos.row * stride + cellSize / 2,
  }
}

export function pixelToGrid(
  x: number,
  y: number,
  cellSize: number,
  gap: number,
  cols: number
): GridPosition {
  const stride = cellSize + gap
  const col = Math.round((x - cellSize / 2) / stride)
  const row = Math.round((y - cellSize / 2) / stride)
  return {
    row: Math.max(0, row),
    col: Math.max(0, Math.min(col, cols - 1)),
  }
}

export function getGridAreaDimensions(cols: number, rows: number, cellSize: number, gap: number) {
  const stride = cellSize + gap
  return {
    width: cols * stride - gap,
    height: rows * stride - gap,
  }
}
