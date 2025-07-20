import { Container } from '@/components/container'
import { BuildingsSection } from './buildings-section'
import { EquipmentSection } from './equipment-section'
import { HeroSection } from './hero-section'
import { ItemsSection } from './items-section'
import { ProfessionsSection } from './professions-section'

export function HomeView() {
  return (
    <Container>
      <div className="space-y-16 py-8">
        <section>
          <HeroSection />
        </section>

        <section>
          <EquipmentSection />
        </section>

        <section>
          <BuildingsSection />
        </section>

        <section>
          <ItemsSection />
        </section>

        <section>
          <ProfessionsSection />
        </section>

        {/* Latest Bitcraft News */}
        {/*   <NewsSection /> */}
      </div>
    </Container>
  )
}
