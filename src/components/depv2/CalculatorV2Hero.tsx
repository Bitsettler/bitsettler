'use client'

import { Calculator, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CalculatorV2HeroProps {
  locale: string;
  feedbackUrl?: string;
}

export function CalculatorV2Hero({ locale, feedbackUrl }: CalculatorV2HeroProps) {
  return (
    <div className="hero-gradient border-b">
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          {/* Main title with icon and badge */}
          <div className="flex items-center justify-center gap-3">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Project Calculator</h1>
            <Badge variant="secondary" className="text-sm">
              Projects
            </Badge>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Project-focused crafting calculator with collaboration features and advanced planning
          </p>
          
          {/* Navigation and feedback links */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href={`/${locale}/calculator`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Visual Calculator
              </Button>
            </Link>
            
            {feedbackUrl && (
              <a href={feedbackUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send Feedback
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
