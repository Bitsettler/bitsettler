/**
 * Shared types and utilities for project creation from calculator results
 * Used for staging items locally before submitting to the project creation API
 */

export type ProjectSeedItem = {
  itemId?: string;
  itemSlug?: string;
  name: string;
  qty: number;          // integer, already flattened
  skill?: string | null;
  tier?: number | null;
};

export type ProjectSeed = {
  title: string;
  items: ProjectSeedItem[];
};

/**
 * Convert calculator material rows to project seed items
 */
export function convertMaterialsToSeedItems(materials: Array<{
  id: string | number;
  name: string;
  qty: number;
  tier?: number;
  skill?: string;
}>): ProjectSeedItem[] {
  return materials.map(material => ({
    itemId: typeof material.id === 'string' ? material.id : material.id.toString(),
    name: material.name,
    qty: Math.ceil(material.qty), // Ensure integer quantities
    skill: material.skill || null,
    tier: material.tier || null,
  }));
}

/**
 * Generate a default project title from selected item and quantity
 */
export function generateProjectTitle(itemName: string, qty: number): string {
  return `${itemName} x ${qty}`;
}
