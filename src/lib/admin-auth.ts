import { NextRequest } from 'next/server';
import { getSupabaseSession } from '@/lib/supabase-server-auth';

/**
 * Admin authentication and authorization
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * List of authorized admin emails
 * TODO: Move this to environment variables or database
 */
const ADMIN_EMAILS = [
  'cory.niblett@gmail.com',  // Primary admin
  // Add other admin emails here
];

/**
 * Check if user is authorized as an admin
 */
export function isAuthorizedAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Require admin authentication for API routes
 * Returns authenticated admin user or throws with HTTP response
 */
export async function requireAdminAuth(request: NextRequest): Promise<AdminUser> {
  // Get user session
  const session = await getSupabaseSession(request);
  
  if (!session?.user) {
    throw new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Authentication required - please sign in' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const userEmail = session.user.email;
  if (!userEmail) {
    throw new Response(
      JSON.stringify({ 
        success: false, 
        error: 'User email not found in session' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Check admin authorization
  if (!isAuthorizedAdmin(userEmail)) {
    console.warn(`🚫 Unauthorized admin access attempt from: ${userEmail}`);
    throw new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Admin access denied - insufficient permissions' 
      }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  console.log(`✅ Admin authenticated: ${userEmail}`);
  
  return {
    id: session.user.id,
    email: userEmail,
    name: session.user.name || 'Admin User',
    isAdmin: true
  };
}

/**
 * Log admin actions for security auditing
 */
export function logAdminAction(admin: AdminUser, action: string, details?: any) {
  console.log(`🔐 ADMIN ACTION: ${admin.email} performed "${action}"`, {
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    details,
    timestamp: new Date().toISOString()
  });
}