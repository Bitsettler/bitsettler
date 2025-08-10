import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SITE_CONFIG } from '@/config/site-config'

export function ContactSection() {
  return (
    <section className="py-16">
      {/* <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Questions, suggestions, or just want to say hello? We'd love to hear from you!
        </p>
      </div> */}

      {/* <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Connect with Us</CardTitle>
          <p className="text-muted-foreground">
            Join our community and stay updated with the latest features
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-foreground mb-3 text-lg font-semibold">
              💬 Community & Support
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Discord Community
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Join our Discord server for real-time support, feature
                    requests, and community discussions.{' '}
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
                  <h4 className="text-foreground font-medium">
                    GitHub Issues
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Found a bug or have a feature request? Open an issue on
                    our GitHub repository.{' '}
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
              Thanks for being part of the {SITE_CONFIG.name} community!
              🎮❤️
            </p>
          </div>
        </CardContent>
      </Card> */}
    </section>
  )
}
