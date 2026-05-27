import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react'

const BAR_H = 32
const PANEL_H = 460
const DRAG_THRESHOLD = 8
const OPEN_DRAG_THRESHOLD = 60

export default function StatusBar() {
  const [now, setNow] = useState(new Date())
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const rawY = useMotionValue(-PANEL_H)
  const y = useSpring(rawY, { stiffness: 380, damping: 32 })
  const startYRef = useRef(0)
  const startMotionRef = useRef(0)
  const movedRef = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const open = useCallback(() => {
    rawY.set(0)
    setIsOpen(true)
  }, [rawY])

  const close = useCallback(() => {
    rawY.set(-PANEL_H)
    setIsOpen(false)
  }, [rawY])

  const toggle = useCallback(() => {
    if (isOpen) close()
    else open()
  }, [isOpen, open, close])

  // -- Pointer gesture: drag or click --
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    movedRef.current = false
    startYRef.current = e.clientY
    startMotionRef.current = rawY.get()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [rawY])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const delta = e.clientY - startYRef.current
    if (Math.abs(delta) > DRAG_THRESHOLD) movedRef.current = true
    const next = Math.min(0, Math.max(-PANEL_H, startMotionRef.current + delta))
    rawY.set(next)
  }, [isDragging, rawY])

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (!movedRef.current) {
      toggle()
      return
    }

    const current = rawY.get()
    if (current > -PANEL_H + OPEN_DRAG_THRESHOLD) {
      rawY.set(0)
      setIsOpen(true)
    } else {
      rawY.set(-PANEL_H)
      setIsOpen(false)
    }
  }, [isDragging, rawY, toggle])

  const glassStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
  }

  const cardStyle: React.CSSProperties = {
    borderRadius: 16,
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(16px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)',
  }

  return (
    <>
      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0"
            style={{ zIndex: 20000, background: 'rgba(0,0,0,0.25)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={close}
          />
        )}
      </AnimatePresence>

      {/* ── Status bar: fixed at top ── */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-5 select-none"
        style={{
          height: BAR_H,
          zIndex: 20002,
          ...glassStyle,
          borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
          cursor: 'pointer',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Left: Apple logo + app name */}
        <div className="flex items-center gap-2">
          <svg width="14" height="16" viewBox="0 0 14 17" fill="rgba(0,0,0,0.8)">
            <path d="M13.1 12.1c-.3.6-.6 1.2-1 1.7-.6.8-1.1 1.3-1.6 1.6-.7.4-1.4.7-2.2.7-.6 0-1.2-.2-2-.5-.8-.3-1.5-.5-2.1-.5-.6 0-1.3.2-2.1.5-.8.3-1.4.5-1.8.5-.8 0-1.5-.3-2.2-.7C.9 14.8.5 14.3.2 13.6c-.4-.8-.7-1.7-.9-2.8-.2-1.2-.3-2.3-.3-3.3 0-1.2.3-2.2.8-3 .4-.7 1-1.3 1.7-1.7.7-.4 1.5-.6 2.3-.6.7 0 1.4.2 2.2.6.8.4 1.3.6 1.5.6.2 0 .7-.2 1.6-.6.9-.4 1.6-.6 2.3-.6 1.6 0 2.9.6 3.8 1.7-1.5.9-2.3 2.2-2.2 3.8 0 1.3.5 2.3 1.4 3.2.4.4.9.7 1.4.9-.1.3-.2.6-.4.9zM10 .3c0 1-.4 2-1.1 2.8-.8 1-1.8 1.6-2.9 1.5 0-.1 0-.2 0-.3 0-1 .4-2 1.2-2.8.4-.4.8-.7 1.4-1 .6-.3 1.1-.4 1.5-.4 0 .1 0 .2 0 .3z" />
          </svg>
          <span className="text-[13px] font-semibold text-black/80 tracking-tight">Workspace</span>
        </div>

        {/* Right: status icons + date + time */}
        <div className="flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="rgba(0,0,0,0.7)" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="w-[22px] h-[11px] rounded-[3px] border border-black/40 flex items-center p-[1.5px]">
              <div className="h-full rounded-[1.5px] bg-black/60" style={{ width: '78%' }} />
            </div>
            <div className="w-[1.5px] h-[5px] rounded-r-sm bg-black/40" />
          </div>
          <div className="w-px h-3.5 bg-black/12" />
          <span className="text-[12px] text-black/70 tabular-nums">{formatDate(now)}</span>
          <span className="text-[12px] font-medium text-black/80 tabular-nums">{formatTime(now)}</span>
        </div>
      </div>

      {/* ── Panel area: transparent container from bar bottom, no gap ── */}
      <motion.div
        className="fixed left-0 right-0"
        style={{
          zIndex: 20001,
          top: BAR_H,
          y,
          height: PANEL_H,
          touchAction: 'none',
          cursor: 'pointer',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Visible glass card */}
        <div
          className="h-full overflow-hidden"
          style={{
            margin: '0 10px',
            borderRadius: 24,
            ...glassStyle,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1) inset, 0 8px 40px rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div className="w-full h-full overflow-y-auto" style={{ padding: '20px 14px 16px' }}>
            <div className="flex flex-col gap-2.5">
              <div className="px-1 pb-1 text-[13px] font-semibold text-black/50 tracking-tight">通知中心</div>

              <div style={cardStyle}>
                <div className="text-[13px] text-black/60">暂无新通知</div>
              </div>

              <div className="flex gap-2.5">
                {['Wi-Fi', '蓝牙', '飞行模式'].map((t) => (
                  <div key={t} className="flex-1" style={{ ...cardStyle, padding: '14px 0', textAlign: 'center' }}>
                    <span className="text-[12px] font-medium text-black/70">{t}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2.5">
                {['手电筒', '计算器', '相机'].map((t) => (
                  <div key={t} className="flex-1" style={{ ...cardStyle, padding: '14px 0', textAlign: 'center' }}>
                    <span className="text-[12px] font-medium text-black/70">{t}</span>
                  </div>
                ))}
              </div>

              <div style={cardStyle}>
                <div className="text-[12px] text-black/45 mb-2.5">亮度</div>
                <div className="h-[7px] rounded-full bg-black/8">
                  <div className="h-full rounded-full bg-black/40" style={{ width: '75%' }} />
                </div>
              </div>

              <div style={cardStyle}>
                <div className="text-[12px] text-black/45 mb-2.5">音量</div>
                <div className="h-[7px] rounded-full bg-black/8">
                  <div className="h-full rounded-full bg-black/40" style={{ width: '50%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
