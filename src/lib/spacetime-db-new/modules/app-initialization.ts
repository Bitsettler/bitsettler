import { treasuryPollingService } from './treasury/services/treasury-polling-service';

/**
 * Initialize background services when the app starts
 */
export function initializeApp(): void {
  console.log('🚀 Initializing BitCraft Guide application services...');
  
  try {
    // Treasury polling is now started per-settlement by user interaction
    // No global settlement polling in production
    console.log('✅ Application services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application services:', error);
  }
}

/**
 * Cleanup services when the app shuts down
 */
export function cleanupApp(): void {
  console.log('🛑 Shutting down application services...');
  
  try {
    // Stop treasury polling
    treasuryPollingService.stopPolling();
    
    console.log('✅ Application services shut down cleanly');
  } catch (error) {
    console.error('❌ Error during application cleanup:', error);
  }
}

// Auto-initialize when this module is imported (but not during build)
if (typeof window === 'undefined') {
  // Only run on server-side in production to avoid hot reload issues
  // Skip during Next.js build process to avoid multiple initializations
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.VERCEL_ENV === undefined || 
                      process.argv.includes('build');
  
  if (process.env.NODE_ENV === 'production' && !isBuildTime) {
    initializeApp();
    
    // Cleanup on process termination
    process.on('SIGINT', () => {
      cleanupApp();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      cleanupApp();
      process.exit(0);
    });
  } else if (!isBuildTime) {
    // Development mode: Treasury polling disabled to prevent hot reload conflicts
    // Treasury data will update on user interactions instead
  }
} 