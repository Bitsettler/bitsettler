import { TreeViewIcon } from '@/src/components/icons/tree-view-icon'
import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32
}

export const contentType = 'image/svg+xml'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '10%'
        }}
      >
        <TreeViewIcon width={28} height={28} style={{ color: 'white' }} />
      </div>
    ),
    {
      ...size
    }
  )
}
