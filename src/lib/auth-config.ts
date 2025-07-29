import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Ensure we always have a secret - critical for NextAuth to function
const getAuthSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn('⚠️ NEXTAUTH_SECRET not found in environment variables');
    // Generate a consistent fallback secret for development
    return 'development-fallback-secret-' + (process.env.NODE_ENV || 'development');
  }
  return secret;
};

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  debug: process.env.NODE_ENV === 'development',
  trustHost: true, // Required for Vercel deployments
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'Enter any username' },
        password: { label: 'Password', type: 'password', placeholder: 'Enter any password' }
      },
      async authorize(credentials) {
        // For development - accept any username/password
        // In production, you'd validate against a database
        if (credentials?.username && credentials?.password) {
          return {
            id: credentials.username.toLowerCase().replace(/\s+/g, ''), // Simple ID from username
            name: credentials.username,
            email: `${credentials.username.toLowerCase().replace(/\s+/g, '')}@settlement.local`,
            image: null
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/en/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      console.log('NextAuth signIn event:', message);
    },
    async session(message) {
      console.log('NextAuth session event:', message);
    },
    async error(message) {
      console.error('NextAuth error event:', message);
    },
  },
};