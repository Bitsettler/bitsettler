import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SITE_CONFIG } from '@/config/site-config'

export function TechStackSection() {
  return (
    <section className="py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Built with Modern Technology</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Powered by cutting-edge web technologies for the best user experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Tech Stack</CardTitle>
            <Badge variant="secondary" className="text-sm">
              Open Source
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Every component carefully chosen for performance and scalability
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-foreground mb-3 text-lg font-semibold">
              ⚡ Core Technologies
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Next.js 15 & React
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Built on the latest Next.js framework with React for
                    optimal performance and developer experience.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    TypeScript
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Full TypeScript support ensures type safety and better
                    maintainability across the entire codebase.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Tailwind CSS & shadcn/ui
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Beautiful, responsive design system with Tailwind CSS
                    and carefully crafted shadcn/ui components.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    React Flow
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Interactive flow diagrams powered by React Flow for
                    visualizing complex recipe dependencies.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-pink-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Supabase
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Secure authentication and real-time database for settlement
                    management and user data.
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
    </section>
  )
}
