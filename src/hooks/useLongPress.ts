import { useRef, useCallback } from 'react'

interface UseLongPressOptions {
  delay?: number
  onStart?: (e: PointerEvent) => void
  onLongPress?: (e: PointerEvent) => void
  onCancel?: () => void
}

export function useLongPress({
  delay = 300,
  onStart,
  onLongPress,
  onCancel,
}: UseLongPressOptions = {}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const triggeredRef = useRef(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY }
      triggeredRef.current = false
      onStart?.(e.nativeEvent)

      timerRef.current = setTimeout(() => {
        triggeredRef.current = true
        onLongPress?.(e.nativeEvent)
      }, delay)
    },
    [delay, onStart, onLongPress]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current) return
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Cancel long press if moved too far
      if (dist > 10) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        onCancel?.()
      }
    },
    [onCancel]
  )

  const handlePointerUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    isLongPress: triggeredRef.current,
  }
}
