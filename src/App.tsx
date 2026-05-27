import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import WaterDrop from './components/WaterDrop'
import { FusionGroup as FusionGroupComponent, FusionOverlay, GooeyFilter } from './components/fusion'
import Dock from './components/Dock'
import SettingsPanel from './components/SettingsPanel'
import StatusBar from './components/StatusBar'
import AppIcon from './components/AppIcon'
import { useStore } from './store/useStore'
import { useFusion } from './hooks/useFusion'
import { useResponsive } from './hooks/useResponsive'
import { pixelToGrid } from './utils/grid'
import { checkCollision } from './utils/collision'
import defaults from './config/defaults.json'
import type { AppConfig } from './types'

function App() {
  const apps = useStore((s) => s.apps)
  const positions = useStore((s) => s.positions)
  const groups = useStore((s) => s.groups)
  const dockItems = useStore((s) => s.dockItems)
  const settings = useStore((s) => s.settings)
  const moveApp = useStore((s) => s.moveApp)
  const mergeApps = useStore((s) => s.mergeApps)
  const setDockItem = useStore((s) => s.setDockItem)
  const initPositions = useStore((s) => s.initPositions)

  const { cellSize, cols, gap, isMobile, dockScale } = useResponsive()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsAnchorX, setSettingsAnchorX] = useState<number | null>(null)
  const [dragTarget, setDragTarget] = useState<string | null>(null)
  const [fusionTargetApp, setFusionTargetApp] = useState<AppConfig | null>(null)
  const [sourceApp, setSourceApp] = useState<AppConfig | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const fusion = useFusion()
  const pendingMergeRef = useRef<{ sourceId: string; targetId: string; direction: { dx: number; dy: number } } | null>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const gridScrollRef = useRef<HTMLDivElement>(null)

  // Track the grid container's viewport offset for drag coordinate calculations
  const [containerPos, setContainerPos] = useState({ left: 0, top: 0 })

  useEffect(() => {
    const updateContainerPos = () => {
      const el = gridContainerRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        setContainerPos({ left: rect.left, top: rect.top })
      }
    }
    updateContainerPos()
    const scrollEl = gridScrollRef.current

    window.addEventListener('resize', updateContainerPos)
    window.addEventListener('scroll', updateContainerPos, true)
    if (scrollEl) scrollEl.addEventListener('scroll', updateContainerPos, { passive: true })

    return () => {
      window.removeEventListener('resize', updateContainerPos)
      window.removeEventListener('scroll', updateContainerPos, true)
      if (scrollEl) scrollEl.removeEventListener('scroll', updateContainerPos)
    }
  }, [])

  useEffect(() => {
    initPositions()
  }, [initPositions])

  const freeApps = useMemo(() => {
    const groupedIds = new Set(Object.values(groups).flatMap((g) => g.appIds))
    const dockedIds = new Set(dockItems.filter(Boolean) as string[])
    return apps.filter((a) => !groupedIds.has(a.id) && !dockedIds.has(a.id))
  }, [apps, groups, dockItems])

  const isPointInDock = useCallback((point: { x: number; y: number }): boolean => {
    if (!dockRef.current) return false
    const rect = dockRef.current.getBoundingClientRect()
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  }, [])

  const findDockSlot = useCallback((point: { x: number; y: number }): number => {
    if (!dockRef.current) return -1
    const rect = dockRef.current.getBoundingClientRect()
    if (point.y < rect.top || point.y > rect.bottom) return -1
    const slotWidth = rect.width / (defaults.dock.slots + 1)
    return Math.max(0, Math.min(Math.floor((point.x - rect.left) / slotWidth), defaults.dock.slots - 1))
  }, [])

  // -- Coordinate helpers --
  // Convert page coordinates to viewport coordinates (for position:fixed overlay)
  const pageToViewport = useCallback((pagePos: { x: number; y: number }) => ({
    x: pagePos.x - window.scrollX,
    y: pagePos.y - window.scrollY,
  }), [])

  // Get grid cell center in page coordinates
  const cellCenterPage = useCallback((row: number, col: number) => {
    const stride = cellSize + gap
    return {
      x: containerPos.left + col * stride + cellSize / 2,
      y: containerPos.top + row * stride + cellSize / 2,
    }
  }, [containerPos, cellSize, gap])

  // -- Drag lifecycle --

  const handleDragStart = useCallback(
    (id: string) => {
      setActiveDragId(id)
    },
    []
  )

  const handleDragMove = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      if (activeDragId !== id) return

      // pos is in page coordinates (from useDrag offsetToPage)
      // Collision with free apps - use page coordinates for both
      for (const app of freeApps) {
        if (app.id === id) continue
        const appPos = positions[app.id]
        if (!appPos) continue
        const appCenterPage = cellCenterPage(appPos.row, appPos.col)
        const { preFusion, fusion: isFusion } = checkCollision(pos, appCenterPage, cellSize / 2)

        if (isFusion) {
          if (dragTarget !== app.id) {
            setDragTarget(app.id)
            setFusionTargetApp(app)
            setSourceApp(apps.find((a) => a.id === id) || null)
            // Convert to viewport coords for the fixed overlay
            fusion.startMerging(id, app.id, pageToViewport(pos), pageToViewport(appCenterPage))
          } else {
            // Update source position in real-time during drag
            fusion.updateSourcePos(pageToViewport(pos))
          }
          return
        }
        if (preFusion && !fusion.isActive) {
          setDragTarget(app.id)
          setFusionTargetApp(app)
          setSourceApp(apps.find((a) => a.id === id) || null)
          fusion.startApproaching(id, app.id, pageToViewport(pos), pageToViewport(appCenterPage))
          return
        }
      }

      // Collision with groups — bounding box of the shape plus small padding
      const PAD = 12
      for (const group of Object.values(groups)) {
        const stride = cellSize + gap
        const gx = containerPos.left + group.position.col * stride
        const gy = containerPos.top + group.position.row * stride
        let w: number, h: number
        if (group.shape === 'card') {
          w = cellSize * 1.6
          h = cellSize * 1.6
        } else if (group.shape === 'capsule-v') {
          w = cellSize
          h = cellSize * 1.6
        } else {
          w = cellSize * 1.6
          h = cellSize
        }
        if (
          pos.x >= gx - PAD && pos.x <= gx + w + PAD &&
          pos.y >= gy - PAD && pos.y <= gy + h + PAD
        ) {
          const groupCenterPage = {
            x: gx + w / 2,
            y: gy + h / 2,
          }
          if (dragTarget !== group.appIds[0]) {
            setDragTarget(group.appIds[0])
            setFusionTargetApp(apps.find((a) => a.id === group.appIds[0]) || null)
            setSourceApp(apps.find((a) => a.id === id) || null)
            fusion.startMerging(id, group.appIds[0], pageToViewport(pos), pageToViewport(groupCenterPage))
          } else {
            fusion.updateSourcePos(pageToViewport(pos))
          }
          return
        }
      }

      if (dragTarget) {
        setDragTarget(null)
        setFusionTargetApp(null)
        setSourceApp(null)
        fusion.reset()
      }
    },
    [activeDragId, freeApps, positions, groups, dragTarget, fusion, apps, cellCenterPage, pageToViewport, cellSize]
  )

  const handleDragEnd = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      setActiveDragId(null)

      // Drop on Dock
      if (isPointInDock(pos)) {
        const slotIndex = findDockSlot(pos)
        if (slotIndex >= 0 && slotIndex < defaults.dock.slots && dockItems[slotIndex] === null) {
          setDockItem(slotIndex, id)
          resetFusion()
          return
        }
      }

      // Fusion on release
      if (dragTarget) {
        // Look up target position: check individual positions first, then groups
        const targetPos = positions[dragTarget]
          ?? Object.values(groups).find((g) => g.appIds.includes(dragTarget))?.position
          ?? { row: 0, col: 0 }
        const targetPagePos = cellCenterPage(targetPos.row, targetPos.col)

        // Compute drag direction: vector from source to target
        const direction = {
          dx: targetPagePos.x - pos.x,
          dy: targetPagePos.y - pos.y,
        }

        pendingMergeRef.current = { sourceId: id, targetId: dragTarget, direction }

        // If overlay is already showing (from handleDragMove), keep it visible.
        // Otherwise start the animation as fallback.
        if (!fusion.isActive) {
          fusion.startMerging(id, dragTarget, pageToViewport(pos), pageToViewport(targetPagePos))
        }

        // Commit the merge and hide overlay in the same frame
        setTimeout(() => {
          if (pendingMergeRef.current) {
            mergeApps(pendingMergeRef.current.sourceId, pendingMergeRef.current.targetId, pendingMergeRef.current.direction)
            pendingMergeRef.current = null
          }
          fusion.reset()
          setDragTarget(null)
          setFusionTargetApp(null)
          setSourceApp(null)
        }, defaults.animation.fusionDuration + 50)
        return
      }

      // If dragged ID belongs to a group, the capsule component handles repositioning via moveGroup
      const isGroupedApp = Object.values(groups).some((g) => g.appIds.includes(id))
      if (isGroupedApp) {
        resetFusion()
        return
      }

      // Snap to grid: convert page coords to grid-relative
      const relX = pos.x - containerPos.left
      const relY = pos.y - containerPos.top

      // Clamp to viewport
      const clampedX = Math.max(cellSize / 2, Math.min(relX, window.innerWidth - containerPos.left - cellSize / 2))
      const clampedY = Math.max(cellSize / 2, Math.min(relY, window.innerHeight - containerPos.top - cellSize / 2))

      const gridPos = pixelToGrid(clampedX, clampedY, cellSize, gap, cols)
      // Find nearest free spot (collision resolution is in utils)
      const isOccupied = Object.entries(positions).some(
        ([otherId, p]) => otherId !== id && p.row === gridPos.row && p.col === gridPos.col
      )
      if (isOccupied) {
        // Try to find nearest free cell
        for (let radius = 1; radius < 10; radius++) {
          let found = false
          for (let dr = -radius; dr <= radius && !found; dr++) {
            for (let dc = -radius; dc <= radius && !found; dc++) {
              if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue
              const c: typeof gridPos = {
                row: Math.max(0, gridPos.row + dr),
                col: ((gridPos.col + dc) % cols + cols) % cols,
              }
              const occupied = Object.entries(positions).some(
                ([otherId, p]) => otherId !== id && p.row === c.row && p.col === c.col
              )
              if (!occupied) {
                moveApp(id, c)
                found = true
              }
            }
          }
          if (found) break
        }
      } else {
        moveApp(id, gridPos)
      }

      resetFusion()
    },
    [containerPos, cols, positions, groups, dragTarget, fusion, dockItems, mergeApps, moveApp, setDockItem, isPointInDock, findDockSlot]
  )

  const resetFusion = useCallback(() => {
    setDragTarget(null)
    setFusionTargetApp(null)
    setSourceApp(null)
    fusion.reset()
  }, [fusion])

  // -- Layout calculations --

  const maxRow = useMemo(() => {
    let max = 0
    for (const pos of Object.values(positions)) max = Math.max(max, pos.row)
    for (const group of Object.values(groups)) max = Math.max(max, group.position.row)
    const maxVisibleRows = Math.ceil(window.innerHeight / cellSize) + 2
    return Math.min(max + 2, maxVisibleRows)
  }, [positions, groups])

  const dockData = useMemo(() => {
    const items = dockItems.map((appId, index) => {
      if (!appId) return { icon: <div className="w-6 h-6 rounded-full border-2 border-dashed border-black/20" />, label: `Slot ${index + 1}`, onClick: () => {} }
      const app = apps.find((a) => a.id === appId)
      if (!app) return { icon: <div className="w-6 h-6 rounded-full border-2 border-dashed border-black/20" />, label: `Slot ${index + 1}`, onClick: () => {} }
      return { icon: <AppIcon app={app} size={24} />, label: app.name, onClick: () => window.open(app.link, '_blank') }
    })
    items.push({
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      label: 'Settings',
      onClick: (e?: React.MouseEvent) => {
        if (e) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          setSettingsAnchorX(rect.left + rect.width / 2)
        }
        setSettingsOpen(true)
      },
    })
    return items
  }, [dockItems, apps])

  const gridPadBottom = isMobile ? 'pb-20' : 'pb-24'

  return (
    <div
      className="w-full h-full overflow-hidden relative touch-none"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif" }}
    >
      {/* Wallpaper */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${settings.wallpaper})`,
            filter: settings.backgroundBlur > 0 ? `blur(${settings.backgroundBlur}px)` : undefined,
            inset: settings.backgroundBlur > 0 ? `-${settings.backgroundBlur * 2}px` : '0',
          }}
        />
      </div>
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${settings.overlayOpacity})`, zIndex: 3 }} />
      {/* Status bar with pull-down panel */}
      <StatusBar />
      {/* Content */}
      <div className="w-full h-full flex flex-col" style={{ position: 'relative', zIndex: 10 }}>
        {/* Spacer — pushes grid below the fixed status bar */}
        <div style={{ height: 36, flexShrink: 0 }} />
        {/* Grid area */}
        <div
          ref={gridScrollRef}
          className={`flex-1 px-4 ${gridPadBottom} ${activeDragId ? 'overflow-y-hidden' : 'overflow-y-auto'}`}
          style={activeDragId ? { overflowX: 'hidden', overscrollBehavior: 'none' } : { overflowX: 'hidden' }}
        >
          <div
            ref={gridContainerRef}
            className="relative mx-auto"
            style={{ width: cols * (cellSize + gap) - gap, height: maxRow * (cellSize + gap) - gap, maxWidth: '100%' }}
          >
            {freeApps.map((app) => {
              const pos = positions[app.id]
              if (!pos) return null
              return (
                <WaterDrop
                  key={app.id}
                  app={app}
                  position={pos}
                  cellSize={cellSize}
                  gap={gap}
                  showLabel={settings.showLabels}
                  containerLeft={containerPos.left}
                  containerTop={containerPos.top}
                  isDragging={activeDragId === app.id}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                />
              )
            })}
            {Object.values(groups).map((group) => (
              <FusionGroupComponent
                key={group.id}
                group={group}
                apps={apps}
                cellSize={cellSize}
                gap={gap}
                showLabel={settings.showLabels}
                containerLeft={containerPos.left}
                containerTop={containerPos.top}
                cols={cols}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
            {/* Drag target highlight */}
            <AnimatePresence>
              {dragTarget && positions[dragTarget] && !fusion.isActive && (
                <motion.div
                  className="absolute rounded-full border-2 border-blue-400/50 bg-blue-400/10"
                  style={{ left: positions[dragTarget].col * (cellSize + gap) - 4, top: positions[dragTarget].row * (cellSize + gap) - 4, width: cellSize + 8, height: cellSize + 8 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Dock */}
        <div ref={dockRef} className="fixed bottom-4 left-0 right-0" style={{ zIndex: 20, paddingBottom: 'var(--sab, 0px)' }}>
          <Dock items={dockData} panelHeight={defaults.dock.panelHeight * dockScale} baseItemSize={defaults.dock.baseItemSize * dockScale} magnification={defaults.dock.magnification * dockScale} onItemDrop={(appId, slotIndex) => setDockItem(slotIndex, appId)} />
        </div>
      </div>
      {/* Global gooey metaball filter - always in DOM */}
      <GooeyFilter blur={8} />
      {/* Fusion overlay - liquid gooey effect */}
      <FusionOverlay fusionState={fusion.state} sourceApp={sourceApp} targetApp={fusionTargetApp} cellSize={cellSize} />
      {/* Settings */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} anchorX={settingsAnchorX} />
    </div>
  )
}

export default App
