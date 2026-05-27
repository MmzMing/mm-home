import { useState, useCallback, useRef, useEffect } from 'react'
import defaults from '../config/defaults.json'

export type FusionPhase = 'idle' | 'approaching' | 'merging' | 'complete'

export interface FusionState {
  phase: FusionPhase
  sourceId: string | null
  targetId: string | null
  /** Viewport coordinates (for position:fixed overlay) */
  sourcePos: { x: number; y: number }
  targetPos: { x: number; y: number }
  progress: number
}

const initial: FusionState = {
  phase: 'idle',
  sourceId: null,
  targetId: null,
  sourcePos: { x: 0, y: 0 },
  targetPos: { x: 0, y: 0 },
  progress: 0,
}

export function useFusion() {
  const [state, setState] = useState<FusionState>(initial)
  const rafRef = useRef<number>(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const startApproaching = useCallback(
    (sourceId: string, targetId: string, sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setState({ phase: 'approaching', sourceId, targetId, sourcePos, targetPos, progress: 0 })

      const start = performance.now()
      const duration = defaults.animation.preFusionDuration

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        setState((s) => ({ ...s, progress: t }))
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    []
  )

  const startMerging = useCallback(
    (sourceId: string, targetId: string, sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setState({ phase: 'merging', sourceId, targetId, sourcePos, targetPos, progress: 0 })

      const start = performance.now()
      const duration = defaults.animation.fusionDuration

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        // Ease-out for smooth liquid feel
        const eased = 1 - Math.pow(1 - t, 2)
        setState((s) => ({ ...s, progress: eased }))
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
        // Stay in 'merging' phase — overlay stays visible until reset() is called
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    []
  )

  /** Update source position during drag (for real-time tracking) */
  const updateSourcePos = useCallback((pos: { x: number; y: number }) => {
    setState((s) => {
      if (s.phase === 'idle' || s.phase === 'complete') return s
      return { ...s, sourcePos: pos }
    })
  }, [])

  const complete = useCallback(() => {
    setState((s) => ({ ...s, phase: 'complete', progress: 1 }))
  }, [])

  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    setState(initial)
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return {
    state,
    startApproaching,
    startMerging,
    updateSourcePos,
    complete,
    reset,
    isActive: state.phase !== 'idle' && state.phase !== 'complete',
    isMerging: state.phase === 'merging',
  }
}
