import { Container } from '@/components/container'
import { BuildingsSection } from './buildings-section'
import { EquipmentSection } from './equipment-section'
import { FAQSection } from './faq-section'
import { FeaturesSection } from './features-section'
import { HeroSection } from './hero-section'
import { ItemsSection } from './items-section'
import { ProfessionsSection } from './professions-section'
import { SocialProofSection } from './social-proof-section'

export function HomeView() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Width */}
      <Container>
        <HeroSection />
      </Container>

      {/* Features Section - Highlighted */}
      <div className="bg-muted/30 border-y">
        <Container>
          <FeaturesSection />
        </Container>
      </div>

      {/* Social Proof Section */}
      <Container>
        <SocialProofSection />
      </Container>

      {/* Game Data Sections */}
      <Container>
        <div className="space-y-16 py-16">
          <section>
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Explore Game Content</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Browse our comprehensive database of BitCraft items, equipment, buildings, and professions.
              </p>
            </div>
            
            <div className="grid gap-12 lg:grid-cols-2">
              <EquipmentSection />
              <BuildingsSection />
            </div>
          </section>

          <section>
            <div className="grid gap-12 lg:grid-cols-2">
              <ItemsSection />
              <ProfessionsSection />
            </div>
          </section>
        </div>
      </Container>

      {/* FAQ Section */}
      <div className="bg-muted/20 border-t">
        <Container>
          <FAQSection />
        </Container>
      </div>
    </div>
  )
}
