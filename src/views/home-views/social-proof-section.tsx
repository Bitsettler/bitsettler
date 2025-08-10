import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Users, Calculator, TrendingUp } from 'lucide-react'

export function SocialProofSection() {
  return (
    <section className="py-12">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="text-center p-6">
            <CardContent className="space-y-2 p-0">
              <div className="text-3xl font-bold text-blue-600">30K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="space-y-2 p-0">
              <div className="text-3xl font-bold text-green-600">500K+</div>
              <div className="text-sm text-muted-foreground">Recipes Calculated</div>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="space-y-2 p-0">
              <div className="text-3xl font-bold text-purple-600">2,000+</div>
              <div className="text-sm text-muted-foreground">Game Items Tracked</div>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="space-y-2 p-0">
              <div className="text-3xl font-bold text-orange-600">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </CardContent>
          </Card>
        </div>

        {/* Community Testimonials */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-sm px-3 py-1">
              💬 Community Love
            </Badge>
            <h3 className="text-2xl font-bold">Trusted by BitCraft Players Worldwide</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground">
                  "Bitsettler has completely transformed how we manage our settlement. 
                  The real-time treasury tracking and member coordination tools are game-changers!"
                </blockquote>
                <div className="space-y-1">
                  <div className="font-medium text-sm">Sarah_Crafter</div>
                  <div className="text-xs text-muted-foreground">Settlement Leader • 150+ Members</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground">
                  "The recipe calculator saved me hours of planning for our massive building project. 
                  The visual dependency trees make complex crafting so much easier to understand."
                </blockquote>
                <div className="space-y-1">
                  <div className="font-medium text-sm">MasterBuilder_92</div>
                  <div className="text-xs text-muted-foreground">Project Manager • 5,000+ Items Crafted</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-muted-foreground">
                  "As a new player, the comprehensive compendium and guides helped me learn the game so much faster. 
                  The search functionality is incredible!"
                </blockquote>
                <div className="space-y-1">
                  <div className="font-medium text-sm">NewAdventurer</div>
                  <div className="text-xs text-muted-foreground">New Player • 2 Weeks Active</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="border-t pt-8">
          <div className="text-center space-y-4">
            <h4 className="text-lg font-semibold">Trusted & Secure</h4>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>OAuth Security</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Community Driven</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
