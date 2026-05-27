import React, { useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import GlassSurface from '../GlassSurface'
import AppIcon from '../AppIcon'
import type { AppConfig, FusionGroup as FusionGroupType } from '../../types'
import { useDrag } from '../../hooks/useDrag'
import { pixelToGrid } from '../../utils/grid'
import { useStore } from '../../store/useStore'

interface Card2x2Props {
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

/** 2x2 card — the whole card is draggable as one unit */
const Card2x2: React.FC<Card2x2Props> = ({
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
  const cardSize = cellSize * 1.6
  const radius = cellSize / 2

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
    cellSize: cardSize,
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
        width: cardSize,
        height: cardSize,
        x,
        y,
        zIndex: isDragging ? 100 : 10,
      }}
      animate={{ scale: isDragging ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      {...handlers}
    >
      <GlassSurface
        width={cardSize}
        height={cardSize}
        borderRadius={radius}
        backgroundOpacity={0.15}
        saturation={1.8}
        brightness={50}
        blur={12}
        distortionScale={-180}
      >
        <div
          className="grid gap-1 p-2"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          {groupApps.slice(0, 4).map((app) => (
            <div key={app.id} className="flex items-center justify-center">
              <AppIcon app={app} size={20} />
            </div>
          ))}
        </div>
      </GlassSurface>
      {showLabel && (
        <span className="text-[11px] text-black/85 font-medium mt-1 text-center block truncate w-full">
          {groupApps[0]?.name}
        </span>
      )}
    </motion.div>
  )
}

export default React.memo(Card2x2)
