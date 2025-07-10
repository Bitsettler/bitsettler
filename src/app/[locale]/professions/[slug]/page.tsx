import { Container } from '@/components/container'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getProfessionBySlug } from '@/lib/spacetime-db'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface ProfessionPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export default async function ProfessionPage({ params }: ProfessionPageProps) {
  const { slug } = await params
  const profession = getProfessionBySlug(slug)

  if (!profession) {
    notFound()
  }

  return (
    <Container>
      <div className="space-y-8 py-8">
        {/* Profession Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-xl">
              <Image
                src={`/assets/Skill/${profession.actualIconPath}.webp`}
                alt={profession.name}
                width={64}
                height={64}
                className="rounded"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold">{profession.name}</h1>
                <Badge variant="outline" className={profession.color}>
                  {profession.skillCategory.tag}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xl">{profession.title}</p>
              <p className="text-lg">{profession.description}</p>
            </div>
          </div>
        </div>

        {/* Profession Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Information</CardTitle>
            <CardDescription>Basic details about this profession</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Skill ID</p>
                <p className="text-2xl font-bold">{profession.skillType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Max Level</p>
                <p className="text-2xl font-bold">{profession.maxLevel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Category</p>
                <p className="text-lg font-semibold">{profession.skillCategory.tag}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Database ID</p>
                <p className="text-lg font-semibold">#{profession.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recipes & Crafting</CardTitle>
              <CardDescription>Items you can craft with this skill</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="space-y-3 text-center">
                  <p className="text-muted-foreground">🛠️ Coming Soon!</p>
                  <p className="text-muted-foreground text-sm">Detailed recipes, materials, and crafting guides</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skill Progression</CardTitle>
              <CardDescription>Leveling guide and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="space-y-3 text-center">
                  <p className="text-muted-foreground">📈 Coming Soon!</p>
                  <p className="text-muted-foreground text-sm">XP requirements, unlocks, and optimization tips</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools & Equipment</CardTitle>
              <CardDescription>Required tools and recommended gear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="space-y-3 text-center">
                  <p className="text-muted-foreground">⚒️ Coming Soon!</p>
                  <p className="text-muted-foreground text-sm">Tool requirements, efficiency bonuses, and upgrades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources & Locations</CardTitle>
              <CardDescription>Where to gather materials and practice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="space-y-3 text-center">
                  <p className="text-muted-foreground">🗺️ Coming Soon!</p>
                  <p className="text-muted-foreground text-sm">
                    Resource locations, gathering spots, and efficiency tips
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}
