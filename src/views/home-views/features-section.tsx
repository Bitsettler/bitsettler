import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { 
  Calculator, 
  Users, 
  BarChart3, 
  Coins, 
  Target, 
  BookOpen, 
  Shield, 
  Zap,
  ChevronRight,
  TrendingUp,
  Building,
  Package,
  ArrowRight
} from 'lucide-react'

export function FeaturesSection() {
  return (
    <section className="py-16">
      <div className="space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">
            Everything You Need to Master BitCraft
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From crafting optimization to settlement leadership, Bitsettler provides the tools 
            and insights to excel in every aspect of the game.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Settlement Management */}
          <Card className="border-2 hover:border-primary/50 transition-colors group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="secondary">Core Feature</Badge>
              </div>
              <CardTitle className="text-xl">Settlement Management</CardTitle>
              <CardDescription>
                Complete real-time dashboard for settlement leaders and members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  Live treasury tracking with automatic updates
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  Member skills analysis and progression tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  Project management with contribution tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  Role-based permissions matching game hierarchy
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Link href="/en/settlement" className="flex items-center justify-center gap-2">
                  Manage Settlement
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recipe Calculator */}
          <Card className="border-2 hover:border-green-500/50 transition-colors group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <Badge variant="secondary">Most Popular</Badge>
              </div>
              <CardTitle className="text-xl">Smart Recipe Calculator</CardTitle>
              <CardDescription>
                Advanced crafting optimization with dependency visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  Interactive recipe trees with visual flow diagrams
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  Bulk quantity calculations for mass production
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  Resource optimization and bottleneck analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  Export recipes for settlement coordination
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full group-hover:bg-green-500 group-hover:text-white transition-colors">
                <Link href="/calculator" className="flex items-center justify-center gap-2">
                  Try Calculator
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Game Data Compendium */}
          <Card className="border-2 hover:border-purple-500/50 transition-colors group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge variant="secondary">Comprehensive</Badge>
              </div>
              <CardTitle className="text-xl">Complete Game Database</CardTitle>
              <CardDescription>
                Searchable compendium of all BitCraft items, buildings, and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-500 rounded-full" />
                  2,000+ items with detailed stats and descriptions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-500 rounded-full" />
                  Building guides with placement requirements
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-500 rounded-full" />
                  Equipment comparisons and progression paths
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-purple-500 rounded-full" />
                  Advanced search with filters and categories
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Link href="/compendium" className="flex items-center justify-center gap-2">
                  Browse Compendium
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Secondary Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-8">
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold">Analytics & Insights</h3>
              <p className="text-sm text-muted-foreground">
                Track settlement performance, member activity, and resource trends over time
              </p>
            </div>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold">Member Coordination</h3>
              <p className="text-sm text-muted-foreground">
                Skill tracking, role management, and contribution monitoring for your team
              </p>
            </div>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground">
                Live data integration with BitJita API for up-to-date game information
              </p>
            </div>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="font-semibold">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                OAuth authentication with role-based access control and data protection
              </p>
            </div>
          </Card>

        </div>



      </div>
    </section>
  )
}
