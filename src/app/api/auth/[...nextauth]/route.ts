import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

// Ensure NEXTAUTH_SECRET is available at runtime
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ NEXTAUTH_SECRET is required in production but not found');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };