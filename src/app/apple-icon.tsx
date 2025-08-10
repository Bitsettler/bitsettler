import { BitsettlerLogoIcon } from '@/components/icons/bitsettler-logo-icon'
import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '22%'
        }}
      >
        <BitsettlerLogoIcon width={140} height={140} style={{ color: 'white' }} />
      </div>
    ),
    {
      ...size
    }
  )
}
