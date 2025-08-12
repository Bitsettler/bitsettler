'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: "How does settlement data sync work?",
    answer: "Bitsettler connects to the BitJita API to automatically sync your settlement's real-time data, including treasury balances, member information, and project progress. Updates happen every 5-30 minutes depending on the data type."
  },
  {
    question: "Is Bitsettler free to use?",
    answer: "Yes! Bitsettler is completely free for all players. We're a community-driven project focused on helping BitCraft players optimize their gameplay and settlement management."
  },
  {
    question: "How do I link my character to my settlement?",
    answer: "After signing up, you can claim your character through the settlement dashboard. We'll verify your membership through the game's public API and grant you appropriate permissions based on your in-game role."
  },
  {
    question: "What makes the recipe calculator special?",
    answer: "Our calculator doesn't just show recipes - it visualizes the entire dependency tree, calculates bulk quantities, identifies bottlenecks, and helps optimize resource allocation for complex crafting projects."
  },
  {
    question: "Is my settlement data secure?",
    answer: "Absolutely. We use industry-standard OAuth authentication, role-based access control, and only access publicly available game data. Your personal information and settlement strategies remain private."
  },
  {
    question: "Can I use Bitsettler for multiple settlements?",
    answer: "Currently, each account can be linked to one settlement character. However, you can explore all game data, use the calculator, and browse the compendium regardless of your settlement status."
  }
]

export function FAQSection() {
  return (
    <section className="py-12">
      <div className="space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Got questions? We've got answers. Learn more about how Bitsettler works 
            and how it can enhance your BitCraft experience.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid gap-4 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <Collapsible key={index}>
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-left">{faq.question}</CardTitle>
                      <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-4 pt-8">
          <h3 className="text-xl font-semibold">Still have questions?</h3>
          <p className="text-muted-foreground">
            Join our Discord community for support, feedback, and to connect with other BitCraft players.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="https://discord.gg/hTD3mahCFv" target="_blank" rel="noopener noreferrer">
                Join Discord Community
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#about">
                Learn More About Bitsettler
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
