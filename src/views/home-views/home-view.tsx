import { Container } from '@/components/container'
import { ContactSection } from './contact-section'
import { FAQSection } from './faq-section'
import { FeaturesSection } from './features-section'
import { HeroSection } from './hero-section'
import { TechStackSection } from './tech-stack-section'

export function HomeView() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Container>
        <HeroSection />
      </Container>

      {/* Features Section */}
      <div className="bg-muted/30 border-y">
        <Container>
          <FeaturesSection />
        </Container>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-muted/30 border-y">
        <Container>
          <TechStackSection />
        </Container>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted/20 border-t">
        <Container>
          <FAQSection />
        </Container>
      </div>

      {/* Contact Section */}
      <Container>
        <ContactSection />
      </Container>
    </div>
  )
}
