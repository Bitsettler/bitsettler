import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getBestDiscordAvatar } from '@/lib/discord-avatar';

interface DiscordAvatarProps {
  /** Discord user ID */
  userId?: string | null;
  /** Discord avatar hash */
  avatarHash?: string | null;
  /** Discord avatar URL (if already constructed) */
  avatarUrl?: string | null;
  /** Discord discriminator for fallback avatar */
  discriminator?: string;
  /** User's display name for alt text */
  displayName?: string;
  /** Avatar size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Fallback image if no Discord avatar */
  fallbackSrc?: string;
}

export function DiscordAvatar({
  userId,
  avatarHash,
  avatarUrl,
  discriminator = '0',
  displayName = 'User',
  size = 32,
  className,
  fallbackSrc = '/default-avatar.svg'
}: DiscordAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Determine the best avatar URL to use
  let finalAvatarUrl: string;
  
  if (imageError) {
    // If there was an error loading, use fallback
    finalAvatarUrl = fallbackSrc;
  } else if (avatarUrl) {
    // Use provided URL if available
    finalAvatarUrl = avatarUrl;
  } else if (userId && avatarHash) {
    // Construct Discord URL from user ID and hash
    finalAvatarUrl = getBestDiscordAvatar(userId, avatarHash, discriminator, size);
  } else if (userId) {
    // Use default Discord avatar
    finalAvatarUrl = getBestDiscordAvatar(userId, null, discriminator, size);
  } else {
    // Use our fallback image
    finalAvatarUrl = fallbackSrc;
  }

  console.log('🖼️ DiscordAvatar render:', {
    displayName,
    userId,
    avatarHash,
    avatarUrl,
    finalAvatarUrl,
    imageError
  });

  return (
    <img
      src={finalAvatarUrl}
      alt={`${displayName}'s avatar`}
      width={size}
      height={size}
      className={cn(
        'rounded-full object-cover bg-muted',
        className
      )}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}

interface MemberAvatarProps {
  /** Settlement member data */
  member: {
    name: string;
    display_name?: string | null;
    discord_user_id?: string | null;
    discord_avatar_hash?: string | null;
    discord_avatar_url?: string | null;
    discord_username?: string | null;
  };
  /** Avatar size in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Avatar component specifically for settlement members
 * Automatically handles Discord avatar data from member object
 */
export function MemberAvatar({
  member,
  size = 32,
  className
}: MemberAvatarProps) {
  const displayName = member.display_name || member.name;
  
  // If no Discord data is available, show a fallback with initials
  if (!member.discord_user_id && !member.discord_avatar_url) {
    const initials = displayName.substring(0, 2).toUpperCase();
    return (
      <div
        className={cn(
          'rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold',
          className
        )}
        style={{ width: size, height: size, fontSize: Math.floor(size * 0.4) }}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <DiscordAvatar
      userId={member.discord_user_id}
      avatarHash={member.discord_avatar_hash}
      avatarUrl={member.discord_avatar_url}
      displayName={displayName}
      size={size}
      className={className}
    />
  );
}
