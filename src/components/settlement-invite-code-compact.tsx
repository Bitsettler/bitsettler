'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Copy, RefreshCw, Share2, Users, Check, ChevronDown } from 'lucide-react';
import { copyInviteCodeToClipboard, createInviteMessage } from '../lib/utils/invite-codes';
import { SettlementInviteCode } from '../hooks/use-selected-settlement';
import { toast } from 'sonner';

interface CompactInviteCodeProps {
  inviteCode: SettlementInviteCode;
  onRegenerate: () => SettlementInviteCode | null;
}

export function CompactSettlementInviteCode({ 
  inviteCode, 
  onRegenerate
}: CompactInviteCodeProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleCopy = async () => {
    const success = await copyInviteCodeToClipboard(inviteCode.code);
    if (success) {
      setIsCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error('Failed to copy invite code');
    }
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    const newCode = onRegenerate();
    if (newCode) {
      toast.success('New invite code generated!');
    } else {
      toast.error('Failed to generate new invite code');
    }
    setTimeout(() => setIsRegenerating(false), 500);
  };

  const handleShare = async () => {
    const message = createInviteMessage(inviteCode.settlementName, inviteCode.code);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${inviteCode.settlementName}`,
          text: message,
          url: window.location.origin
        });
        toast.success('Invite shared!');
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        const success = await copyInviteCodeToClipboard(message);
        if (success) {
          toast.success('Invite message copied!');
        } else {
          toast.error('Failed to share invite');
        }
      }
    } else {
      // Fallback to copying message
      const success = await copyInviteCodeToClipboard(message);
      if (success) {
        toast.success('Invite message copied!');
      } else {
        toast.error('Failed to copy invite message');
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Invite:</span>
          <Badge variant="secondary" className="font-mono">
            {inviteCode.formattedCode}
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-center">
          Settlement Invite Code
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 text-center">
          <div className="bg-muted rounded p-2 mb-2">
            <code className="text-lg font-mono font-bold">
              {inviteCode.formattedCode}
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code to invite others
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          {isCopied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleRegenerate} 
          disabled={isRegenerating}
          className="cursor-pointer"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="mr-2 h-4 w-4" />
          Share Invite
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 