import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'Enter any username' },
        password: { label: 'Password', type: 'password', placeholder: 'Enter any password' }
      },
      async authorize(credentials, req) {
        // For development - accept any username/password
        // In production, you'd validate against a database
        if (credentials?.username && credentials?.password) {
          return {
            id: credentials.username.toLowerCase().replace(/\s+/g, ''), // Simple ID from username
            name: credentials.username,
            email: `${credentials.username.toLowerCase().replace(/\s+/g, '')}@settlement.local`,
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/en/auth/signin', // Updated to include locale
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }