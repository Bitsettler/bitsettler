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

// Auto-initialize when this module is imported
if (typeof window === 'undefined') {
  // Only run on server-side in production to avoid hot reload issues
  if (process.env.NODE_ENV === 'production') {
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
  } else {
    // Development mode: Treasury polling disabled to prevent hot reload conflicts
    // Treasury data will update on user interactions instead
  }
} 