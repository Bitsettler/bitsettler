# 🛠️ Authentication Developer Guide

## Quick Start for Developers

### Adding Authentication to a New Page

#### 1. Client-Side Protected Page
```typescript
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/en/auth/signin')
    }
  }, [session, loading, router])

  if (loading) return <div>Loading...</div>
  if (!session) return null

  return <div>Protected content</div>
}
```

#### 2. Server-Side Protected Page
```typescript
import { getSupabaseSession } from '@/lib/supabase-server-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getSupabaseSession(headers())
  
  if (!session?.user) {
    redirect('/en/auth/signin')
  }

  return (
    <div>
      <h1>Welcome {session.user.email}</h1>
      <p>User ID: {session.user.id}</p>
    </div>
  )
}
```

### Adding Authentication to API Routes

#### Basic Protected API Route
```typescript
import { getSupabaseSession } from '@/lib/supabase-server-auth'

export async function GET(request: Request) {
  const session = await getSupabaseSession(request)
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  return Response.json({ 
    message: 'Protected data',
    userId: session.user.id 
  })
}
```

#### Settlement-Specific API Route
```typescript
import { getSupabaseSession } from '@/lib/supabase-server-auth'
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client'

export async function GET(request: Request) {
  const session = await getSupabaseSession(request)
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get user's settlement member data
  const { data: member } = await supabase
    .from('players')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  if (!member) {
    return new Response('Character not claimed', { status: 403 })
  }

  return Response.json({ member })
}
```

### Permission-Based Components

#### Role-Based Conditional Rendering
```typescript
import { useSettlementPermissions } from '@/hooks/use-settlement-permissions'

function SettlementActions() {
  const { userRole } = useSettlementPermissions()

  return (
    <div>
      {/* Everyone can view */}
      <ViewDashboard />
      
      {/* Storage + Build can manage projects */}
      {userRole?.canManageProjects && (
        <ManageProjects />
      )}
      
      {/* Officers + Co-Owners can manage treasury */}
      {userRole?.canManageTreasury && (
        <ManageTreasury />
      )}
      
      {/* Only Co-Owners can manage settlement */}
      {userRole?.canManageSettlement && (
        <SettlementAdmin />
      )}
    </div>
  )
}
```

#### Permission Guard Component
```typescript
interface PermissionGuardProps {
  permission: 'canManageProjects' | 'canManageTreasury' | 'canManageSettlement'
  children: React.ReactNode
  fallback?: React.ReactNode
}

function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { userRole, loading } = useSettlementPermissions()

  if (loading) return <div>Loading permissions...</div>
  
  if (!userRole?.[permission]) {
    return fallback || <div>Access denied</div>
  }

  return <>{children}</>
}

// Usage
<PermissionGuard permission="canManageTreasury">
  <TreasuryManagement />
</PermissionGuard>
```

### Database Queries with RLS

#### Client-Side Queries (Automatic RLS)
```typescript
import { supabase } from '@/lib/supabase-auth'

// This automatically respects RLS policies
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  // User can only see projects from their settlement
```

#### Server-Side Queries (Service Role)
```typescript
import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client'

// When using service role, you must manually filter
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('settlement_id', userSettlementId) // Manual filtering required
```

## Common Patterns

### Check if User Has Claimed Character
```typescript
import { useClaimPlayer } from '@/hooks/use-current-member'

function CharacterStatus() {
  const { member, loading, error } = useClaimPlayer()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!member) return <CharacterClaimPrompt />

  return <div>Welcome {member.name}!</div>
}
```

### Handle Authentication State
```typescript
function AuthStateHandler() {
  const { session, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return <SignInPrompt />
  }

  return <AuthenticatedApp />
}
```

### API Error Handling
```typescript
async function fetchProtectedData() {
  try {
    const response = await fetch('/api/protected-endpoint')
    
    if (response.status === 401) {
      // Redirect to sign-in
      router.push('/en/auth/signin')
      return
    }
    
    if (response.status === 403) {
      // Show permission denied message
      setError('You need to claim a character first')
      return
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    setError('Something went wrong')
  }
}
```

## Testing Helpers

### Mock Authentication in Tests
```typescript
// jest.setup.js
import { vi } from 'vitest'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { user: { id: 'test-user-id' } },
    loading: false,
    signOut: vi.fn()
  })
}))
```

### Test API Routes
```typescript
// api.test.ts
import { GET } from '@/app/api/protected/route'

test('requires authentication', async () => {
  const request = new Request('http://localhost/api/protected')
  const response = await GET(request)
  
  expect(response.status).toBe(401)
})

test('returns data for authenticated user', async () => {
  const request = new Request('http://localhost/api/protected', {
    headers: {
      'Authorization': 'Bearer valid-jwt-token'
    }
  })
  
  const response = await GET(request)
  expect(response.status).toBe(200)
})
```

## Debugging Tips

### Client-Side Debug Info
```typescript
function AuthDebugInfo() {
  const { user, session } = useAuth()
  const { userRole, permissions } = useSettlementPermissions()

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, background: 'black', color: 'white', padding: '10px' }}>
      <h4>Auth Debug</h4>
      <p>User ID: {user?.id}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {userRole?.displayName}</p>
      <p>Permissions: {JSON.stringify(permissions)}</p>
    </div>
  )
}
```

### Server-Side Debug Logging
```typescript
export async function GET(request: Request) {
  const session = await getSupabaseSession(request)
  
  console.log('=== Auth Debug ===')
  console.log('Session exists:', !!session)
  console.log('User ID:', session?.user?.id)
  console.log('User email:', session?.user?.email)
  console.log('==================')
  
  // ... rest of your API logic
}
```

## Performance Considerations

### Optimize Permission Checks
```typescript
// ❌ Bad: Multiple permission checks
const { userRole } = useSettlementPermissions()
if (userRole?.canManageProjects) { /* ... */ }
if (userRole?.canManageTreasury) { /* ... */ }
if (userRole?.canManageSettlement) { /* ... */ }

// ✅ Good: Destructure once
const { userRole } = useSettlementPermissions()
const { canManageProjects, canManageTreasury, canManageSettlement } = userRole || {}
```

### Cache Expensive Queries
```typescript
import { useQuery } from '@tanstack/react-query'

function useClaimPlayerCached() {
  return useQuery({
    queryKey: ['current-member'],
    queryFn: async () => {
      const response = await fetch('/api/user/current-member')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

## Security Checklist

### Before Deploying
- [ ] All sensitive API routes check authentication
- [ ] RLS policies are enabled on all tables
- [ ] Environment variables are properly configured
- [ ] OAuth redirect URLs are set correctly
- [ ] No service role keys in client-side code
- [ ] All user inputs are validated and sanitized

### Code Review Checklist
- [ ] New API routes have authentication checks
- [ ] Database queries respect user permissions
- [ ] No hardcoded user IDs or settlements
- [ ] Error messages don't leak sensitive information
- [ ] Proper loading and error states for auth components

---

## Need Help?

### Common Error Messages

**"User not authenticated"**
- Check if `session` exists in your component
- Verify JWT token is being sent with API requests
- Ensure user is signed in

**"Character not claimed"**
- User needs to complete character claiming process
- Check if `auth_user_id` is set in `players` table
- Verify character claiming API is working

**"Access denied"**
- User doesn't have required permissions for this action
- Check user's in-game settlement role
- Verify RLS policies allow the operation

**"Invalid JWT token"**
- Token may be expired (should auto-refresh)
- Check Supabase configuration
- Verify environment variables are set correctly