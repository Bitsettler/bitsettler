import {
  getEquipmentCategories,
  getEquipmentStatistics
} from '@/lib/spacetime-db-new/modules/equipment/flows'
import { EquipmentView } from '@/views/equipment-views/equipment-index-page-view'

export default async function EquipmentPage() {
  // Get equipment categories with counts from the new system
  const equipmentCategories = getEquipmentCategories()

  // Get live equipment statistics
  const equipmentStats = getEquipmentStatistics()
  const totalEquipment = equipmentStats.total

  return (
    <EquipmentView
      title="Equipment"
      subtitle={`${totalEquipment} equipment items across ${equipmentCategories.length} categories`}
      equipmentCategories={equipmentCategories}
    />
  )
}
