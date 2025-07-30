'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'

export interface SettlementPermissions {
  inventory_permission: boolean
  build_permission: boolean
  officer_permission: boolean
  co_owner_permission: boolean
}

export interface UserRole {
  level: 'member' | 'storage' | 'builder' | 'officer' | 'co-owner' | 'owner'
  displayName: string
  canManageSettlement: boolean
  canManageMembers: boolean
  canManageProjects: boolean
  canManageTreasury: boolean
  canViewAdminPanel: boolean
  // New: View-only permissions for all members
  canViewTreasury: boolean
  canViewMembers: boolean
}

export function useSettlementPermissions() {
  const { user, session } = useAuth()
  const [permissions, setPermissions] = useState<SettlementPermissions | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setPermissions(null)
      setUserRole(null)
      setLoading(false)
      return
    }

    fetchUserPermissions()
  }, [session])

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch('/api/user/current-member', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const member = data.member

        if (member) {
          const perms: SettlementPermissions = {
            inventory_permission: member.inventory_permission === 1,
            build_permission: member.build_permission === 1,
            officer_permission: member.officer_permission === 1,
            co_owner_permission: member.co_owner_permission === 1
          }

          const role = calculateUserRole(perms)
          
          setPermissions(perms)
          setUserRole(role)
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateUserRole = (perms: SettlementPermissions): UserRole => {
    // Determine role based on highest permission level
    if (perms.co_owner_permission) {
      return {
        level: 'co-owner',
        displayName: 'Co-Owner',
        canManageSettlement: true,
        canManageMembers: true,
        canManageProjects: true,
        canManageTreasury: true,
        canViewAdminPanel: true,
        canViewTreasury: true,
        canViewMembers: true
      }
    }
    
    if (perms.officer_permission) {
      return {
        level: 'officer',
        displayName: 'Officer',
        canManageSettlement: true,
        canManageMembers: true,
        canManageProjects: true,
        canManageTreasury: true,
        canViewAdminPanel: true,
        canViewTreasury: true,
        canViewMembers: true
      }
    }
    
    if (perms.build_permission) {
      return {
        level: 'builder',
        displayName: 'Builder',
        canManageSettlement: false,
        canManageMembers: false,
        canManageProjects: true,
        canManageTreasury: false,
        canViewAdminPanel: false,
        canViewTreasury: true,
        canViewMembers: true
      }
    }
    
    if (perms.inventory_permission) {
      return {
        level: 'storage',
        displayName: 'Storage',
        canManageSettlement: false,
        canManageMembers: false,
        canManageProjects: true,
        canManageTreasury: false,
        canViewAdminPanel: false,
        canViewTreasury: true,
        canViewMembers: true
      }
    }

    // Default member
    return {
      level: 'member',
      displayName: 'Member',
      canManageSettlement: false,
      canManageMembers: false,
      canManageProjects: false,
      canManageTreasury: false,
      canViewAdminPanel: false,
      canViewTreasury: true,
      canViewMembers: true
    }
  }

  return {
    permissions,
    userRole,
    loading,
    refreshPermissions: fetchUserPermissions
  }
}