'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TierIcon, SettlementTierIcon, ItemTierIcon, ProjectTierIcon, TierProgression, TierBadge, TierText, SkillIcon } from '@/components/ui/tier-icon';
import { Badge } from '@/components/ui/badge';

/**
 * TIER ICON EXAMPLES - Using Actual Bitcraft Game Assets!
 * 
 * This component demonstrates the tier icon system using REAL game badge assets
 * from /public/assets/Badges/ - just like brico.app uses authentic game graphics.
 * 
 * You can use these components throughout your Bitcraft settlement app:
 * - Settlement tiers (game badge graphics)
 * - Item tiers (game badge graphics) 
 * - Project tiers (game badge graphics)
 * - Member skill tiers
 * - Research tiers
 * - Skill icons (actual game skill graphics)
 */

export function TierIconExamples() {
  return (
    <div className="space-y-6 p-6">
      
      {/* Brico-style Tier Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Brico.app Style Tier Icons</CardTitle>
          <CardDescription>
            Roman numerals with tier colors - exactly like brico.app's implementation!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* All tiers in a row */}
            <div>
              <h4 className="text-sm font-medium mb-2">All Tier Badges (1-10) - Brico.app Style:</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => (
                  <TierIcon key={i + 1} tier={i + 1} variant="brico-style" size="md" />
                ))}
              </div>
            </div>

            {/* Different sizes */}
            <div>
              <h4 className="text-sm font-medium mb-2">Different Sizes (Tier 6):</h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <TierIcon tier={6} variant="brico-style" size="sm" />
                  <p className="text-xs mt-1">Small</p>
                </div>
                <div className="text-center">
                  <TierIcon tier={6} variant="brico-style" size="md" />
                  <p className="text-xs mt-1">Medium</p>
                </div>
                <div className="text-center">
                  <TierIcon tier={6} variant="brico-style" size="lg" />
                  <p className="text-xs mt-1">Large</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variant Styles */}
      <Card>
        <CardHeader>
          <CardTitle>Different Variants</CardTitle>
          <CardDescription>
            Icon, badge, and compact variants for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Brico-style variant */}
            <div>
              <h4 className="text-sm font-medium mb-2">Brico-style Variant (Roman numerals with tier colors):</h4>
              <div className="flex items-center gap-2">
                {[3, 6, 9].map(tier => (
                  <TierIcon key={tier} tier={tier} variant="brico-style" size="md" />
                ))}
              </div>
            </div>

            {/* Game asset variant */}
            <div>
              <h4 className="text-sm font-medium mb-2">Game Asset Variant (raw game badge images):</h4>
              <div className="flex items-center gap-2">
                {[3, 6, 9].map(tier => (
                  <TierIcon key={tier} tier={tier} variant="game-asset" size="sm" />
                ))}
              </div>
            </div>

            {/* Text badge variant */}
            <div>
              <h4 className="text-sm font-medium mb-2">Text Badge Variant (when you need "Tier X" text):</h4>
              <div className="flex items-center gap-2">
                {[3, 6, 9].map(tier => (
                  <TierIcon key={tier} tier={tier} variant="text-badge" size="md" showTierText />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Skill Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Authentic Game Skill Icons</CardTitle>
          <CardDescription>
            Real Bitcraft skill icons from /public/assets/Skill/ - perfect for profession displays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Profession skills */}
            <div>
              <h4 className="text-sm font-medium mb-2">Profession Skills:</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {['Mining', 'Smithing', 'Forestry', 'Carpentry', 'Farming', 'Fishing'].map(skill => (
                  <div key={skill} className="text-center">
                    <SkillIcon skillName={skill} size="md" />
                    <p className="text-xs mt-1">{skill}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Adventure skills */}
            <div>
              <h4 className="text-sm font-medium mb-2">Adventure Skills:</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {['Cooking', 'Combat', 'Hunting', 'Exploration'].map(skill => (
                  <div key={skill} className="text-center">
                    <SkillIcon skillName={skill} size="md" />
                    <p className="text-xs mt-1">{skill}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specialized Components */}
      <Card>
        <CardHeader>
          <CardTitle>Specialized Tier Components</CardTitle>
          <CardDescription>
            Pre-configured components using authentic game badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <SettlementTierIcon tier={6} />
                <p className="text-xs mt-1">Settlement Tier</p>
              </div>
              
              <div className="text-center">
                <ProjectTierIcon tier={4} />
                <p className="text-xs mt-1">Project Tier</p>
              </div>
              
              <div className="text-center">
                <ItemTierIcon tier={8} />
                <p className="text-xs mt-1">Item Tier</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text-Based Tier Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Text-Based Tier Badges</CardTitle>
          <CardDescription>
            When you want "Tier 5" text but with the same tier color system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* TierBadge examples */}
            <div>
              <h4 className="text-sm font-medium mb-2">TierBadge - Full color backgrounds:</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {[1, 3, 5, 7, 10].map(tier => (
                  <TierBadge key={tier} tier={tier} />
                ))}
              </div>
            </div>

            {/* TierBadge variants */}
            <div>
              <h4 className="text-sm font-medium mb-2">TierBadge variants (Tier 6):</h4>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <TierBadge tier={6} variant="default" />
                  <p className="text-xs mt-1">Default</p>
                </div>
                <div className="text-center">
                  <TierBadge tier={6} variant="outline" />
                  <p className="text-xs mt-1">Outline</p>
                </div>
                <div className="text-center">
                  <TierBadge tier={6} variant="subtle" />
                  <p className="text-xs mt-1">Subtle</p>
                </div>
              </div>
            </div>

            {/* TierBadge sizes */}
            <div>
              <h4 className="text-sm font-medium mb-2">TierBadge sizes:</h4>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <TierBadge tier={5} size="sm" />
                  <p className="text-xs mt-1">Small</p>
                </div>
                <div className="text-center">
                  <TierBadge tier={5} size="md" />
                  <p className="text-xs mt-1">Medium</p>
                </div>
                <div className="text-center">
                  <TierBadge tier={5} size="lg" />
                  <p className="text-xs mt-1">Large</p>
                </div>
              </div>
            </div>

            {/* TierText examples */}
            <div>
              <h4 className="text-sm font-medium mb-2">TierText - Just colored text (no background):</h4>
              <div className="flex items-center gap-4">
                {[2, 4, 6, 8].map(tier => (
                  <TierText key={tier} tier={tier} />
                ))}
              </div>
            </div>

            {/* Compact vs text comparison */}
            <div>
              <h4 className="text-sm font-medium mb-2">Short form options:</h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <TierBadge tier={7} showTierText={false} />
                  <p className="text-xs mt-1">T7</p>
                </div>
                <div className="text-center">
                  <TierText tier={7} showTierText={false} />
                  <p className="text-xs mt-1">T7 text</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Progression</CardTitle>
          <CardDescription>
            Shows progression through tiers (useful for member advancement, settlement growth, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            <div>
              <h4 className="text-sm font-medium mb-2">Settlement at Tier 6:</h4>
              <TierProgression currentTier={6} maxTier={10} />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Item crafting progression (Tier 3):</h4>
              <TierProgression currentTier={3} maxTier={6} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
          <CardDescription>
            How to integrate tier icons in your settlement management UI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Settlement info example */}
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-center gap-3">
                <SettlementTierIcon tier={6} />
                <div>
                  <h3 className="font-semibold">Example Settlement</h3>
                  <p className="text-sm text-muted-foreground">Tier VI Settlement</p>
                </div>
              </div>
            </div>

            {/* Item list example */}
            <div className="border rounded-lg p-4 bg-background">
              <h4 className="font-medium mb-2">Crafting Materials:</h4>
              <div className="space-y-2">
                {[
                  { name: 'Iron Ingot', tier: 3 },
                  { name: 'Mithril Ore', tier: 7 },
                  { name: 'Dragon Scale', tier: 10 }
                ].map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <ItemTierIcon tier={item.tier} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project status example */}
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ProjectTierIcon tier={5} />
                  <div>
                    <h4 className="font-medium">Grand Library Construction</h4>
                    <p className="text-sm text-muted-foreground">Tier V Building Project</p>
                  </div>
                </div>
                <Badge variant="outline">In Progress</Badge>
              </div>
            </div>

            {/* Text-based examples */}
            <div className="border rounded-lg p-4 bg-background">
              <h4 className="font-medium mb-3">Resource Requirements:</h4>
              <div className="space-y-2">
                {[
                  { name: 'Stone Blocks', tier: 2, count: 500 },
                  { name: 'Iron Reinforcement', tier: 4, count: 200 },
                  { name: 'Enchanted Crystals', tier: 8, count: 50 }
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.name}</span>
                      <TierBadge tier={item.tier} size="sm" showTierText={false} />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mixed usage example */}
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Settlement Progression</h4>
                <TierText tier={6} /> {/* Just colored text */}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Status:</span>
                  <TierBadge tier={6} variant="subtle" /> {/* Subtle badge */}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next Upgrade:</span>
                  <TierBadge tier={7} variant="outline" size="sm" /> {/* Outline style */}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Color Reference</CardTitle>
          <CardDescription>
            Color coding system for different tiers (inspired by game rarity systems)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="text-center">
                <TierIcon tier={i} variant="icon" size="md" />
                <p className="text-xs mt-1">Tier {i}</p>
                <p className="text-xs text-muted-foreground">
                  {i === 0 && 'Basic'}
                  {i === 1 && 'Common'}
                  {i === 2 && 'Uncommon'}
                  {i === 3 && 'Rare'}
                  {i === 4 && 'Epic'}
                  {i === 5 && 'Legendary'}
                  {i === 6 && 'Mythic'}
                  {i === 7 && 'Divine'}
                  {i === 8 && 'Celestial'}
                  {i === 9 && 'Void'}
                  {i === 10 && 'Transcendent'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}