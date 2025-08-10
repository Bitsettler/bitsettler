import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SITE_CONFIG } from '@/config/site-config'

export function AboutSection() {
  return (
    <section id="about" className="py-16">

      {/* <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Our Mission</CardTitle>
            <Badge variant="default" className="text-sm">
              Community Driven
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Empowering BitCraft players with accurate data and powerful tools
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-foreground mb-3 text-lg font-semibold">
              🎯 What We Do
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Interactive Recipe Calculator
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Visualize complex crafting trees and calculate exact
                    material requirements for any item in BitCraft. Our
                    calculator shows you every step of the crafting process.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Settlement Management
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Track your settlement's progress, manage member contributions,
                    and monitor resource flows with our real-time dashboard.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Real Game Data
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    All our data comes directly from BitCraft server files,
                    ensuring 100% accuracy and up-to-date information with
                    every game update.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-foreground mb-3 text-lg font-semibold">
              🌟 Why Choose Us
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Free & Open Source
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {SITE_CONFIG.name} is completely free to use and open
                    source. We believe knowledge should be accessible to all
                    BitCraft players.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    No Ads, No Tracking
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    We respect your privacy. No ads, no user tracking, no
                    data collection. Just pure, useful tools for BitCraft
                    players.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-teal-500"></div>
                <div>
                  <h4 className="text-foreground font-medium">
                    Modern & Fast
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Built with modern web technologies for lightning-fast
                    performance. Works great on desktop and mobile devices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="pt-4 text-center">
            <p className="text-muted-foreground text-sm">
              Join thousands of BitCraft players who trust{' '}
              {SITE_CONFIG.name} for their crafting needs! 🚀
            </p>
          </div>
        </CardContent>
      </Card> */}
    </section>
  )
}
