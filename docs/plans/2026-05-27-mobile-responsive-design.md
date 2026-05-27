# Mobile Responsive Adaptation Design

Date: 2026-05-27

## Problem

The project has zero responsive CSS. All dimensions are hardcoded (`cellSize=72`, dock sizes, padding, etc.), causing truncation and layout breakage on mobile devices (320px-479px) and suboptimal experience on tablets.

## Goals

- Full adaptation from 320px to 4K
- Dynamic cellSize calculation based on viewport width
- Dock adaptive shrink on mobile
- Safe area insets for notch/Dynamic Island/home indicator
- Minimal code churn — centralized responsive logic

## Approach

Introduce a `useResponsive` hook that computes `cellSize`, `cols`, and breakpoint flags from `window.innerWidth`. All components consume these values instead of hardcoded constants.

## Breakpoints

| Width | cols | cellSize | Grid Width | Target |
|-------|------|----------|------------|--------|
| < 360px | 3 | 56px | 168px | Ultra-small screens |
| 360-479px | 4 | 60px | 240px | Small phones |
| 480-767px | 5 | 68px | 340px | Large phones / small tablets |
| 768-1023px | 6 | 72px | 432px | Tablets |
| >= 1024px | 8 | 72px | 576px | Desktop |

## Changes

### New Files
- `src/hooks/useResponsive.ts` — centralized responsive state

### Modified Files
- `src/App.tsx` — useResponsive, responsive spacers/padding, safe-area-insets
- `src/components/WaterDrop.tsx` — cellSize from props/context instead of const
- `src/components/FusionGroup.tsx` — dynamic offsets from cellSize
- `src/components/Dock.tsx` — adaptive sizing + safe-area-inset-bottom
- `src/components/SettingsPanel.tsx` — full-width on mobile
- `src/store/useStore.ts` — integrate useResponsive for grid columns
- `src/utils/grid.ts` — accept cellSize parameter
- `src/index.css` — safe-area CSS variables

### Unchanged
- `GlassSurface.tsx` — sizes driven by props, upstream changes propagate
- `useDrag.ts` — physics params screen-independent, bounds via cellSize input
- `theme.json` / `defaults.json` — keep as desktop defaults
