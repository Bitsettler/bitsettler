import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function ChangelogPage() {
  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">Changelog</h1>
            <p className="text-muted-foreground text-lg">Track the latest updates and improvements to BitCraft Guide</p>
          </div>

          {/* Version Card - v1.1.0 Enhanced Recipe System */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1.1.0 Enhanced Recipe System</CardTitle>
                <Badge variant="default" className="text-sm">
                  Latest
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Major update: comprehensive recipe system improvements, data fixes, and enhanced user experience
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Features Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">✨ New Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Enhanced Info Panel</h4>
                      <p className="text-muted-foreground text-sm">
                        Added item descriptions, improved badge styling for tier/rarity/category, and better recipe
                        requirement display with proper lookup tables from game data.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Material Node Recipe Support</h4>
                      <p className="text-muted-foreground text-sm">
                        Material nodes now support recipe selection and display recipe requirements, matching the
                        functionality of item nodes for complete recipe tree visibility.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Improved Layout Algorithm</h4>
                      <p className="text-muted-foreground text-sm">
                        Switched from depth-first to breadth-first ranking for better recipe tree visualization with
                        more compact node spacing.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Enhanced Search Experience</h4>
                      <p className="text-muted-foreground text-sm">
                        Combobox now uses virtualization for fast search in large lists. Results only appear after
                        typing. Popover rendering issues fixed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Fixes Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🗃️ Data Fixes</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Complete Cargo Item Support</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed cargo items (like Rough Plant Roots) missing from the app. Updated mapping script to
                        include all cargo items regardless of compendium_entry field.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Requirements Database</h4>
                      <p className="text-muted-foreground text-sm">
                        Built comprehensive lookup tables from game data for professions, tools, and buildings instead
                        of using placeholder mappings. Now displays accurate requirements like &quot;forestry&quot;,
                        &quot;axe&quot;, &quot;tier-1-forestry-station&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bug Fixes Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🐛 Bug Fixes</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Quantity Calculation</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed child recipe nodes showing incorrect quantities. Now properly calculates quantities by
                        multiplying parent requirements throughout the entire recipe tree.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Output Display</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed recipe output showing raw IDs instead of item names in the Usage section. Now displays
                        proper names like &quot;Produces: 1x Refined Rough Cloth&quot;.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Requirements Visibility</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed recipe requirements showing as empty strings for nodes beyond the 2nd level. Now all nodes
                        in the recipe tree display proper profession, building, and tool requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Complete recipe system overhaul with accurate data and enhanced user experience! 🎯✨
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version Card - v1.0.1 Bug & Data Fixes */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1.0.1 Bug & Data Fixes</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  Previous
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Patch release: bug fixes and data corrections for cargo items and recipe trees
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Fixes Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🗃️ Data Fixes</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Cargo Items Now Appear</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed cargo items missing from the app due to mapping script filtering. Now includes all cargo
                        items regardless of compendium_entry field.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bug Fixes Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🐛 Bug Fixes</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Child Recipe Quantity Calculation</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed child recipe nodes showing Qty: 1 instead of correct quantities based on parent
                        requirements.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Output Display</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed recipe output showing raw IDs instead of item names in the Usage section.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version Card - v1 MVP Release */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1 MVP Release</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  Previous
                </Badge>
              </div>
              <p className="text-muted-foreground">Initial release of the BitCraft Guide web application</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">✨ New Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Crafting Recipe Visualization</h4>
                      <p className="text-muted-foreground text-sm">
                        Visualize crafting recipes and dependencies using ReactFlow
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Item Search & Selection</h4>
                      <p className="text-muted-foreground text-sm">
                        Fast, debounced search for 300+ items with a scrollable, performant dropdown
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Info Panel</h4>
                      <p className="text-muted-foreground text-sm">
                        Displays selected item details, recipe requirements, and usage
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Node Details</h4>
                      <p className="text-muted-foreground text-sm">
                        Shows profession, building, and tool requirements as colored badges
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Mark Items as Done</h4>
                      <p className="text-muted-foreground text-sm">
                        Checkbox in item/material nodes to mark as done, updating colors to green
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Viewport Management</h4>
                      <p className="text-muted-foreground text-sm">
                        Prevents ReactFlow viewport from resetting on recipe selection
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tech & UI Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🛠️ Technical Improvements</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Performance Optimizations</h4>
                      <p className="text-muted-foreground text-sm">
                        Memoized options, limited dropdown results, and efficient edge/node updates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Modern UI Components</h4>
                      <p className="text-muted-foreground text-sm">
                        Uses shadcn/ui components for all UI elements (Combobox, Card, Badge, Checkbox, etc.)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">TypeScript-First Development</h4>
                      <p className="text-muted-foreground text-sm">
                        Functional React components with proper type safety
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fixes Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🐛 Bug Fixes & Improvements</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Name Resolution</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed cryptic recipe names by resolving placeholders (e.g., &ldquo;Carve {0}&rdquo;) to actual
                        item names
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Recipe Requirements Display</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed display of recipe requirements and fallback messages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Performance Issues</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed infinite update loop in edge color updates and React hook usage
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  This marks the first MVP release of the BitCraft Guide web app. 🎉
                </p>
                <p className="text-muted-foreground mt-2 text-xs">Built with Next.js, ReactFlow, and shadcn/ui</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
}
