import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import {
  getAllSkills,
  getSkillsByCategories,
  getSkillsWithIcons,
  type SkillWithIcon
} from '@/lib/spacetime-db-new/modules/skills/commands'
import { createSlug } from '@/lib/spacetime-db-new/shared/utils/entities'
import Image from 'next/image'

function ProfessionCard({ profession }: { profession: SkillWithIcon }) {
  return (
    <Link href={`/professions/${createSlug(profession.name)}`} className="block h-full">
      <Card className="group flex h-full flex-col transition-all hover:scale-[1.02] hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                <Image
                  src={profession.actualIconPath}
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
  const allSkills = getAllSkills().filter((skill) => skill.name !== 'ANY')
  const professionSkillsWithIcons = getSkillsWithIcons(
    getSkillsByCategories(['Profession']).filter((skill) => skill.name !== 'ANY')
  )
  const adventureSkillsWithIcons = getSkillsWithIcons(
    getSkillsByCategories(['Adventure']).filter((skill) => skill.name !== 'ANY')
  )

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Professions & Skills</h2>
        <p className="text-muted-foreground">
          Master various skills to craft, build, and explore in the world of Bitcraft
        </p>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>{allSkills.length} Total Skills</span>
          <span>•</span>
          <span>{professionSkillsWithIcons.length} Profession Skills</span>
          <span>•</span>
          <span>{adventureSkillsWithIcons.length} Adventure Skills</span>
        </div>
      </div>

      {/* Profession Skills */}
      {professionSkillsWithIcons.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Profession Skills</h3>
            <p className="text-muted-foreground text-sm">Craft and create items, structures, and consumables</p>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionSkillsWithIcons.map((profession) => (
              <ProfessionCard key={profession.id} profession={profession} />
            ))}
          </div>
        </div>
      )}

      {/* Adventure Skills */}
      {adventureSkillsWithIcons.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Adventure Skills</h3>
            <p className="text-muted-foreground text-sm">Explore, gather resources, and survive in the wilderness</p>
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adventureSkillsWithIcons.map((profession) => (
              <ProfessionCard key={profession.id} profession={profession} />
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          🎯 Each skill can be leveled up to {professionSkillsWithIcons[0]?.maxLevel || 110} for mastery bonuses and
          advanced recipes!
        </p>
      </div>
    </div>
  )
}
