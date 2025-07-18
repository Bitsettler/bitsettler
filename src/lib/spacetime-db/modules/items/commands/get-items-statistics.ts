import { getAllItems } from '../../../utils'
import { getItemsCategoriesCommand } from './get-items-categories'

/**
 * Get items statistics command - returns statistical data about items
 */
export function getItemsStatisticsCommand() {
  const items = getAllItems()
  const categories = getItemsCategoriesCommand()
  
  return {
    total: items.length,
    categories: categories.length,
    categoryBreakdown: categories.map(cat => ({
      category: cat.tag,
      count: cat.count
    }))
  }
}