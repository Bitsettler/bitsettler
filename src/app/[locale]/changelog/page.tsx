import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SITE_CONFIG } from '@/src/config/site-config'
import { I18N_CONFIG } from '@/src/i18n/config'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
  return I18N_CONFIG.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Changelog - ${SITE_CONFIG.name}`,
    description: `Track the latest updates and improvements to ${SITE_CONFIG.name}`
  }
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">Changelog</h1>
            <p className="text-muted-foreground text-lg">
              Track the latest updates and improvements to {SITE_CONFIG.name}
            </p>
          </div>

          {/* Version Card - v1.3.1 Favicon & Structure */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1.3.1 Favicon & Structure</CardTitle>
                <Badge variant="default" className="text-sm">
                  Latest
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Patch update: new tree-view favicon, improved project structure, and middleware fixes
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
                      <h4 className="text-foreground font-medium">Tree-View Favicon</h4>
                      <p className="text-muted-foreground text-sm">
                        New tree-view favicon and app icon with dynamic generation using Next.js 13+ conventions. The
                        icon represents the hierarchical nature of crafting recipes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Improved Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🔄 Improved</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Project Structure</h4>
                      <p className="text-muted-foreground text-sm">
                        Consolidated duplicate lib folders into a single organized structure for better maintainability
                        and cleaner imports throughout the application.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fixed Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🐛 Fixed</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Dynamic Icon Generation</h4>
                      <p className="text-muted-foreground text-sm">
                        Fixed middleware configuration to properly handle dynamic favicon and icon generation routes,
                        ensuring icons display correctly in all browsers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">New branding and improved project structure! 🌳✨</p>
              </div>
            </CardContent>
          </Card>

          {/* Version Card - v1.3.0 Debug & UX Improvements */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1.3.0 Debug & UX Improvements</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  Previous
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Minor update: debug mode, improved quantity logic, and better user feedback for recipe calculator
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
                      <h4 className="text-foreground font-medium">Debug Mode</h4>
                      <p className="text-muted-foreground text-sm">
                        When running in development mode, item and recipe IDs are displayed in each node for easier
                        debugging and data validation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Toast Notifications</h4>
                      <p className="text-muted-foreground text-sm">
                        Added toast notifications (using shadcn/ui Sonner) to inform users when they attempt to set a
                        quantity below the minimum craftable amount. All toast messages are now fully internationalized.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Helper Text for Minimum Quantity</h4>
                      <p className="text-muted-foreground text-sm">
                        The calculator now displays a helper message below the quantity input, showing the minimum
                        allowed value for each recipe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Improved Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🔄 Improved</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Quantity Input Logic</h4>
                      <p className="text-muted-foreground text-sm">
                        The quantity input now defaults to the recipe&apos;s output amount, and users can freely type
                        any value. Validation and correction occur on blur, with clear feedback.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">User Feedback</h4>
                      <p className="text-muted-foreground text-sm">
                        Users are now clearly informed when they attempt to set a quantity below the minimum, and the
                        input is automatically corrected.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fixed Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🐛 Fixed</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Material Quantity Calculation</h4>
                      <p className="text-muted-foreground text-sm">
                        Material requirements now correctly scale with recipe output (e.g., 1 plank for 10 buckets), and
                        all child/descendant node quantities are accurate for all recipes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Debug mode, smarter quantity logic, and better user feedback for a smoother crafting experience! 🛠️✨
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version Card - v1.2.0 Internationalization */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1.2.0 Internationalization</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  Previous
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Major update: full internationalization support with English, French, and Spanish languages
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
                      <h4 className="text-foreground font-medium">Full Internationalization Support</h4>
                      <p className="text-muted-foreground text-sm">
                        Complete i18n support with English, French, and Spanish languages. All UI text is now
                        translatable and the site automatically adapts to the user&apos;s language preference.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Language Switcher</h4>
                      <p className="text-muted-foreground text-sm">
                        Added a language switcher component in the header allowing users to easily switch between
                        supported languages with a dropdown menu.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Translated Metadata</h4>
                      <p className="text-muted-foreground text-sm">
                        Page titles and descriptions are now translated for better SEO and user experience in each
                        supported language.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Type Safety Improvements</h4>
                      <p className="text-muted-foreground text-sm">
                        Added exported locale and language types for better TypeScript support and consistency across
                        the application.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Changed Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🔄 Changed</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">UI Text Internationalization</h4>
                      <p className="text-muted-foreground text-sm">
                        Replaced all hardcoded UI text with translation keys. The entire interface now supports multiple
                        languages seamlessly.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Metadata Generation</h4>
                      <p className="text-muted-foreground text-sm">
                        Updated metadata generation to use translations instead of hardcoded site config values for
                        better localization support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Technical Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">⚙️ Technical</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Next.js Internationalization</h4>
                      <p className="text-muted-foreground text-sm">
                        Integrated next-intl for robust internationalization support with automatic locale detection and
                        static generation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Translation Files</h4>
                      <p className="text-muted-foreground text-sm">
                        Created comprehensive translation files: messages/en.json, messages/fr.json, messages/es.json
                        with all UI text properly organized.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Component Updates</h4>
                      <p className="text-muted-foreground text-sm">
                        Updated all components to use translation hooks and removed hardcoded text throughout the
                        application.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Complete internationalization support with three languages! 🌍✨
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version Card - v1.1.0 Enhanced Recipe System */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1.1.0 Enhanced Recipe System</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  Previous
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
                        Fixed recipe output showing raw IDs instead of item names in the Usage section. Now displays
                        proper names like &quot;Produces: 1x Refined Rough Cloth&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Patch release with important bug fixes and data corrections! 🔧
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version Card - v1.0.0 Initial Release */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">v1.0.0 Initial Release</CardTitle>
                <Badge variant="outline" className="text-sm">
                  First Release
                </Badge>
              </div>
              <p className="text-muted-foreground">Initial release of the {SITE_CONFIG.name} web application</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* New Features Section */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">✨ New Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Interactive Recipe Visualizer</h4>
                      <p className="text-muted-foreground text-sm">
                        Visual flow diagrams showing crafting dependencies and requirements for any item in the game.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Quantity Calculator</h4>
                      <p className="text-muted-foreground text-sm">
                        Calculate exact material requirements for any desired output quantity with automatic recipe
                        scaling.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Comprehensive Item Database</h4>
                      <p className="text-muted-foreground text-sm">
                        Search through all items, cargo, and resources with detailed information including tier, rarity,
                        and category.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Multi-language Support</h4>
                      <p className="text-muted-foreground text-sm">
                        Internationalization support for English, French, and Spanish with easy language switching.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Modern Responsive UI</h4>
                      <p className="text-muted-foreground text-sm">
                        Beautiful, responsive interface built with shadcn/ui components and Tailwind CSS, optimized for
                        both desktop and mobile.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Technical Features */}
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">⚙️ Technical Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Real Game Data Integration</h4>
                      <p className="text-muted-foreground text-sm">
                        Built using actual game data from BitCraft server files, ensuring accuracy and completeness.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Performance Optimized</h4>
                      <p className="text-muted-foreground text-sm">
                        Virtualized search, efficient data structures, and optimized rendering for smooth performance
                        even with large datasets.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">TypeScript & Modern Stack</h4>
                      <p className="text-muted-foreground text-sm">
                        Built with Next.js 15, TypeScript, and modern React patterns for maintainability and type
                        safety.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Footer */}
              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  This marks the first MVP release of the {SITE_CONFIG.name} web app. 🎉
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
}
