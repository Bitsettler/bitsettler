import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, ClockIcon } from '@phosphor-icons/react/dist/ssr'

interface NewsArticle {
  id: string
  title: string
  description: string
  category: string
  date: string
  readTime: string
  featured?: boolean
}

// Placeholder news articles
const newsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Major World Update: The Astral Convergence',
    description:
      'Explore new mystical regions, encounter powerful astral creatures, and discover rare Astralite resources in this massive content update.',
    category: 'Game Update',
    date: '2024-01-15',
    readTime: '5 min read',
    featured: true
  },
  {
    id: '2',
    title: 'Profession Mastery System Introduced',
    description: 'Advanced crafting techniques and specialization paths now available for all professions.',
    category: 'Feature',
    date: '2024-01-10',
    readTime: '3 min read'
  },
  {
    id: '3',
    title: 'Community Spotlight: Epic Castle Build',
    description: 'Player showcases an incredible fortress built entirely from Celestium blocks.',
    category: 'Community',
    date: '2024-01-08',
    readTime: '2 min read'
  },
  {
    id: '4',
    title: 'Trading Post Improvements',
    description: 'Enhanced search filters and bulk trading options now live.',
    category: 'Update',
    date: '2024-01-05',
    readTime: '4 min read'
  },
  {
    id: '5',
    title: 'New Creature: The Ethereal Drake',
    description: 'A mysterious new creature has been spotted in the northern wastes.',
    category: 'Discovery',
    date: '2024-01-03',
    readTime: '3 min read'
  }
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Game Update': 'bg-blue-100 border-blue-200 text-blue-800',
    Feature: 'bg-green-100 border-green-200 text-green-800',
    Community: 'bg-purple-100 border-purple-200 text-purple-800',
    Update: 'bg-orange-100 border-orange-200 text-orange-800',
    Discovery: 'bg-yellow-100 border-yellow-200 text-yellow-800'
  }
  return colors[category] || 'bg-gray-100 border-gray-200 text-gray-800'
}

export function NewsSection() {
  const featuredArticle = newsArticles.find((article) => article.featured)
  const regularArticles = newsArticles.filter((article) => !article.featured)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Latest Bitcraft News</h2>
        <p className="text-muted-foreground">
          Stay updated with the latest game updates, features, and community highlights
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Featured Article - Takes full height */}
        {featuredArticle && (
          <Card className="lg:row-span-2">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getCategoryColor(featuredArticle.category)}>
                  {featuredArticle.category}
                </Badge>
                <Badge variant="outline" className="border-yellow-200 bg-yellow-100 text-yellow-800">
                  Featured
                </Badge>
              </div>
              <CardTitle className="text-xl">{featuredArticle.title}</CardTitle>
              <CardDescription className="text-base">{featuredArticle.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {formatDate(featuredArticle.date)}
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {featuredArticle.readTime}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regular Articles Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          {regularArticles.map((article) => (
            <Card key={article.id} className="flex flex-col">
              <CardHeader className="flex-1 space-y-3">
                <Badge variant="outline" className={`w-fit ${getCategoryColor(article.category)}`}>
                  {article.category}
                </Badge>
                <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                <CardDescription className="text-sm">{article.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {formatDate(article.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {article.readTime}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          🚀 More news and articles coming soon! Stay tuned for developer blogs, patch notes, and community features.
        </p>
      </div>
    </div>
  )
}
