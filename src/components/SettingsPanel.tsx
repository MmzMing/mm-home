import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useStore } from '../store/useStore'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorX?: number | null
}

const wallpapers = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
]

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, anchorX }) => {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)

  const PANEL_W = 384
  const MARGIN = 16

  const clampedLeft = useMemo(() => {
    if (anchorX == null) return '50%'
    const half = PANEL_W / 2
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const clamped = Math.max(half + MARGIN, Math.min(anchorX, vw - half - MARGIN))
    return clamped
  }, [anchorX])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel - Windows 11 style flyout anchored above settings icon */}
          <motion.div
            className="fixed z-50 bottom-[140px] w-96 max-w-[90vw]"
            style={{ left: clampedLeft, x: '-50%' }}
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Frosted glass container - outer: background + padding */}
            <div
              className="rounded-2xl border border-white/20 shadow-2xl"
              style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(40px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.1) inset, 0 8px 40px rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.15)',
              }}
            >
              {/* Inner: scrollable content area */}
              <div className="flex flex-col max-h-[70vh] overflow-y-auto gap-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-2">
                  <h2 className="text-base font-semibold text-black/90 tracking-tight">Settings</h2>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-black/8 hover:bg-black/15 flex items-center justify-center transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1 1L13 13M1 13L13 1"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="h-px bg-black/8" />

                {/* Show App Labels */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-black/85">Show App Labels</span>
                    <span className="text-xs text-black/45">Display app names below icons</span>
                  </div>
                  <button
                    onClick={() => updateSettings({ showLabels: !settings.showLabels })}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      settings.showLabels ? 'bg-blue-500' : 'bg-black/15'
                    }`}
                  >
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                      animate={{ left: settings.showLabels ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="h-px bg-black/8" />

                {/* Overlay Opacity */}
                <div className="py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-black/85">Overlay Opacity</span>
                      <span className="text-xs text-black/45">Dark overlay intensity</span>
                    </div>
                    <span className="text-xs text-black/50 tabular-nums flex-shrink-0">{Math.round(settings.overlayOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.overlayOpacity * 100}
                    onChange={(e) =>
                      updateSettings({ overlayOpacity: Number(e.target.value) / 100 })
                    }
                    className="w-full h-1 bg-black/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                <div className="h-px bg-black/8" />

                {/* Wallpaper */}
                <div className="py-2">
                  <span className="text-sm font-medium text-black/85 block mb-3">Wallpaper</span>
                  <div className="grid grid-cols-3 gap-2">
                    {wallpapers.map((wp) => (
                      <button
                        key={wp}
                        onClick={() => updateSettings({ wallpaper: wp })}
                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          settings.wallpaper === wp
                            ? 'border-blue-500 ring-1 ring-blue-500/30'
                            : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        <img
                          src={wp}
                          alt="Wallpaper"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-black/8" />

                {/* Reset */}
                <button
                  onClick={() => {
                    localStorage.removeItem('apple-workspace-state')
                    window.location.reload()
                  }}
                  className="w-full py-2.5 rounded-lg bg-red-500/8 text-red-500/80 text-sm font-medium hover:bg-red-500/15 hover:text-red-500 transition-colors"
                >
                  Reset All Settings
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SettingsPanel
