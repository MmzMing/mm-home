import React, { useCallback } from 'react'
import { motion } from 'motion/react'
import GlassSurface from './GlassSurface'
import AppIcon from './AppIcon'
import type { AppConfig, GridPosition } from '../types'
import { useDrag } from '../hooks/useDrag'

interface WaterDropProps {
  app: AppConfig
  position: GridPosition
  cellSize: number
  gap: number
  showLabel: boolean
  containerLeft: number
  containerTop: number
  isDragging?: boolean
  onDragStart?: (id: string) => void
  onDragMove?: (id: string, pos: { x: number; y: number }) => void
  onDragEnd?: (id: string, pos: { x: number; y: number }) => void
  onClick?: (id: string) => void
}

const WaterDrop: React.FC<WaterDropProps> = ({
  app,
  position,
  cellSize,
  gap,
  showLabel,
  containerLeft,
  containerTop,
  isDragging = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
}) => {
  const radius = cellSize / 2
  const iconSize = Math.round(cellSize * 0.44)
  const stride = cellSize + gap
  const gridX = position.col * stride
  const gridY = position.row * stride

  const { ref, x, y, isDragging: dragging, handlers } = useDrag({
    id: app.id,
    gridX,
    gridY,
    cellSize,
    gap,
    containerLeft,
    containerTop,
    enableThrow: true,
    onDragStart,
    onDragMove,
    onDragEnd,
    onClick: useCallback(
      (id: string) => {
        if (onClick) onClick(id)
        else window.open(app.link, '_blank')
      },
      [onClick, app.link],
    ),
  })

  return (
    <motion.div
      ref={ref}
      className="absolute cursor-grab active:cursor-grabbing select-none touch-none"
      style={{
        left: gridX,
        top: gridY,
        width: cellSize,
        height: cellSize,
        x,
        y,
        zIndex: dragging || isDragging ? 100 : 10,
      }}
      animate={{
        scale: dragging ? 1.08 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      {...handlers}
    >
      <div className="flex flex-col items-center gap-1">
        <GlassSurface
          width={cellSize - 8}
          height={cellSize - 8}
          borderRadius={radius - 4}
          backgroundOpacity={0.15}
          saturation={1.8}
          brightness={50}
          blur={12}
          distortionScale={-180}
        >
          <AppIcon app={app} size={iconSize} />
        </GlassSurface>
        {showLabel && !dragging && (
          <motion.span
            className="text-[11px] text-black/85 font-medium leading-tight text-center truncate w-full px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {app.name}
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

export default React.memo(WaterDrop)
