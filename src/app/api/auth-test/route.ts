import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';

export async function GET() {
  // Test if authOptions can be imported and accessed
  let authConfigStatus = 'unknown';
  let authSecret = 'unknown';
  
  try {
    authSecret = authOptions.secret || 'undefined';
    authConfigStatus = 'loaded successfully';
  } catch (error) {
    authConfigStatus = `error: ${error}`;
  }

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasSecretEnv: !!process.env.NEXTAUTH_SECRET,
    hasUrlEnv: !!process.env.NEXTAUTH_URL,
    secretEnvLength: process.env.NEXTAUTH_SECRET?.length || 0,
    url: process.env.NEXTAUTH_URL || 'not-set',
    authConfigStatus,
    authSecretFromConfig: authSecret,
    authSecretLength: authSecret?.length || 0,
    timestamp: new Date().toISOString(),
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('AUTH')).sort()
  });
} 