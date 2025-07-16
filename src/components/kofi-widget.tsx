import Image from 'next/image'

interface KofiWidgetProps {
  className?: string
}

export function KofiWidget({ className }: KofiWidgetProps) {
  return (
    <a href="https://ko-fi.com/T6T71I40QY" target="_blank" rel="noopener noreferrer" className={className}>
      <Image
        src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
        alt="Buy Me a Coffee at ko-fi.com"
        width={150}
        height={36}
        className="border-0"
        style={{ height: '36px' }}
      />
    </a>
  )
}
