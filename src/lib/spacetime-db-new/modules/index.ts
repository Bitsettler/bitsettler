// Settlement Management Data Layer Exports
// Following the Data > Page > View architecture

// Settlements module
export * from './settlements/commands';
export * from './settlements/flows';

// Projects module  
export * from './projects/commands';

// Treasury module
export * from './treasury/commands';
export * from './treasury/flows';

// Integrations
export { BitJitaAPI } from './integrations/bitjita-api';
export type { 
  BitJitaMember, 
  BitJitaCitizen, 
  BitJitaSettlementDetails, 
  BitJitaAPIResponse 
} from './integrations/bitjita-api';

// Shared utilities
export { 
  supabase, 
  createServerClient, 
  isSupabaseAvailable, 
  handleSupabaseError 
} from '../shared/supabase-client';
export type { Database } from '../shared/supabase-client'; 