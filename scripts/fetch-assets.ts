/**
 * Asset fetching script for Bitcraft icons
 * 
 * This script analyzes the fetched game data to identify all icon asset names,
 * then attempts to fetch missing icons from the game's asset server.
 * 
 * Usage:
 *   npm run fetch-assets
 * 
 * Prerequisites:
 *   - Run generate-game-data first to have current data files
 *   - Ensure you have write access to public/assets directory
 */

import { promises as fs } from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

interface EntityWithIcon {
  id?: number
  name?: string
  icon_asset_name?: string
  iconAssetName?: string
}

interface AssetInfo {
  assetName: string
  sourceTable: string
  entityName?: string
  localPath: string
  gameUrl?: string
}

/**
 * Extract all icon asset names from the fetched game data
 */
async function extractIconAssets(dataDir: string): Promise<AssetInfo[]> {
  const globalDir = path.join(dataDir, 'global')
  const assets: AssetInfo[] = []
  
  // Tables that contain icon assets
  const iconTables = [
    'item_desc',
    'cargo_desc', 
    'resource_desc',
    'building_desc',
    'collectible_desc',
    'skill_desc',
    'equipment_desc'
  ]
  
  for (const tableName of iconTables) {
    const filePath = path.join(globalDir, `${tableName}.json`)
    
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const entities: EntityWithIcon[] = JSON.parse(data)
      
      console.log(`Processing ${tableName}: ${entities.length} entities`)
      
      for (const entity of entities) {
        // Handle both snake_case and camelCase field names
        const iconAssetName = entity.icon_asset_name || entity.iconAssetName
        
        if (iconAssetName && iconAssetName.trim()) {
          // Clean the asset name
          const cleanName = iconAssetName.replace(/^GeneratedIcons\//, '')
          const localPath = path.join('public', 'assets', 'GeneratedIcons', `${cleanName}.webp`)
          
          assets.push({
            assetName: iconAssetName,
            sourceTable: tableName,
            entityName: entity.name,
            localPath,
            // Note: Game asset URLs would need to be determined
            // This is a placeholder - actual URL pattern needs investigation
            gameUrl: `https://assets.bitcraft-mmo.com/GeneratedIcons/${cleanName}.webp`
          })
        }
      }
    } catch (error) {
      console.log(`Warning: Could not process ${tableName}:`, (error as Error).message)
    }
  }
  
  console.log(`Found ${assets.length} total icon assets across all tables`)
  return assets
}

/**
 * Check which assets are missing locally
 */
async function findMissingAssets(assets: AssetInfo[]): Promise<AssetInfo[]> {
  const missing: AssetInfo[] = []
  
  for (const asset of assets) {
    try {
      await fs.access(asset.localPath)
      // File exists, skip
    } catch {
      // File doesn't exist, add to missing list
      missing.push(asset)
    }
  }
  
  console.log(`Found ${missing.length} missing assets out of ${assets.length} total`)
  return missing
}

/**
 * Attempt to download a single asset
 */
async function downloadAsset(asset: AssetInfo): Promise<boolean> {
  if (!asset.gameUrl) {
    console.log(`No URL available for ${asset.assetName}`)
    return false
  }
  
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(asset.localPath), { recursive: true })
    
    // Note: This is a placeholder for actual asset downloading
    // The real implementation would need:
    // 1. Correct asset server URL pattern
    // 2. Proper authentication if required
    // 3. Error handling for 404s, etc.
    
    console.log(`Would download: ${asset.gameUrl} -> ${asset.localPath}`)
    console.log(`  For entity: ${asset.entityName} (${asset.sourceTable})`)
    
    // Placeholder - actual fetch implementation needed
    // const response = await fetch(asset.gameUrl)
    // if (response.ok) {
    //   const buffer = await response.arrayBuffer()
    //   await fs.writeFile(asset.localPath, Buffer.from(buffer))
    //   return true
    // }
    
    return false
  } catch (error) {
    console.error(`Failed to download ${asset.assetName}:`, (error as Error).message)
    return false
  }
}

/**
 * Generate a report of missing assets
 */
async function generateAssetReport(missing: AssetInfo[], outputPath: string): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    totalMissing: missing.length,
    missingByTable: {} as Record<string, number>,
    assets: missing.map(asset => ({
      assetName: asset.assetName,
      entityName: asset.entityName,
      sourceTable: asset.sourceTable,
      localPath: asset.localPath
    }))
  }
  
  // Count missing by table
  for (const asset of missing) {
    report.missingByTable[asset.sourceTable] = (report.missingByTable[asset.sourceTable] || 0) + 1
  }
  
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2))
  console.log(`Asset report saved to ${outputPath}`)
  
  // Print summary
  console.log('\n=== MISSING ASSETS SUMMARY ===')
  console.log(`Total missing: ${report.totalMissing}`)
  console.log('By table:')
  for (const [table, count] of Object.entries(report.missingByTable)) {
    console.log(`  ${table}: ${count}`)
  }
  
  // Show some examples
  console.log('\nExamples of missing assets:')
  missing.slice(0, 10).forEach(asset => {
    console.log(`  ${asset.assetName} (${asset.entityName})`)
  })
  
  if (missing.length > 10) {
    console.log(`  ... and ${missing.length - 10} more`)
  }
}

async function main(): Promise<void> {
  const dataDir = process.env.DATA_DIR || 'src/data'
  
  console.log('🔍 Extracting icon assets from game data...')
  const allAssets = await extractIconAssets(dataDir)
  
  console.log('📋 Checking for missing assets...')
  const missingAssets = await findMissingAssets(allAssets)
  
  if (missingAssets.length === 0) {
    console.log('✅ All assets are present!')
    return
  }
  
  console.log('📄 Generating asset report...')
  const reportPath = path.join(dataDir, 'missing-assets-report.json')
  await generateAssetReport(missingAssets, reportPath)
  
  // For now, just report what's missing
  // TODO: Implement actual asset downloading once we determine the correct asset server URLs
  console.log('\n⚠️  Asset downloading not yet implemented')
  console.log('Next steps:')
  console.log('1. Investigate the correct asset server URLs')
  console.log('2. Implement authentication if required')
  console.log('3. Add actual downloading logic')
  console.log(`4. Check the report at ${reportPath} for details`)
}

// Run if this is the main module
main().catch(console.error)