'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import { ExternalLink, Edit2, Save, X, MessageCircle, Plus } from 'lucide-react';
import { DiscordIcon } from '@/components/icons/discord-icon';
import { useSettlementPermissions } from '@/hooks/use-settlement-permissions';
import { api } from '@/lib/api-client';

interface SettlementDiscordLinkProps {
  settlementId: string;
  initialDiscordLink?: string;
  variant?: 'default' | 'inline-small';
}

export function SettlementDiscordLink({ settlementId, initialDiscordLink, variant = 'default' }: SettlementDiscordLinkProps) {
  const [discordLink, setDiscordLink] = useState(initialDiscordLink || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const { userRole, loading: permissionsLoading } = useSettlementPermissions();

  // Only officers and co-owners can manage the Discord link
  const canManageDiscordLink = userRole?.canManageSettlement || false;

  useEffect(() => {
    setDiscordLink(initialDiscordLink || '');
  }, [initialDiscordLink]);

  // Fetch Discord link if not provided as prop
  useEffect(() => {
    if (!initialDiscordLink && settlementId && !fetchAttempted && !permissionsLoading) {
      const fetchDiscordLink = async () => {
        try {
          setFetchAttempted(true);
          const result = await api.get(`/api/settlement/discord-link?settlementId=${settlementId}`);
          if (result.success && result.data?.discordLink) {
            setDiscordLink(result.data.discordLink);
          }
        } catch (error) {
          console.error('Error fetching Discord link:', error);
        }
      };
      
      fetchDiscordLink();
    }
  }, [settlementId, initialDiscordLink, fetchAttempted, permissionsLoading]);

  const validateDiscordLink = (link: string): boolean => {
    if (!link.trim()) return true; // Allow empty links
    
    const discordRegex = /^https?:\/\/(discord\.(gg|com)\/|discordapp\.com\/invite\/).+$/;
    return discordRegex.test(link.trim());
  };

  const handleStartEdit = () => {
    setEditValue(discordLink);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditValue('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedLink = editValue.trim();
    
    if (trimmedLink && !validateDiscordLink(trimmedLink)) {
      toast.error("Please enter a valid Discord invite link (e.g., https://discord.gg/your-server)");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await api.post('/api/settlement/discord-link', {
        settlementId,
        discordLink: trimmedLink || null,
      });
      
      if (result.success) {
        setDiscordLink(trimmedLink);
        setIsEditing(false);
        setEditValue('');
        toast.success(trimmedLink 
          ? "Settlement Discord link has been updated successfully."
          : "Settlement Discord link has been removed.");
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating Discord link:', error);
      toast.error("Failed to update Discord link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLinkClick = () => {
    if (discordLink) {
      window.open(discordLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render anything while permissions are loading to avoid flashing
  if (permissionsLoading) {
    return null;
  }

  // If no Discord link is set and user can't manage it, don't show anything
  if (!discordLink && !canManageDiscordLink) {
    return null;
  }

  // Inline small variant for dashboard header
  if (variant === 'inline-small') {
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Discord invite link..."
            className="h-5 text-xs w-48"
            autoFocus
          />
          <Button
            onClick={handleSave}
            variant="ghost"
            size="sm"
            className="h-5 px-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button
            onClick={handleCancelEdit}
            variant="ghost"
            size="sm"
            className="h-5 px-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    if (!discordLink) {
      return canManageDiscordLink ? (
        <Button
          onClick={handleStartEdit}
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Discord
        </Button>
      ) : null;
    }

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs text-[#5865F2] hover:text-[#4752C4]"
          onClick={handleDiscordLinkClick}
        >
          <DiscordIcon size={12} className="mr-1" />
          Discord
        </Button>
        {canManageDiscordLink && (
          <Button
            onClick={handleStartEdit}
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      {!isEditing ? (
        <>
          {discordLink ? (
            <>
              <Button
                onClick={handleDiscordLinkClick}
                size="sm"
                className="gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white border-[#5865F2] hover:border-[#4752C4]"
              >
                <DiscordIcon size={16} />
                Join Discord
                <ExternalLink className="h-4 w-4" />
              </Button>
              {canManageDiscordLink && (
                <Button
                  onClick={handleStartEdit}
                  variant="ghost"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            canManageDiscordLink && (
              <Button onClick={handleStartEdit} variant="outline" size="sm" className="gap-2 border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white">
                <Plus className="h-4 w-4" />
                Add Discord
              </Button>
            )
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 w-full">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="https://discord.gg/your-server"
            className="flex-1"
            size="sm"
          />
          <Button
            onClick={handleSave}
            disabled={isLoading}
            size="sm"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleCancelEdit}
            variant="outline"
            disabled={isLoading}
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}