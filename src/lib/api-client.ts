/**
 * Authenticated API client for making requests to our backend
 */

import { supabase } from '@/lib/supabase-auth';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Make authenticated API call with automatic token handling
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Prepare headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add auth token if user is logged in
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    // Make the API call
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    // Parse response
    const result = await response.json();

    // Return standardized response
    if (response.ok) {
      return result; // Already has success/data/error format from our APIs
    } else {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(endpoint: string) => 
    apiCall<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: Record<string, unknown>) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: Record<string, unknown>) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'DELETE' }),
};