'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import { ExternalLink, Edit2, Save, X, MessageCircle, Plus } from 'lucide-react';
import { useSettlementPermissions } from '@/hooks/use-settlement-permissions';

interface SettlementDiscordLinkProps {
  settlementId: string;
  initialDiscordLink?: string;
}

export function SettlementDiscordLink({ settlementId, initialDiscordLink }: SettlementDiscordLinkProps) {
  const [discordLink, setDiscordLink] = useState(initialDiscordLink || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { userRole } = useSettlementPermissions();

  // Only officers and co-owners can manage the Discord link
  const canManageDiscordLink = userRole?.canManageSettlement || false;

  useEffect(() => {
    setDiscordLink(initialDiscordLink || '');
  }, [initialDiscordLink]);

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
      const response = await fetch(`/api/settlement/discord-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settlementId,
          discordLink: trimmedLink || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update Discord link');
      }

      const result = await response.json();
      
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

  // If no Discord link is set and user can't manage it, don't show anything
  if (!discordLink && !canManageDiscordLink) {
    return null;
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
                variant="outline"
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
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
              <Button onClick={handleStartEdit} variant="outline" size="sm" className="gap-2">
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