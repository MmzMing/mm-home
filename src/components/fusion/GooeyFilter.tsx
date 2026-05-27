import React from 'react'

interface GooeyFilterProps {
  blur?: number
}

/**
 * Global SVG gooey metaball filter.
 * Renders a hidden SVG with feGaussianBlur + feColorMatrix threshold
 * that creates liquid bridges between overlapping shapes.
 * Must be mounted once at the app root, always in the DOM.
 */
const GooeyFilter: React.FC<GooeyFilterProps> = ({ blur = 8 }) => {
  return (
    <svg className="absolute w-0 h-0" aria-hidden="true">
      <defs>
        <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

export default React.memo(GooeyFilter)
