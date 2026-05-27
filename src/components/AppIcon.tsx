import React from 'react'
import type { AppConfig } from '../types'

interface AppIconProps {
  app: AppConfig
  size?: number
}

const AppIcon: React.FC<AppIconProps> = ({ app, size = 36 }) => {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {app.cover ? (
        <img
          src={app.cover}
          alt={app.name}
          className="w-full h-full object-cover rounded-lg"
          draggable={false}
        />
      ) : (
        <img
          src={app.icon}
          alt={app.name}
          className="w-full h-full object-contain"
          style={{ filter: 'brightness(0) opacity(0.85)' }}
          draggable={false}
          onError={(e) => {
            // Fallback: show first letter
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const fallback = document.createElement('div')
            fallback.className = 'w-full h-full rounded-full bg-black/10 flex items-center justify-center text-black font-semibold'
            fallback.style.fontSize = `${size * 0.5}px`
            fallback.textContent = app.name.charAt(0)
            target.parentNode?.appendChild(fallback)
          }}
        />
      )}
    </div>
  )
}

export default React.memo(AppIcon)
