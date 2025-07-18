import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SITE_CONFIG } from '@/config/site-config'
import { I18N_CONFIG } from '@/i18n/config'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
  return I18N_CONFIG.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `About - ${SITE_CONFIG.name}`,
    description: `Learn about ${SITE_CONFIG.name} - the comprehensive crafting calculator and guide for BitCraft players.`
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">About {SITE_CONFIG.name}</h1>
            <p className="text-muted-foreground text-lg">
              Your comprehensive guide and crafting calculator for BitCraft
            </p>
          </div>

          {/* Mission Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Our Mission</CardTitle>
                <Badge variant="default" className="text-sm">
                  Community Driven
                </Badge>
              </div>
              <p className="text-muted-foreground">Empowering BitCraft players with accurate data and powerful tools</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🎯 What We Do</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Interactive Recipe Calculator</h4>
                      <p className="text-muted-foreground text-sm">
                        Visualize complex crafting trees and calculate exact material requirements for any item in
                        BitCraft. Our calculator shows you every step of the crafting process.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Comprehensive Item Database</h4>
                      <p className="text-muted-foreground text-sm">
                        Access detailed information about all items, resources, and cargo in BitCraft. Search, filter,
                        and explore the complete game catalog.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Real Game Data</h4>
                      <p className="text-muted-foreground text-sm">
                        All our data comes directly from BitCraft server files, ensuring 100% accuracy and up-to-date
                        information with every game update.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">🌟 Why Choose Us</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Free & Open Source</h4>
                      <p className="text-muted-foreground text-sm">
                        {SITE_CONFIG.name} is completely free to use and open source. We believe knowledge should be
                        accessible to all BitCraft players.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">No Ads, No Tracking</h4>
                      <p className="text-muted-foreground text-sm">
                        We respect your privacy. No ads, no user tracking, no data collection. Just pure, useful tools
                        for BitCraft players.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-teal-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Modern & Fast</h4>
                      <p className="text-muted-foreground text-sm">
                        Built with modern web technologies for lightning-fast performance. Works great on desktop and
                        mobile devices.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Join thousands of BitCraft players who trust {SITE_CONFIG.name} for their crafting needs! 🚀
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technology Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Built with Modern Technology</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  Open Source
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Powered by cutting-edge web technologies for the best user experience
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">⚡ Tech Stack</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Next.js 15 & React</h4>
                      <p className="text-muted-foreground text-sm">
                        Built on the latest Next.js framework with React for optimal performance and developer
                        experience.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">TypeScript</h4>
                      <p className="text-muted-foreground text-sm">
                        Full TypeScript support ensures type safety and better maintainability across the entire
                        codebase.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Tailwind CSS & shadcn/ui</h4>
                      <p className="text-muted-foreground text-sm">
                        Beautiful, responsive design system with Tailwind CSS and carefully crafted shadcn/ui
                        components.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">React Flow</h4>
                      <p className="text-muted-foreground text-sm">
                        Interactive flow diagrams powered by React Flow for visualizing complex recipe dependencies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Want to contribute? Check out our{' '}
                  <a
                    href={SITE_CONFIG.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline"
                  >
                    GitHub repository
                  </a>
                  ! 💻✨
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
              <p className="text-muted-foreground">
                {"Questions, suggestions, or just want to say hello? We'd love to hear from you!"}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-foreground mb-3 text-lg font-semibold">💬 Connect with Us</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Discord Community</h4>
                      <p className="text-muted-foreground text-sm">
                        Join our Discord server for real-time support, feature requests, and community discussions.{' '}
                        <a
                          href={SITE_CONFIG.links.discord}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:underline"
                        >
                          Join Discord
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gray-500"></div>
                    <div>
                      <h4 className="text-foreground font-medium">GitHub Issues</h4>
                      <p className="text-muted-foreground text-sm">
                        Found a bug or have a feature request? Open an issue on our GitHub repository.{' '}
                        <a
                          href={`${SITE_CONFIG.links.github}/issues`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:underline"
                        >
                          Report Issue
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></div>
                    <div>
                      <h4 className="text-foreground font-medium">Twitter/X</h4>
                      <p className="text-muted-foreground text-sm">
                        Follow us for updates and BitCraft community content.{' '}
                        <a
                          href={SITE_CONFIG.links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:underline"
                        >
                          Follow @{SITE_CONFIG.name.replace(/\s+/g, '')}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="pt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Thanks for being part of the {SITE_CONFIG.name} community! 🎮❤️
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
}
