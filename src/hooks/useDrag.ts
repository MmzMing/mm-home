import { useRef, useState, useCallback, useEffect } from 'react'
import { useMotionValue, type MotionValue } from 'motion/react'
import { clampElastic, computeBounds, offsetToPage } from '../utils/drag'

interface DragOptions {
  id: string
  gridX: number
  gridY: number
  cellSize: number
  containerLeft: number
  containerTop: number
  /** Enable throw physics on release. Default: false (for fusion groups). */
  enableThrow?: boolean
  onDragStart?: (id: string) => void
  onDragMove?: (id: string, point: { x: number; y: number }) => void
  onDragEnd?: (id: string, point: { x: number; y: number }) => void
  onClick?: (id: string) => void
}

interface DragResult {
  ref: React.RefObject<HTMLDivElement | null>
  x: MotionValue<number>
  y: MotionValue<number>
  isDragging: boolean
  handlers: { onPointerDown: (e: React.PointerEvent) => void }
}

const CLICK_THRESHOLD = 5
const FRICTION = 0.95
const BOUNCE_RATIO = 0.3
const STOP_THRESHOLD = 0.5

export function useDrag(options: DragOptions): DragResult {
  const {
    id, gridX, gridY, cellSize, containerLeft, containerTop,
    enableThrow = false,
    onDragStart, onDragMove, onDragEnd, onClick,
  } = options

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const ref = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const didMove = useRef(false)
  const offsetRef = useRef({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const rawSamples = useRef<{ x: number; y: number; t: number }[]>([])
  const throwRaf = useRef(0)

  const bounds = computeBounds(containerLeft, containerTop, gridX, gridY, cellSize)
  const boundsRef = useRef(bounds)
  boundsRef.current = bounds

  const optsRef = useRef({ containerLeft, containerTop, gridX, gridY, cellSize })
  optsRef.current = { containerLeft, containerTop, gridX, gridY, cellSize }

  const onDragEndRef = useRef(onDragEnd)
  onDragEndRef.current = onDragEnd
  const onDragMoveRef = useRef(onDragMove)
  onDragMoveRef.current = onDragMove
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick
  const idRef = useRef(id)
  idRef.current = id
  const enableThrowRef = useRef(enableThrow)
  enableThrowRef.current = enableThrow

  const stopThrow = useCallback(() => {
    if (throwRaf.current) {
      cancelAnimationFrame(throwRaf.current)
      throwRaf.current = 0
    }
  }, [])

  const startThrow = useCallback((vx: number, vy: number) => {
    stopThrow()

    const tick = () => {
      vx *= FRICTION
      vy *= FRICTION

      let nx = x.get() + vx
      let ny = y.get() + vy

      const b = boundsRef.current
      if (nx < b.minX) { nx = b.minX; vx = -vx * BOUNCE_RATIO }
      else if (nx > b.maxX) { nx = b.maxX; vx = -vx * BOUNCE_RATIO }
      if (ny < b.minY) { ny = b.minY; vy = -vy * BOUNCE_RATIO }
      else if (ny > b.maxY) { ny = b.maxY; vy = -vy * BOUNCE_RATIO }

      x.set(nx)
      y.set(ny)

      if (Math.abs(vx) + Math.abs(vy) < STOP_THRESHOLD) {
        throwRaf.current = 0
        const opts = optsRef.current
        const pagePoint = offsetToPage(
          nx, ny,
          opts.containerLeft, opts.containerTop,
          opts.gridX, opts.gridY, opts.cellSize,
        )
        onDragEndRef.current?.(idRef.current, pagePoint)
        return
      }

      throwRaf.current = requestAnimationFrame(tick)
    }

    throwRaf.current = requestAnimationFrame(tick)
  }, [x, y, stopThrow])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current
      if (!el) return

      stopThrow()
      el.setPointerCapture(e.pointerId)

      const rect = el.getBoundingClientRect()
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      isDraggingRef.current = true
      didMove.current = false
      rawSamples.current = []
      setDragging(true)
      onDragStart?.(id)
    },
    [id, onDragStart, stopThrow],
  )

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return

      const opts = optsRef.current
      const nx = e.clientX - opts.containerLeft - opts.gridX - offsetRef.current.x
      const ny = e.clientY - opts.containerTop - opts.gridY - offsetRef.current.y
      const clamped = clampElastic(nx, ny, boundsRef.current)

      if (Math.abs(nx) > CLICK_THRESHOLD || Math.abs(ny) > CLICK_THRESHOLD) {
        didMove.current = true
      }

      x.set(clamped.x)
      y.set(clamped.y)

      rawSamples.current.push({ x: nx, y: ny, t: performance.now() })
      if (rawSamples.current.length > 5) rawSamples.current.shift()

      if (didMove.current) {
        const pagePoint = offsetToPage(
          clamped.x, clamped.y,
          opts.containerLeft, opts.containerTop,
          opts.gridX, opts.gridY, opts.cellSize,
        )
        onDragMoveRef.current?.(idRef.current, pagePoint)
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setDragging(false)

      const el = ref.current
      if (el) {
        try { el.releasePointerCapture(e.pointerId) } catch {}
      }

      if (!didMove.current) {
        onClickRef.current?.(idRef.current)
        x.set(0)
        y.set(0)
        return
      }

      if (enableThrowRef.current) {
        // Throw physics: friction-based inertia from raw velocity
        const samples = rawSamples.current
        if (samples.length >= 2) {
          const last = samples[samples.length - 1]
          const first = samples[0]
          const dt = Math.max(last.t - first.t, 1)
          let vx = ((last.x - first.x) / dt) * 16
          let vy = ((last.y - first.y) / dt) * 16
          const mag = Math.sqrt(vx * vx + vy * vy)
          const maxSpeed = 30
          if (mag > maxSpeed) {
            vx = (vx / mag) * maxSpeed
            vy = (vy / mag) * maxSpeed
          }
          startThrow(vx, vy)
        } else {
          // No velocity data, just snap
          const opts = optsRef.current
          const pagePoint = offsetToPage(
            x.get(), y.get(),
            opts.containerLeft, opts.containerTop,
            opts.gridX, opts.gridY, opts.cellSize,
          )
          onDragEndRef.current?.(idRef.current, pagePoint)
        }
      } else {
        // No throw: pass final position directly
        const opts = optsRef.current
        const pagePoint = offsetToPage(
          x.get(), y.get(),
          opts.containerLeft, opts.containerTop,
          opts.gridX, opts.gridY, opts.cellSize,
        )
        onDragEndRef.current?.(idRef.current, pagePoint)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [x, y, startThrow])

  // Reset when grid position changes externally
  useEffect(() => {
    if (!isDraggingRef.current && !throwRaf.current) {
      x.set(0)
      y.set(0)
    }
  }, [gridX, gridY, x, y])

  // Cleanup on unmount
  useEffect(() => () => stopThrow(), [stopThrow])

  return {
    ref,
    x,
    y,
    isDragging: dragging,
    handlers: { onPointerDown },
  }
}
