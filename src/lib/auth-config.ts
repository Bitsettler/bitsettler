import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
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
    signIn: '/auth/signin',
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
};