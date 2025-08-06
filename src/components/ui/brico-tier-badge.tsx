import { cn } from "@/lib/utils";

interface BricoTierBadgeProps {
  tier: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BricoTierBadge({ tier, size = "sm", className }: BricoTierBadgeProps) {
  // Size classes to match brico's approach
  const sizeClasses = {
    sm: "size-4",
    md: "size-5", 
    lg: "size-6"
  };

  // Ensure tier is within valid range (1-10)
  const validTier = Math.max(1, Math.min(10, tier));

  return (
    <img
      className={cn(
        "inline mr-2 text-muted-foreground",
        `bg-tier-bg${validTier}`,
        sizeClasses[size],
        className
      )}
      src={`/assets/Badges/badge-tier-number-${validTier}.webp`}
      alt={`Tier ${validTier}`}
      style={{
        mask: 'url("/assets/Badges/badge-tier-container.webp") 0% 0% / contain'
      }}
    />
  );
}