// Note: Using client-side API calls since direct data layer access has different interfaces
import { getAllProjects, getProjectById } from '../projects/commands';

/**
 * Cross-Reference Service
 * Links settlement data to main compendium items for seamless navigation
 */

/**
 * Enhanced project item with compendium link
 */
export interface ProjectItemWithLink {
  id: string;
  projectId: string;
  itemName: string;
  requiredQuantity: number;
  currentQuantity: number;
  tier: number;
  priority: number;
  rankOrder: number;
  status: 'Needed' | 'In Progress' | 'Completed';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Cross-reference data
  compendiumItem?: {
    slug: string;
    category: string;
    tier: number;
    url: string;
    imageUrl?: string;
  };
}

/**
 * Result of cross-referencing settlement items with compendium
 */
export interface CrossReferenceResult {
  matched: number;
  unmatched: number;
  totalItems: number;
  unmatchedItems: string[];
}

/**
 * Get a project with all items cross-referenced to compendium
 */
export async function getProjectWithCrossReferences(projectId: string): Promise<any | null> {
  try {
    // Get the project with items
    const project = await getProjectById(projectId);
    if (!project) {
      return null;
    }

    // Cross-reference each item
    const itemsWithLinks: ProjectItemWithLink[] = await Promise.all(
      project.items.map(async (item) => {
        const compendiumItem = await findCompendiumItemByName(item.itemName);
        
        return {
          ...item,
          compendiumItem: compendiumItem ? {
            slug: compendiumItem.slug,
            category: compendiumItem.category,
            tier: compendiumItem.tier,
            url: `/compendium/${compendiumItem.category}/${compendiumItem.slug}`,
            imageUrl: compendiumItem.imageUrl,
          } : undefined,
        };
      })
    );

    return {
      ...project,
      items: itemsWithLinks,
    };

  } catch (error) {
    console.error('Error getting project with cross-references:', error);
    throw error;
  }
}

/**
 * Cross-reference all project items with compendium database
 */
export async function crossReferenceAllProjectItems(): Promise<CrossReferenceResult> {
  try {
    console.log('Starting cross-reference of all project items...');

    // Get all projects
    const projects = await getAllProjects();
    let totalItems = 0;
    let matched = 0;
    let unmatched = 0;
    const unmatchedItems: string[] = [];

    for (const project of projects) {
      const fullProject = await getProjectById(project.id);
      if (!fullProject) continue;

      for (const item of fullProject.items) {
        totalItems++;
        
        const compendiumItem = await findCompendiumItemByName(item.itemName);
        
        if (compendiumItem) {
          matched++;
        } else {
          unmatched++;
          if (!unmatchedItems.includes(item.itemName)) {
            unmatchedItems.push(item.itemName);
          }
        }
      }
    }

    const result: CrossReferenceResult = {
      matched,
      unmatched,
      totalItems,
      unmatchedItems,
    };

    console.log('Cross-reference complete:', result);
    return result;

  } catch (error) {
    console.error('Error cross-referencing project items:', error);
    throw error;
  }
}

/**
 * Find a compendium item by name with fuzzy matching
 */
export async function findCompendiumItemByName(itemName: string): Promise<any | null> {
  try {
    // Note: This would use the compendium search API when available
    // For now, return null since we don't have direct access to game data in this context
    console.log(`Cross-reference lookup for "${itemName}" - API integration needed`);
    return null;

  } catch (error) {
    console.error(`Error finding compendium item for "${itemName}":`, error);
    return null;
  }
}

/**
 * Get suggested compendium links for an item name
 */
export async function getSuggestedCompendiumItems(itemName: string, limit = 5): Promise<any[]> {
  try {
    // Note: This would use the compendium search API when available
    // For now, return empty array since we don't have direct access to game data
    console.log(`Suggestion lookup for "${itemName}" - API integration needed`);
    return [];

  } catch (error) {
    console.error(`Error getting suggestions for "${itemName}":`, error);
    return [];
  }
}

/**
 * Create navigation links between settlement and compendium
 */
export function createCompendiumLink(itemName: string, category?: string, slug?: string): string {
  if (slug && category) {
    return `/compendium/${category}/${slug}`;
  }
  
  // Default to search if no direct link available
  return `/compendium?search=${encodeURIComponent(itemName)}`;
}

/**
 * Create settlement link from compendium item
 */
export function createSettlementLink(itemName: string): string {
  return `/settlement/projects?search=${encodeURIComponent(itemName)}`;
}

/**
 * Validate cross-reference data integrity
 */
export async function validateCrossReferences(): Promise<{
  valid: boolean;
  issues: string[];
  summary: CrossReferenceResult;
}> {
  try {
    const issues: string[] = [];
    
    // Run cross-reference analysis
    const summary = await crossReferenceAllProjectItems();
    
    // Check for high number of unmatched items
    const unmatchedPercentage = (summary.unmatched / summary.totalItems) * 100;
    if (unmatchedPercentage > 50) {
      issues.push(`High percentage of unmatched items: ${unmatchedPercentage.toFixed(1)}%`);
    }
    
    // Check for common missing items
    const commonMissingItems = summary.unmatchedItems.filter(item => 
      item.toLowerCase().includes('wood') ||
      item.toLowerCase().includes('stone') ||
      item.toLowerCase().includes('iron') ||
      item.toLowerCase().includes('fiber')
    );
    
    if (commonMissingItems.length > 0) {
      issues.push(`Missing common items in compendium: ${commonMissingItems.join(', ')}`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      summary,
    };

  } catch (error) {
    console.error('Error validating cross-references:', error);
    return {
      valid: false,
      issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      summary: { matched: 0, unmatched: 0, totalItems: 0, unmatchedItems: [] },
    };
  }
} 