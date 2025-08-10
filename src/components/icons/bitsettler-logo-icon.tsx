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
      role="img"
      aria-label="BitSettler logo"
      {...rest}
    >
      {/* Hexagon outline */}
      <path d="M128 20 216 70v116l-88 50-88-50V70z"
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinejoin="round"/>

      {/* House (roof + body, filled) */}
      <path d="M86 136l42-30 42 30v52H86z"
            fill="currentColor"/>

      {/* Claim flag (pole + flag) */}
      <path d="M128 106V76"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"/>
      <path d="M128 88l36-12-36-12z"
            fill="currentColor"/>
    </svg>
  )
}

// Outline variant (same as above, for consistency)
export function BitsettlerIconOutline(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" role="img" aria-label="BitSettler logo" {...props}>
      {/* Hexagon outline */}
      <path d="M128 20 216 70v116l-88 50-88-50V70z"
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinejoin="round"/>

      {/* House (roof + body, filled) */}
      <path d="M86 136l42-30 42 30v52H86z"
            fill="currentColor"/>

      {/* Claim flag (pole + flag) */}
      <path d="M128 106V76"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"/>
      <path d="M128 88l36-12-36-12z"
            fill="currentColor"/>
    </svg>
  );
}
