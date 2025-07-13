import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { getAllProfessions, getProfessionsByType, type Profession } from '@/lib/spacetime-db'
import Image from 'next/image'

function ProfessionCard({ profession }: { profession: Profession }) {
  return (
    <Link href={`/professions/${profession.slug}`} className="block h-full">
      <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                <Image
                  src={`/assets/Skill/${profession.actualIconPath}.webp`}
                  alt={profession.name}
                  width={32}
                  height={32}
                  className="rounded"
                />
              </div>
              <div>
                <CardTitle className="group-hover:text-primary text-lg transition-colors">{profession.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{profession.title}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <CardDescription className="line-clamp-3 text-sm">{profession.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ProfessionsSection() {
  const professionSkills = getProfessionsByType('Profession')
  const adventureSkills = getProfessionsByType('Adventure')
  const allProfessions = getAllProfessions()

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Professions & Skills</h2>
        <p className="text-muted-foreground">
          Master various skills to craft, build, and explore in the world of Bitcraft
        </p>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>{allProfessions.length} Total Skills</span>
          <span>•</span>
          <span>{professionSkills.length} Profession Skills</span>
          <span>•</span>
          <span>{adventureSkills.length} Adventure Skills</span>
        </div>
      </div>

      {/* Profession Skills */}
      {professionSkills.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Profession Skills</h3>
            <p className="text-muted-foreground text-sm">Craft and create items, structures, and consumables</p>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionSkills.map((profession) => (
              <ProfessionCard key={profession.id} profession={profession} />
            ))}
          </div>
        </div>
      )}

      {/* Adventure Skills */}
      {adventureSkills.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Adventure Skills</h3>
            <p className="text-muted-foreground text-sm">Explore, gather resources, and survive in the wilderness</p>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adventureSkills.map((profession) => (
              <ProfessionCard key={profession.id} profession={profession} />
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          🎯 Each skill can be leveled up to {professionSkills[0]?.maxLevel || 110} for mastery bonuses and advanced
          recipes!
        </p>
      </div>
    </div>
  )
}
