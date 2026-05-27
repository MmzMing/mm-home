import { useState, useCallback, useRef, useEffect } from 'react'
import { circlePath, hourglassPath, capsulePath, lerp } from '../utils/svgPath'
import defaults from '../config/defaults.json'

export interface FusionAnimState {
  phase: 'idle' | 'pre-fusion' | 'fusion' | 'stable' | 'separating'
  progress: number
  sourceId: string | null
  targetId: string | null
  sourcePos: { x: number; y: number }
  targetPos: { x: number; y: number }
}

const initial: FusionAnimState = {
  phase: 'idle',
  progress: 0,
  sourceId: null,
  targetId: null,
  sourcePos: { x: 0, y: 0 },
  targetPos: { x: 0, y: 0 },
}

export function useFusionAnimation() {
  const [state, setState] = useState<FusionAnimState>(initial)
  const animRef = useRef<number | null>(null)

  const startPreFusion = useCallback(
    (sourceId: string, targetId: string, sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      setState({ phase: 'pre-fusion', progress: 0, sourceId, targetId, sourcePos, targetPos })

      const start = performance.now()
      const duration = defaults.animation.preFusionDuration

      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        setState((s) => ({ ...s, progress: t }))

        if (t < 1) {
          animRef.current = requestAnimationFrame(tick)
        }
      }
      animRef.current = requestAnimationFrame(tick)
    },
    []
  )

  const startFusion = useCallback(
    (sourceId: string, targetId: string, sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      setState({ phase: 'fusion', progress: 0, sourceId, targetId, sourcePos, targetPos })

      const start = performance.now()
      const duration = defaults.animation.fusionDuration

      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)

        // cubic-bezier(0.34, 1.56, 0.64, 1) approximation
        const eased = t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2

        setState((s) => ({ ...s, progress: Math.min(eased, 1) }))

        if (t < 1) {
          animRef.current = requestAnimationFrame(tick)
        } else {
          // Transition to stable
          setState((s) => ({ ...s, phase: 'stable', progress: 1 }))
        }
      }
      animRef.current = requestAnimationFrame(tick)
    },
    []
  )

  const startSeparation = useCallback(
    (sourceId: string, sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      setState({ phase: 'separating', progress: 0, sourceId, targetId: null, sourcePos, targetPos })

      const start = performance.now()
      const duration = defaults.animation.separationDuration

      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
        setState((s) => ({ ...s, progress: eased }))

        if (t < 1) {
          animRef.current = requestAnimationFrame(tick)
        } else {
          reset()
        }
      }
      animRef.current = requestAnimationFrame(tick)
    },
    []
  )

  const reset = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    setState(initial)
  }, [])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  // Generate SVG path based on current animation state
  const getCurrentPath = useCallback(
    (radius: number): string => {
      const { phase, progress, sourcePos, targetPos } = state
      if (phase === 'idle') return ''

      const x1 = sourcePos.x
      const y1 = sourcePos.y
      const x2 = targetPos.x
      const y2 = targetPos.y

      switch (phase) {
        case 'pre-fusion': {
          // Two circles with slight bulge toward each other
          const bulge = progress * 0.3
          return hourglassPath(x1, y1, radius, x2, y2, radius, bulge)
        }
        case 'fusion': {
          // Hourglass morphing to capsule
          return hourglassPath(x1, y1, radius, x2, y2, radius, progress)
        }
        case 'stable': {
          return capsulePath(x1, y1, radius, x2, y2, radius)
        }
        case 'separating': {
          // Capsule stretching apart
          const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          const stretchedDist = dist * (1 + progress * 0.5)
          const angle = Math.atan2(y2 - y1, x2 - x1)
          const sx2 = x1 + stretchedDist * Math.cos(angle)
          const sy2 = y1 + stretchedDist * Math.sin(angle)
          const pinch = 1 - progress * 1.5
          return hourglassPath(x1, y1, radius, sx2, sy2, radius, Math.max(0, pinch))
        }
        default:
          return circlePath(x1, y1, radius)
      }
    },
    [state]
  )

  return {
    state,
    startPreFusion,
    startFusion,
    startSeparation,
    reset,
    getCurrentPath,
    isActive: state.phase !== 'idle',
  }
}
