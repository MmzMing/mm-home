import React, { useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import GlassSurface from '../GlassSurface'
import AppIcon from '../AppIcon'
import type { AppConfig, FusionGroup as FusionGroupType, GridPosition } from '../../types'
import { useDrag } from '../../hooks/useDrag'
import { useStore } from '../../store/useStore'
import { pixelToGrid } from '../../utils/grid'

interface FolderPopupProps {
  group: FusionGroupType | null
  apps: AppConfig[]
  cellSize: number
  gap: number
  containerLeft: number
  containerTop: number
  cols: number
  onClose: () => void
  onDragStart?: (id: string) => void
  onDragMove?: (id: string, pos: { x: number; y: number }) => void
  onDragEnd?: (id: string, pos: { x: number; y: number }) => void
}

/** A draggable icon inside the folder popup */
const FolderIcon: React.FC<{
  app: AppConfig
  cellSize: number
  gap: number
  containerLeft: number
  containerTop: number
  cols: number
  onDragStart?: (id: string) => void
  onDragMove?: (id: string, pos: { x: number; y: number }) => void
  onDragEnd?: (id: string, pos: { x: number; y: number }) => void
  onDragOut?: (appId: string, dropPosition: GridPosition) => void
  onNavigate?: (link: string) => void
}> = React.memo(({ app, cellSize, gap, containerLeft, containerTop, cols, onDragStart, onDragMove, onDragEnd, onDragOut, onNavigate }) => {

  const handleDragEnd = useCallback(
    (appId: string, point: { x: number; y: number }) => {
      onDragEnd?.(appId, point)
      const relX = point.x - containerLeft
      const relY = point.y - containerTop
      const clampedX = Math.max(cellSize / 2, Math.min(relX, window.innerWidth - containerLeft - cellSize / 2))
      const clampedY = Math.max(cellSize / 2, Math.min(relY, window.innerHeight - containerTop - cellSize / 2))
      const gridPos = pixelToGrid(clampedX, clampedY, cellSize, gap, cols)
      onDragOut?.(appId, gridPos)
    },
    [onDragEnd, onDragOut, containerLeft, containerTop, cellSize, gap, cols]
  )

  const handleClick = useCallback(
    () => onNavigate?.(app.link),
    [onNavigate, app.link]
  )

  const { ref, x, y, isDragging, handlers } = useDrag({
    id: app.id,
    gridX: 0,
    gridY: 0,
    cellSize,
    containerLeft,
    containerTop,
    onDragStart,
    onDragMove,
    onDragEnd: handleDragEnd,
    onClick: handleClick,
  })

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ x, y, zIndex: isDragging ? 200 : 0 }}
      animate={{ scale: isDragging ? 1.15 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onPointerDown={(e) => {
        e.stopPropagation()
        handlers.onPointerDown(e)
      }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ width: 52, height: 52 }}
      >
        <AppIcon app={app} size={52} />
      </div>
      <span className="text-[10px] text-black/80 font-medium leading-tight text-center truncate w-14">
        {app.name}
      </span>
    </motion.div>
  )
})

/** iOS 26 style folder popup - shows apps in a grid, supports drag-out and click navigation */
const FolderPopup: React.FC<FolderPopupProps> = ({
  group,
  apps,
  cellSize,
  gap,
  containerLeft,
  containerTop,
  cols,
  onClose,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const splitGroup = useStore((s) => s.splitGroup)

  const groupApps = useMemo(() => {
    if (!group) return []
    return group.appIds.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as AppConfig[]
  }, [group, apps])

  const handleDragOut = useCallback(
    (appId: string, dropPosition: GridPosition) => {
      if (!group) return
      const wasGroup = group.appIds.length
      splitGroup(group.id, appId, dropPosition)
      // Close popup only when the group dissolves (1 app remaining after split)
      if (wasGroup <= 2) {
        onClose()
      }
    },
    [group, splitGroup, onClose]
  )

  const handleNavigate = useCallback(
    (link: string) => {
      window.open(link, '_blank')
    },
    []
  )

  const folderName = useMemo(() => {
    if (!group) return ''
    return groupApps[0]?.name ?? 'Folder'
  }, [group, groupApps])

  const gridCols = 3

  return (
    <AnimatePresence>
      {group && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 10000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop blur + dim — click to close */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(20px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
              zIndex: 0,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Folder container */}
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <GlassSurface
              width={Math.max(220, gridCols * 68 + 40)}
              height="auto"
              borderRadius={28}
              backgroundOpacity={0.2}
              saturation={1.8}
              brightness={55}
              blur={14}
              distortionScale={-180}
              style={{ minHeight: 120, padding: '20px' }}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Folder title */}
                <h3 className="text-sm font-semibold text-black/90 tracking-tight">
                  {folderName}
                </h3>

                {/* App grid */}
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${gridCols}, 52px)`,
                    justifyContent: 'center',
                  }}
                >
                  {groupApps.map((app) => (
                    <FolderIcon
                      key={app.id}
                      app={app}
                      cellSize={cellSize}
                      gap={gap}
                      containerLeft={containerLeft}
                      containerTop={containerTop}
                      cols={cols}
                      onDragStart={onDragStart}
                      onDragMove={onDragMove}
                      onDragEnd={onDragEnd}
                      onDragOut={handleDragOut}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              </div>
            </GlassSurface>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(FolderPopup)
