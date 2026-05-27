import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, AppActions, GridPosition, AppConfig } from '../types'
import defaultApps from '../config/apps.json'
import defaults from '../config/defaults.json'
import { getResponsiveConfig } from '../utils/grid'

const STORAGE_KEY = 'apple-workspace-state'

function getGridColumns(): number {
  return getResponsiveConfig().cols
}

function findFreePosition(
  positions: Record<string, GridPosition>,
  occupied: Set<string>,
  cols: number
): GridPosition {
  for (let row = 0; row < 100; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${row},${col}`
      if (!occupied.has(key)) {
        return { row, col }
      }
    }
  }
  return { row: 0, col: 0 }
}

const initialState: AppState = {
  apps: defaultApps as AppConfig[],
  positions: {},
  groups: {},
  dockItems: [null, null, null, null],
  settings: {
    showLabels: true,
    overlayOpacity: defaults.overlay.opacity,
    wallpaper: defaults.wallpaper,
  },
  dragState: {
    activeId: null,
    currentPos: null,
  },
}

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      initPositions: () => {
        const { apps, positions } = get()
        if (Object.keys(positions).length > 0) return

        const cols = getGridColumns()
        const occupied = new Set<string>()
        const newPositions: Record<string, GridPosition> = {}

        apps.forEach((app, index) => {
          const row = Math.floor(index / cols)
          const col = index % cols
          const key = `${row},${col}`
          occupied.add(key)
          newPositions[app.id] = { row, col }
        })

        set({ positions: newPositions })
      },

      moveApp: (id: string, pos: GridPosition) => {
        set((state) => ({
          positions: { ...state.positions, [id]: pos },
        }))
      },

      moveGroup: (groupId: string, pos: GridPosition) => {
        set((state) => {
          const group = state.groups[groupId]
          if (!group) return state
          return {
            groups: { ...state.groups, [groupId]: { ...group, position: pos } },
          }
        })
      },

      mergeApps: (id1: string, id2: string, direction?: { dx: number; dy: number }) => {
        set((state) => {
          const groupId = `group-${Date.now()}`
          const pos1 = state.positions[id1]
          const newGroups = { ...state.groups }
          const newPositions = { ...state.positions }

          // Check if either app is already in a group
          const existingGroup1 = Object.values(newGroups).find((g) =>
            g.appIds.includes(id1)
          )
          const existingGroup2 = Object.values(newGroups).find((g) =>
            g.appIds.includes(id2)
          )

          let mergedAppIds: string[]
          // Preserve the position of whichever side is already a group
          const groupPos = existingGroup1?.position ?? existingGroup2?.position

          if (existingGroup1 && existingGroup2) {
            mergedAppIds = [
              ...existingGroup1.appIds,
              ...existingGroup2.appIds,
            ]
            delete newGroups[existingGroup1.id]
            delete newGroups[existingGroup2.id]
          } else if (existingGroup1) {
            mergedAppIds = [...existingGroup1.appIds, id2]
            delete newGroups[existingGroup1.id]
          } else if (existingGroup2) {
            mergedAppIds = [id1, ...existingGroup2.appIds]
            delete newGroups[existingGroup2.id]
          } else {
            mergedAppIds = [id1, id2]
          }

          // Determine shape based on app count and drag direction
          // 2 apps: vertical if dragged from top/bottom, horizontal if from left/right
          // 3+ apps: 2x2 card
          let shape: 'capsule' | 'capsule-v' | 'card'
          if (mergedAppIds.length > 2) {
            shape = 'card'
          } else if (direction) {
            shape = Math.abs(direction.dy) > Math.abs(direction.dx) ? 'capsule-v' : 'capsule'
          } else {
            shape = 'capsule-v'
          }

          newGroups[groupId] = {
            id: groupId,
            appIds: mergedAppIds,
            position: groupPos ?? pos1 ?? { row: 0, col: 0 },
            shape,
          }

          // Remove individual positions for grouped apps
          mergedAppIds.forEach((appId) => {
            delete newPositions[appId]
          })

          return { groups: newGroups, positions: newPositions }
        })
      },

      splitGroup: (groupId: string, appId: string, dropPosition?: GridPosition) => {
        set((state) => {
          const group = state.groups[groupId]
          if (!group) return state

          const newGroups = { ...state.groups }
          const newPositions = { ...state.positions }

          const remaining = group.appIds.filter((id) => id !== appId)

          // Place the split app at drop position or default nearby
          newPositions[appId] = dropPosition ?? {
            row: group.position.row,
            col: group.position.col + 1,
          }

          if (remaining.length === 1) {
            // Only one left, dissolve group
            newPositions[remaining[0]] = group.position
            delete newGroups[groupId]
          } else if (remaining.length === 2) {
            // Downgrade to a random capsule orientation
            newGroups[groupId] = {
              ...group,
              appIds: remaining,
              shape: Math.random() > 0.5 ? 'capsule' : 'capsule-v',
            }
          } else {
            newGroups[groupId] = {
              ...group,
              appIds: remaining,
            }
          }

          return { groups: newGroups, positions: newPositions }
        })
      },

      setDockItem: (slot: number, appId: string | null) => {
        set((state) => {
          const newDockItems = [...state.dockItems]
          newDockItems[slot] = appId
          return { dockItems: newDockItems }
        })
      },

      updateSettings: (patch) => {
        set((state) => ({
          settings: { ...state.settings, ...patch },
        }))
      },

      setDragState: (dragState) => {
        set({ dragState })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        apps: state.apps,
        positions: state.positions,
        groups: state.groups,
        dockItems: state.dockItems,
        settings: state.settings,
      }),
    }
  )
)
