import React from 'react'

export function BitsettlerLogoLarge(
  props: React.ComponentPropsWithoutRef<'svg'> & {
    width?: number
    height?: number
    showText?: boolean
  }
) {
  const { width = 200, height = 200, showText = false, ...rest } = props
  
  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 400 400"
        fill="currentColor"
        {...rest}
      >
        {/* Settlement Badge Background with enhanced styling */}
        <defs>
          <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
        
        <path 
          d="M200 40 L280 80 L320 160 L280 240 L200 280 L120 240 L80 160 L120 80 Z" 
          fill="url(#badgeGradient)" 
          stroke="currentColor" 
          strokeWidth="6" 
        />
        
        {/* House Icon with more detail */}
        <path 
          d="M160 180 L200 140 L240 180 L240 220 L220 220 L220 200 L180 200 L180 220 L160 220 Z" 
          fill="currentColor"
        />
        <rect x="190" y="200" width="20" height="20" fill="currentColor"/>
        
        {/* Enhanced Star/Gear Element */}
        <g transform="translate(200, 100)">
          {/* Outer glow effect */}
          <circle cx="0" cy="0" r="12" fill="currentColor" opacity="0.3"/>
          {/* Center circle */}
          <circle cx="0" cy="0" r="8" fill="currentColor"/>
          {/* Main star points */}
          <path 
            d="M0,-20 L4,-8 L0,-6 L-4,-8 Z M20,0 L8,4 L6,0 L8,-4 Z M0,20 L-4,8 L0,6 L4,8 Z M-20,0 L-8,-4 L-6,0 L-8,4 Z" 
            fill="currentColor"
          />
          {/* Diagonal star points */}
          <path 
            d="M14,-14 L10,-6 L8,-8 L6,-10 Z M14,14 L6,10 L8,8 L10,6 Z M-14,14 L-10,6 L-8,8 L-6,10 Z M-14,-14 L-6,-10 L-8,-8 L-10,-6 Z" 
            fill="currentColor"
          />
        </g>
      </svg>
      
      {showText && (
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Bitsettler</h1>
          <p className="text-lg text-muted-foreground mt-2">Settlement Management for BitCraft</p>
        </div>
      )}
    </div>
  )
}
