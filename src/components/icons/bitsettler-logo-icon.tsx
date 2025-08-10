import React from 'react'

export function BitsettlerLogoIcon(
  props: React.ComponentPropsWithoutRef<'svg'> & {
    width?: number
    height?: number
  }
) {
  const { width = 24, height = 24, ...rest } = props
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 256 256"
      fill="none"
      {...rest}
    >
      <g stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
        <path d="M64 56 Q64 144 128 196 Q192 144 192 56" />
        <path d="M88 140 128 112 168 140" />
        <path d="M100 140V168H156V140" />
        <path d="M124 168V152h8V168" />
        <circle cx="128" cy="76" r="8" />
        <path d="M128 52V64M128 88V100M104 76H116M140 76H152" />
      </g>
    </svg>
  )
}

// Outline variant (same as above, for consistency)
export function BitsettlerIconOutline(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="none" {...props}>
      <g stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
        <path d="M64 56 Q64 144 128 196 Q192 144 192 56" />
        <path d="M88 140 128 112 168 140" />
        <path d="M100 140V168H156V140" />
        <path d="M124 168V152h8V168" />
        <circle cx="128" cy="76" r="8" />
        <path d="M128 52V64M128 88V100M104 76H116M140 76H152" />
      </g>
    </svg>
  );
}
