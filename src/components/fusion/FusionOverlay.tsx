import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import AppIcon from '../AppIcon'
import type { AppConfig } from '../../types'
import type { FusionState } from '../../hooks/useFusion'

interface FusionOverlayProps {
  fusionState: FusionState
  sourceApp: AppConfig | null
  targetApp: AppConfig | null
  cellSize: number
}

/**
 * iOS 26 liquid glass fusion overlay.
 *
 * Renders two animated icons that merge with a gooey metaball SVG filter.
 * Coordinates are in viewport space (position: fixed).
 */
const FusionOverlay: React.FC<FusionOverlayProps> = ({ fusionState, sourceApp, targetApp, cellSize }) => {
  const { phase, sourcePos, targetPos, progress } = fusionState
  const iconSize = cellSize - 8
  const halfIcon = iconSize / 2
  const isVisible = phase !== 'idle' && phase !== 'complete'

  const sourceAnimPos = useMemo(() => {
    if (phase === 'approaching') {
      return {
        x: sourcePos.x + (targetPos.x - sourcePos.x) * progress * 0.4,
        y: sourcePos.y + (targetPos.y - sourcePos.y) * progress * 0.4,
      }
    }
    // Source moves to target position (target stays fixed)
    if (phase === 'merging') {
      return {
        x: sourcePos.x + (targetPos.x - sourcePos.x) * progress,
        y: sourcePos.y + (targetPos.y - sourcePos.y) * progress,
      }
    }
    return sourcePos
  }, [phase, progress, sourcePos, targetPos])

  // Target stays fixed at its position
  const targetAnimPos = targetPos

  const iconScale = useMemo(() => {
    if (phase === 'approaching') return 1 - progress * 0.08
    if (phase === 'merging') return 0.92 + progress * 0.18
    return 1
  }, [phase, progress])

  const dist = useMemo(() => {
    const dx = sourceAnimPos.x - targetAnimPos.x
    const dy = sourceAnimPos.y - targetAnimPos.y
    return Math.sqrt(dx * dx + dy * dy)
  }, [sourceAnimPos, targetAnimPos])

  const showGooey = dist < cellSize * 1.8

  if (!sourceApp || !targetApp) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
            {/* Gooey metaball shapes */}
            {showGooey && (
              <g filter="url(#gooey-filter)">
                <circle
                  cx={sourceAnimPos.x}
                  cy={sourceAnimPos.y}
                  r={halfIcon * iconScale}
                  fill="rgba(255,255,255,0.35)"
                />
                <circle
                  cx={targetAnimPos.x}
                  cy={targetAnimPos.y}
                  r={halfIcon * iconScale}
                  fill="rgba(255,255,255,0.35)"
                />
              </g>
            )}

            {/* Source icon */}
            <foreignObject
              x={sourceAnimPos.x - halfIcon * iconScale}
              y={sourceAnimPos.y - halfIcon * iconScale}
              width={iconSize * iconScale}
              height={iconSize * iconScale}
              style={{ overflow: 'visible' }}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <AppIcon app={sourceApp} size={32 * iconScale} />
                </div>
              </div>
            </foreignObject>

            {/* Target icon */}
            <foreignObject
              x={targetAnimPos.x - halfIcon * iconScale}
              y={targetAnimPos.y - halfIcon * iconScale}
              width={iconSize * iconScale}
              height={iconSize * iconScale}
              style={{ overflow: 'visible' }}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <AppIcon app={targetApp} size={32 * iconScale} />
                </div>
              </div>
            </foreignObject>

            {/* Glass highlight pulse during merge at target position */}
            {phase === 'merging' && (
              <ellipse
                cx={targetPos.x}
                cy={targetPos.y}
                rx={halfIcon * 1.3 * iconScale}
                ry={halfIcon * 0.7 * iconScale}
                fill="rgba(255,255,255,0.2)"
                opacity={progress * 0.5}
              />
            )}
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(FusionOverlay)
