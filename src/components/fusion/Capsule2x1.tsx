import React, { useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import GlassSurface from '../GlassSurface'
import AppIcon from '../AppIcon'
import type { AppConfig, FusionGroup as FusionGroupType } from '../../types'
import { useDrag } from '../../hooks/useDrag'
import { pixelToGrid } from '../../utils/grid'
import { useStore } from '../../store/useStore'

interface Capsule2x1Props {
  group: FusionGroupType
  apps: AppConfig[]
  cellSize: number
  gap: number
  showLabel: boolean
  containerLeft: number
  containerTop: number
  cols: number
  onDragStart?: (id: string) => void
  onDragEnd?: (id: string, pos: { x: number; y: number }) => void
  onClick?: () => void
}

/** 2x1 vertical capsule — the whole capsule is draggable as one unit */
const Capsule2x1: React.FC<Capsule2x1Props> = ({
  group,
  apps,
  cellSize,
  gap,
  showLabel,
  containerLeft,
  containerTop,
  cols,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const moveGroup = useStore((s) => s.moveGroup)

  const groupApps = useMemo(
    () => group.appIds.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as AppConfig[],
    [group.appIds, apps]
  )

  const stride = cellSize + gap
  const gx = group.position.col * stride
  const gy = group.position.row * stride
  const width = cellSize - 8
  const height = cellSize * 1.6

  const handleDragEnd = useCallback(
    (_id: string, point: { x: number; y: number }) => {
      const relX = point.x - containerLeft - cellSize / 2
      const relY = point.y - containerTop - cellSize / 2
      const clampedX = Math.max(cellSize / 2, Math.min(relX, window.innerWidth - containerLeft - cellSize / 2))
      const clampedY = Math.max(cellSize / 2, Math.min(relY, window.innerHeight - containerTop - cellSize / 2))
      const gridPos = pixelToGrid(clampedX, clampedY, cellSize, gap, cols)
      moveGroup(group.id, gridPos)
      onDragEnd?.(_id, point)
    },
    [containerLeft, containerTop, cellSize, gap, cols, group.id, moveGroup, onDragEnd]
  )

  const { ref, x, y, isDragging, handlers } = useDrag({
    id: group.appIds[0],
    gridX: gx,
    gridY: gy,
    cellSize: height,
    containerLeft,
    containerTop,
    onDragStart,
    onDragEnd: handleDragEnd,
    onClick: onClick ? () => onClick() : undefined,
  })

  return (
    <motion.div
      ref={ref}
      className="absolute cursor-grab active:cursor-grabbing select-none touch-none"
      style={{
        left: gx,
        top: gy,
        width: cellSize,
        height,
        x,
        y,
        zIndex: isDragging ? 100 : 10,
      }}
      animate={{ scale: isDragging ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      {...handlers}
    >
      <div className="flex flex-col items-center" style={{ width: cellSize, height }}>
        <GlassSurface
          width={width}
          height={height}
          borderRadius={width / 2}
          backgroundOpacity={0.15}
          saturation={1.8}
          brightness={50}
          blur={12}
          distortionScale={-180}
        >
          <div className="flex flex-col items-center gap-1 py-2">
            {groupApps.map((app) => (
              <div key={app.id} className="flex items-center justify-center">
                <AppIcon app={app} size={20} />
              </div>
            ))}
          </div>
        </GlassSurface>
      </div>
      {showLabel && (
        <span className="text-[11px] text-black/85 font-medium mt-1 text-center block truncate w-full">
          {groupApps[0]?.name}
        </span>
      )}
    </motion.div>
  )
}

export default React.memo(Capsule2x1)
