import { cn } from '@/lib/utils'

export function Container({
  children,
  className,
  ...rest
}: { children: React.ReactNode } & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('@container mx-auto px-4 sm:px-6 lg:px-8', className)} {...rest}>
      {children}
    </div>
  )
}
