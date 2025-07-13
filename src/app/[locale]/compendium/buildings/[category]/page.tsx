import { getBuildingsGroupedByCategory, type BuildingWithItem } from '@/lib/spacetime-db-live/buildings'
import { BuildingsIndividualCategoryPageView } from '@/views/buildings-views/buildings-individual-category-page-view'
import { notFound } from 'next/navigation'

interface BuildingsCategoryPageProps {
  params: Promise<{
    category: string
  }>
}

// Utility function to format category names (PascalCase to Title Case)
function formatCategoryName(categoryName: string): string {
  return categoryName.replace(/([A-Z])/g, ' $1').trim()
}

// Utility function to convert PascalCase to kebab-case
function pascalToKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
}

// Utility function to convert URL slug back to original category name
function slugToCategoryName(slug: string): string {
  // Convert kebab-case back to PascalCase
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

export default async function BuildingsCategoryPage({ params }: BuildingsCategoryPageProps) {
  const { category } = await params
  let originalCategoryName: string
  let buildingsInCategory: BuildingWithItem[]

  // Get all buildings grouped by category with error handling for build time
  try {
    const buildingsByCategory = await getBuildingsGroupedByCategory()

    // Handle uncategorized case specially
    if (category === 'uncategorized') {
      originalCategoryName = 'Uncategorized'
      buildingsInCategory = buildingsByCategory['Uncategorized'] || []
    } else {
      originalCategoryName = slugToCategoryName(category)
      buildingsInCategory = buildingsByCategory[originalCategoryName]
    }
  } catch (error) {
    console.warn('Failed to fetch live buildings data during build, using static fallback:', error)
    // Fallback for build time
    originalCategoryName = category === 'uncategorized' ? 'Uncategorized' : slugToCategoryName(category)
    buildingsInCategory = []
  }

  if (!buildingsInCategory || buildingsInCategory.length === 0) {
    notFound()
  }

  const formattedCategoryName =
    originalCategoryName === 'Uncategorized' ? 'Uncategorized' : formatCategoryName(originalCategoryName)

  return (
    <BuildingsIndividualCategoryPageView
      categoryName={formattedCategoryName}
      buildings={buildingsInCategory}
      backLink="/compendium/buildings"
      backLinkText="← Back to Buildings"
    />
  )
}

export async function generateStaticParams() {
  try {
    const buildingsByCategory = await getBuildingsGroupedByCategory()

    return Object.keys(buildingsByCategory).map((categoryName) => ({
      category: pascalToKebabCase(categoryName)
    }))
  } catch (error) {
    console.warn('Failed to fetch buildings data for static params, returning empty array:', error)
    return []
  }
}
