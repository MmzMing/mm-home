# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Apple Workspace —— 仿 iOS 26 液态玻璃风格的个人工作空间单页应用。水滴形图标支持拖拽、碰撞融合（胶囊/卡片）和分离。纯前端项目，无后端、无路由、无 SSR。

## 常用命令

```bash
npm run dev       # 启动 Vite 开发服务器
npm run build     # tsc -b 类型检查 + vite build 构建到 dist/
npm run lint      # eslint . 检查所有文件
npm run preview   # 预览生产构建产物
```

项目未配置测试框架，无测试命令。

## 技术栈

- React 19 + Vite 8 + TypeScript 6
- motion/react（framer-motion v12+，包名为 `motion`，导入用 `motion/react`）
- Zustand 5 状态管理 + localStorage 持久化
- Tailwind CSS 4（通过 `@tailwindcss/vite` 插件集成）

## 架构要点

### 组件层级

```
App -> 壁纸层 / 遮罩层 / 网格区域(WaterDrop + FusionGroup) / Dock / FusionOverlay / SettingsPanel
```

- `GlassSurface` 是核心视觉容器，所有需要液态玻璃效果的组件必须包裹它
- `WaterDrop` = 单个可拖拽水滴图标，`FusionGroup` = 融合后的胶囊/卡片
- `FusionOverlay` 是 z-index:9999 的 SVG 动画覆盖层
- `Dock` 底部固定，自带放大悬停效果

### 状态管理

Zustand store（`src/store/useStore.ts`）持有所有运行时状态：
- `apps` / `positions` / `groups` / `dockItems` / `settings` / `dragState`
- 通过 `persist` 中间件自动同步到 localStorage（key: `apple-workspace-state`）

### 配置外置

视觉参数（网格尺寸、动画时长、玻璃效果值）全部在 `src/config/` 的 JSON 文件中定义，不在组件中硬编码。

## 代码规范

### 红线（不可违反）

- **禁止使用 `backdrop-filter: blur()` 作为主要玻璃效果** —— 必须使用 GlassSurface 的 SVG 位移贴图方案，CSS backdrop-filter 仅作降级兜底
- **禁止从 `framer-motion` 导入** —— 包已更名为 `motion`，统一使用 `import { ... } from 'motion/react'`
- **禁止在组件内硬编码视觉参数** —— 网格尺寸、动画时长、玻璃效果值必须从 `src/config/*.json` 读取
- **禁止引入路由库** —— 项目是纯单页应用，不需要 React Router 等路由方案
- **禁止引入 CSS-in-JS 或 CSS Modules** —— 样式统一使用 Tailwind CSS 工具类 + 内联 style（动态值）
- **禁止引入测试框架** —— 项目当前不设测试，不要自行添加 jest/vitest 等
- **禁止使用 Canvas 替代 SVG** —— 动画系统基于 SVG 路径插值，不要改为 Canvas 方案

### 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 组件 | PascalCase | `GlassSurface.tsx`、`WaterDrop.tsx` |
| Hook | camelCase，`use` 前缀 | `useDrag.ts`、`useFusionAnimation.ts` |
| 工具函数 | camelCase | `collision.ts`、`svgPath.ts` |
| 类型定义 | 集中在 `src/types/index.ts` | — |
| 配置 | kebab-case JSON | `defaults.json`、`apps.json` |

### 导入顺序

```ts
// 1. React 核心
import { useState, useCallback } from 'react'
// 2. 第三方库
import { motion, useMotionValue } from 'motion/react'
// 3. 组件
import GlassSurface from '../components/GlassSurface'
// 4. Hook
import useDrag from '../hooks/useDrag'
// 5. 工具
import { detectCollision } from '../utils/collision'
// 6. 类型
import type { AppConfig, GridPosition } from '../types'
// 7. 配置
import defaults from '../config/defaults.json'
```
