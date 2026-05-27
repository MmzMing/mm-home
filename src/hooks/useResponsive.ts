import { useSyncExternalStore } from 'react'
import { getResponsiveConfig, type ResponsiveConfig } from '../utils/grid'

let cached: ResponsiveConfig = getResponsiveConfig()
let listeners: Array<() => void> = []

function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

function getSnapshot() {
  return cached
}

let resizeTimer = 0
function onResize() {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    const next = getResponsiveConfig()
    if (next.cellSize !== cached.cellSize || next.cols !== cached.cols) {
      cached = next
      listeners.forEach((l) => l())
    }
  }, 100)
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
}

export function useResponsive(): ResponsiveConfig {
  return useSyncExternalStore(subscribe, getSnapshot)
}
