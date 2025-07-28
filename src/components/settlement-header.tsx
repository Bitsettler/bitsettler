'use client';


import { ProfessionAvatar } from './profession-avatar';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Settings, Activity, LogOut } from 'lucide-react';
import { useUserProfile } from '../hooks/use-user-profile';
import { useSelectedSettlement } from '../hooks/use-selected-settlement';
import { UserProfileManager } from './user-profile-manager';

interface SettlementHeaderProps {
  title?: string;
}

export function SettlementHeader({ title }: SettlementHeaderProps) {
  const { profile, isLoading, clearProfile } = useUserProfile();
  const { clearSettlement } = useSelectedSettlement();

  const handleSignOut = () => {
    // Clear both profile and settlement data
    clearProfile();
    clearSettlement();
    // Optionally redirect to home page
    window.location.href = '/';
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">{title || "Settlement Management"}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Profile section - only shown in Settlement area */}
          {!isLoading && (
            <div className="flex items-center gap-2">
              {profile ? (
                <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="sm" className="flex items-center gap-2">
                       <ProfessionAvatar
                         profession={profile.profession}
                         displayName={profile.displayName}
                         profileColor={profile.profileColor}
                         profileInitials={profile.profileInitials}
                         size="sm"
                       />
                       <span className="hidden md:inline">{profile.displayName}</span>
                     </Button>
                   </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="w-48">
                       <UserProfileManager
                         trigger={
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                             <Settings className="mr-2 h-4 w-4" />
                             Profile Settings
                           </DropdownMenuItem>
                         }
                       />
                       <DropdownMenuItem>
                         <Activity className="mr-2 h-4 w-4" />
                         Activity ({profile.recentActivity.length})
                       </DropdownMenuItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                         <LogOut className="mr-2 h-4 w-4" />
                         Sign Out
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                </DropdownMenu>
                             ) : (
                 <div className="text-sm text-muted-foreground">
                   Profile setup in progress...
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 