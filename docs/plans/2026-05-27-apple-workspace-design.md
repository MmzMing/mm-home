# Apple-Style Personal Workspace Homepage - Design Document

## Overview

A single-page application replicating Apple's mobile interface with iOS 26 liquid glass aesthetics. Users interact with liquid water-drop app icons that support drag, collision-based fusion (forming capsules/cards), and separation. Built with React 19 + Vite 8 + TypeScript.

## Key Decisions

- **Animation**: SVG path interpolation + CSS/JS animation (not Canvas or pure CSS clip-path)
- **Language**: TypeScript
- **Default apps**: Preset 8-12 example entries with public icons
- **Adaptation**: Desktop mouse + mobile touch dual support
- **Settings**: Side drawer panel from Dock bar

## Tech Stack

- React 19 + Vite 8 + TypeScript
- motion/react (framer-motion v12+) for drag, spring physics, AnimatePresence
- Tailwind CSS 4 for utility styles
- GlassSurface component (from React Bits reference) for liquid glass visuals
- Dock component (from React Bits reference) for bottom dock bar
- Zustand for state management with localStorage persistence

## Project Structure

```
src/
  components/
    GlassSurface.tsx    # Liquid glass container (from reference)
    Dock.tsx            # Dock bar (from reference)
    WaterDrop.tsx       # Single water drop icon
    FusionGroup.tsx     # Fused capsule/card container
    GridCell.tsx        # Grid cell
    SettingsPanel.tsx   # Settings side drawer
    AppIcon.tsx         # App icon renderer
  hooks/
    useDrag.ts          # Drag logic
    useFusion.ts        # Fusion detection and animation
    useGrid.ts          # Grid coordinate calculation
    usePersistence.ts   # State persistence
  utils/
    svgPath.ts          # SVG path generation and interpolation
    collision.ts        # Collision detection
    grid.ts             # Grid math
  config/
    apps.json           # App entry config
    defaults.json       # System defaults
    theme.json          # Visual resources
  store/
    useStore.ts         # Zustand store
  types/
    index.ts
  App.tsx
  main.tsx
  index.css
```

## Data Model

### AppConfig (config/apps.json)

```ts
interface AppConfig {
  id: string;
  name: string;
  icon: string;        // icon URL or SVG path
  cover?: string;      // cover image URL (takes priority)
  link: string;
  color?: string;      // water drop theme color
}
```

### DefaultConfig (config/defaults.json)

```ts
interface DefaultConfig {
  grid: { cellSize: 72; columns: { mobile: 4; tablet: 6; desktop: 8 } };
  dock: { slots: 4; panelHeight: 68; baseItemSize: 60; magnification: 80 };
  fusion: {
    preFusionDistance: 0.6;
    fusionDistance: 0.3;
    separationThreshold: 0.5;
  };
  animation: {
    preFusionDuration: 150;
    fusionDuration: 200;
    fusionEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  };
  overlay: { opacity: 0.3 };
  wallpaper: string;
}
```

### Runtime State (Zustand store)

```ts
interface AppState {
  apps: AppConfig[];
  positions: Record<string, { row: number; col: number }>;
  groups: Record<string, string[]>;    // groupId -> appId[]
  dockItems: string[];                 // 4 slots of appId
  settings: { showLabels: boolean; overlayOpacity: number };
  // actions
  moveApp: (id: string, pos: { row: number; col: number }) => void;
  mergeApps: (id1: string, id2: string) => void;
  splitGroup: (groupId: string, appId: string) => void;
  addToDock: (slot: number, appId: string) => void;
  updateSettings: (patch: Partial<AppState['settings']>) => void;
}
```

### Persistence

Zustand `persist` middleware -> localStorage key `apple-workspace-state`. First load initializes from config/apps.json, subsequent loads read from localStorage.

## Liquid Drop & Fusion Animation System

### WaterDrop Component

Single drop = SVG container + GlassSurface wrapper:
- Default: circular clipPath, 72px diameter
- Dragging: label hidden, liquid body follows cursor
- Visual: GlassSurface wraps icon + text label

### Fusion Detection (useFusion hook)

Real-time calculation during drag:
- distance <= radiusSum * 0.6 -> pre-fusion deformation
- distance <= radiusSum * 0.3 -> full fusion into capsule

### Fusion Animation Phases

| Phase | Path Change | Duration | Easing |
|-------|-------------|----------|--------|
| Pre-fusion | Contact-side bulge | 150ms | linear |
| Fusion | Hourglass -> capsule | 200ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Stable | Capsule fixed | - | - |
| Separation | Capsule stretch -> snap -> two circles | 300ms | ease-out |

### SVG Path Generation

- Circle: standard arc path
- Capsule: two circles + tangent lines connecting them
- Hourglass transition: cubic bezier curves at contact point simulating surface tension
- Interpolation: linear lerp on control point coordinates between animation frames

### Multi-drop Fusion (3 drops -> 2x2 card)

1. First two fuse into capsule
2. Third approaches, capsule expands to 2x2 rounded square
3. Icons arranged 2x2 by fusion order
4. Corner radius matches single drop (36px)

## Layout System

### Three-Layer Vertical Structure

1. Top whitespace: ~80px visual padding
2. Icon grid: CSS Grid, `grid-template-columns: repeat(N, 72px)`
3. Bottom Dock: `position: fixed; bottom: 0`

### Responsive Columns

| Screen Width | Columns |
|-------------|---------|
| < 480px | 4 |
| 480-768px | 5 |
| 768-1024px | 6 |
| > 1024px | 8 |

### Coordinate Collision Detection

Each icon binds `{ row, col }`. On drop, check if target is occupied. If so, auto-extend downward to nearest free cell.

## Dock Bar

Based on reference Dock component, wrapped in GlassSurface:
- 5 slots: 4 custom + 1 fixed settings icon
- Liquid glass capsule form
- Magnification on hover (80px)
- Drag interoperability: main grid icons can be dragged into/out of Dock

## Settings Panel (Side Drawer)

Slides in from right, liquid glass panel:
- Triggered by settings icon in Dock
- motion.div slide + AnimatePresence
- Controls: label toggle, overlay opacity slider, wallpaper selector

## Visual Specifications

### Glass Effect Parameters (GlassSurface)

| Param | Value |
|-------|-------|
| borderRadius | 36 (drop) / 24 (Dock) |
| brightness | 50 |
| saturation | 1.8 |
| blur | 12 |
| backgroundOpacity | 0.15 |
| distortionScale | -180 |

All components MUST use GlassSurface with SVG displacement map. No `backdrop-filter: blur()` as primary effect.

### Color Spec

- Icons: pure black `#000000`
- Labels: `rgba(0,0,0,0.85)`
- Highlight: `rgba(255,255,255,0.4)` inset shadow
- Shadow: `rgba(0,0,0,0.1)` outer shadow

### Background Layers

```
Wallpaper (z-index: 0) -> Overlay mask (z-index: 1, adjustable opacity) -> Content (z-index: 2)
```

## Mobile Adaptation

- Unified pointer events (mouse + touch)
- Long press 300ms triggers drag mode
- Grid columns, icon size, Dock ratio via CSS media queries + JS
- Settings panel fullscreen on mobile
- `requestAnimationFrame` for fusion animation, pause when offscreen
- `transform: translate()` for drag (GPU compositing)
