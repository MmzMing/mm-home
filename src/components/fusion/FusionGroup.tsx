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
  gap: number
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
  gap,
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

  const shape = group.shape
  const appCount = groupApps.length

  const commonProps = {
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
    onClick: handleClick,
  }

  const popupProps = {
    group: folderOpen ? group : null,
    apps,
    cellSize,
    gap,
    containerLeft,
    containerTop,
    cols,
    onClose: handleCloseFolder,
    onDragStart,
    onDragEnd,
  }

  if (appCount === 2 && shape === 'capsule') {
    return (
      <>
        <Capsule1x2 {...commonProps} />
        <FolderPopup {...popupProps} />
      </>
    )
  }

  if (appCount === 2 && shape === 'capsule-v') {
    return (
      <>
        <Capsule2x1 {...commonProps} />
        <FolderPopup {...popupProps} />
      </>
    )
  }

  return (
    <>
      <Card2x2 {...commonProps} />
      <FolderPopup {...popupProps} />
    </>
  )
}

export default React.memo(FusionGroup)
