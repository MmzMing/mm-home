import React, { useMemo, useCallback, useState } from 'react'
import Capsule1x2 from './Capsule1x2'
import Capsule2x1 from './Capsule2x1'
import Card2x2 from './Card2x2'
import FolderPopup from './FolderPopup'
import type { AppConfig, FusionGroup as FusionGroupType } from '../../types'

interface FusionGroupProps {
  group: FusionGroupType
  apps: AppConfig[]
  cellSize: number
  showLabel: boolean
  containerLeft: number
  containerTop: number
  cols: number
  onDragStart?: (id: string) => void
  onDragEnd?: (id: string, pos: { x: number; y: number }) => void
}

/** Orchestrator: picks the correct shape component and manages folder popup */
const FusionGroup: React.FC<FusionGroupProps> = ({
  group,
  apps,
  cellSize,
  showLabel,
  containerLeft,
  containerTop,
  cols,
  onDragStart,
  onDragEnd,
}) => {
  const [folderOpen, setFolderOpen] = useState(false)

  const groupApps = useMemo(
    () => group.appIds.map((id) => apps.find((a) => a.id === id)).filter(Boolean) as AppConfig[],
    [group.appIds, apps]
  )

  const handleClick = useCallback(() => {
    setFolderOpen(true)
  }, [])

  const handleCloseFolder = useCallback(() => {
    setFolderOpen(false)
  }, [])

  // Determine which shape to render
  const shape = group.shape
  const appCount = groupApps.length

  const commonProps = {
    group,
    apps,
    cellSize,
    showLabel,
    containerLeft,
    containerTop,
    cols,
    onDragStart,
    onDragEnd,
    onClick: handleClick,
  }

  // For 2-app groups, use the specified capsule orientation
  if (appCount === 2 && shape === 'capsule') {
    return (
      <>
        <Capsule1x2 {...commonProps} />
        <FolderPopup
          group={folderOpen ? group : null}
          apps={apps}
          cellSize={cellSize}
          containerLeft={containerLeft}
          containerTop={containerTop}
          cols={cols}
          onClose={handleCloseFolder}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </>
    )
  }

  if (appCount === 2 && shape === 'capsule-v') {
    return (
      <>
        <Capsule2x1 {...commonProps} />
        <FolderPopup
          group={folderOpen ? group : null}
          apps={apps}
          cellSize={cellSize}
          containerLeft={containerLeft}
          containerTop={containerTop}
          cols={cols}
          onClose={handleCloseFolder}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </>
    )
  }

  // 3+ apps -> 2x2 card
  return (
    <>
      <Card2x2 {...commonProps} />
      <FolderPopup
        group={folderOpen ? group : null}
        apps={apps}
        cellSize={cellSize}
        containerLeft={containerLeft}
        containerTop={containerTop}
        cols={cols}
        onClose={handleCloseFolder}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </>
  )
}

export default React.memo(FusionGroup)
