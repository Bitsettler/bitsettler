import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ChangelogVersion, ChangelogItem } from '@/lib/changelog-parser'

interface DynamicChangelogProps {
  versions: ChangelogVersion[]
}

export function DynamicChangelog({ versions }: DynamicChangelogProps) {
  return (
    <>
      {versions.map((version, index) => (
        <Card key={version.version} className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                v{version.version} {version.title}
              </CardTitle>
              <Badge variant={index === 0 ? "default" : "secondary"} className="text-sm">
                {index === 0 ? "Latest" : "Previous"}
              </Badge>
            </div>
            {version.description && (
              <p className="text-muted-foreground">
                {version.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Added Section */}
            {version.added.length > 0 && (
              <ChangelogSection
                title="Added"
                icon="✨"
                items={version.added}
                dotColor="bg-green-500"
              />
            )}

            {/* Enhanced/Improved Section */}
            {version.enhanced.length > 0 && (
              <ChangelogSection
                title="Enhanced"
                icon="🚀"
                items={version.enhanced}
                dotColor="bg-blue-500"
              />
            )}

            {/* Fixed Section */}
            {version.fixed.length > 0 && (
              <>
                {(version.added.length > 0 || version.enhanced.length > 0) && <Separator />}
                <ChangelogSection
                  title="Fixed"
                  icon="🔧"
                  items={version.fixed}
                  dotColor="bg-orange-500"
                />
              </>
            )}

            {/* Changed Section */}
            {version.changed.length > 0 && (
              <>
                {(version.added.length > 0 || version.enhanced.length > 0 || version.fixed.length > 0) && <Separator />}
                <ChangelogSection
                  title="Changed"
                  icon="🔄"
                  items={version.changed}
                  dotColor="bg-purple-500"
                />
              </>
            )}

            {/* Removed Section */}
            {version.removed.length > 0 && (
              <>
                {(version.added.length > 0 || version.enhanced.length > 0 || version.fixed.length > 0 || version.changed.length > 0) && <Separator />}
                <ChangelogSection
                  title="Removed"
                  icon="🗑️"
                  items={version.removed}
                  dotColor="bg-red-500"
                />
              </>
            )}

            {/* Technical Section */}
            {version.technical.length > 0 && (
              <>
                {(version.added.length > 0 || version.enhanced.length > 0 || version.fixed.length > 0 || version.changed.length > 0 || version.removed.length > 0) && <Separator />}
                <ChangelogSection
                  title="Technical Improvements"
                  icon="⚙️"
                  items={version.technical}
                  dotColor="bg-gray-500"
                />
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  )
}

interface ChangelogSectionProps {
  title: string
  icon: string
  items: ChangelogItem[]
  dotColor: string
}

function ChangelogSection({ title, icon, items, dotColor }: ChangelogSectionProps) {
  return (
    <div>
      <h3 className="text-foreground mb-3 text-lg font-semibold">
        {icon} {title}
      </h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index}>
            {/* Main item title */}
            <div className="flex items-start gap-3 mb-2">
              <div className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`}></div>
              <div>
                <h4 className="text-foreground font-medium">
                  {item.title}
                </h4>
              </div>
            </div>
            
            {/* Sub-items */}
            {item.items.length > 0 && (
              <div className="ml-6 space-y-2">
                {item.items.map((subItem, subIndex) => (
                  <div key={subIndex} className="flex items-start gap-3">
                    <div className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor} opacity-60`}></div>
                    <p className="text-muted-foreground text-sm">
                      {subItem}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
