export interface AppConfig {
  id: string
  name: string
  icon: string
  cover?: string
  link: string
  color?: string
}

export interface GridPosition {
  row: number
  col: number
}

export interface FusionGroup {
  id: string
  appIds: string[]
  position: GridPosition
  shape: 'capsule' | 'capsule-v' | 'card'
}

export interface DefaultConfig {
  grid: {
    cellSize: number
    columns: {
      mobile: number
      tablet: number
      desktop: number
    }
  }
  dock: {
    slots: number
    panelHeight: number
    baseItemSize: number
    magnification: number
  }
  fusion: {
    preFusionDistance: number
    fusionDistance: number
    separationThreshold: number
  }
  animation: {
    preFusionDuration: number
    fusionDuration: number
    fusionEasing: string
    separationDuration: number
  }
  overlay: {
    opacity: number
  }
  wallpaper: string
}

export interface ThemeConfig {
  wallpaper: string
  overlayColor: string
  glassEffect: {
    borderRadius: number
    brightness: number
    saturation: number
    blur: number
    backgroundOpacity: number
    distortionScale: number
  }
}

export interface AppState {
  apps: AppConfig[]
  positions: Record<string, GridPosition>
  groups: Record<string, FusionGroup>
  dockItems: (string | null)[]
  settings: {
    showLabels: boolean
    overlayOpacity: number
    backgroundBlur: number
    wallpaper: string
  }
  dragState: {
    activeId: string | null
    currentPos: { x: number; y: number } | null
  }
}

export interface AppActions {
  moveApp: (id: string, pos: GridPosition) => void
  moveGroup: (groupId: string, pos: GridPosition) => void
  mergeApps: (id1: string, id2: string, direction?: { dx: number; dy: number }) => void
  splitGroup: (groupId: string, appId: string, dropPosition?: GridPosition) => void
  setDockItem: (slot: number, appId: string | null) => void
  updateSettings: (patch: Partial<AppState['settings']>) => void
  setDragState: (state: AppState['dragState']) => void
  initPositions: () => void
}
