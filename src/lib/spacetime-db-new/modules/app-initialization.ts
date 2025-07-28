import { treasuryPollingService } from './treasury/services/treasury-polling-service';

/**
 * Initialize background services when the app starts
 */
export function initializeApp(): void {
  console.log('🚀 Initializing BitCraft Guide application services...');
  
  try {
    // Start treasury polling service (every 5 minutes)
    treasuryPollingService.startPolling('504403158277057776');
    
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

// Auto-initialize when this module is imported
if (typeof window === 'undefined') {
  // Only run on server-side
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
} 