'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Copy, RefreshCw, Share2, Users, Check } from 'lucide-react';
import { copyInviteCodeToClipboard, createInviteMessage } from '../lib/utils/invite-codes';
import { SettlementInviteCode } from '../hooks/use-selected-settlement';
import { toast } from 'sonner';

interface SettlementInviteCodeProps {
  inviteCode: SettlementInviteCode;
  onRegenerate: () => SettlementInviteCode | null;
  className?: string;
}

export function SettlementInviteCodeDisplay({ 
  inviteCode, 
  onRegenerate, 
  className = '' 
}: SettlementInviteCodeProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleCopy = async () => {
    const success = await copyInviteCodeToClipboard(inviteCode.code);
    if (success) {
      setIsCopied(true);
      toast.success('Invite code copied to clipboard!');
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
        toast.success('Invite shared successfully!');
      } catch (_error) {
        // User cancelled or share failed, fall back to copy
        const success = await copyInviteCodeToClipboard(message);
        if (success) {
          toast.success('Invite message copied to clipboard!');
        } else {
          toast.error('Failed to share invite');
        }
      }
    } else {
      // Fallback to copying message
      const success = await copyInviteCodeToClipboard(message);
      if (success) {
        toast.success('Invite message copied to clipboard!');
      } else {
        toast.error('Failed to copy invite message');
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Settlement Invite Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settlement Info */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">{inviteCode.settlementName}</h3>
          <p className="text-muted-foreground text-sm">
            Share this code with others to invite them to your settlement
          </p>
        </div>

        <Separator />

        {/* Invite Code Display */}
        <div className="text-center space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Your Invite Code</p>
            <div className="bg-muted rounded-lg p-4">
              <code className="text-2xl font-mono font-bold tracking-wider">
                {inviteCode.formattedCode}
              </code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>

            <Button
              onClick={handleRegenerate}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <Separator />

        {/* Instructions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">How to use this code:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share this code with friends or settlement members</li>
            <li>• They can use it to join your settlement management</li>
            <li>• Regenerate anytime to create a new code</li>
            <li>• Only one code is active per settlement at a time</li>
          </ul>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Created: {new Date(inviteCode.createdAt).toLocaleDateString()}</span>
          <Badge variant="secondary" className="text-xs">
            Settlement ID: {inviteCode.settlementId.slice(-6)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
} 