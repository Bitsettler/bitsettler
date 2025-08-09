/**
 * Discord Avatar Utilities
 * Functions for handling Discord avatar URLs and data
 */

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  discriminator: string;
  avatar?: string;
  email?: string;
}

export interface DiscordAvatarData {
  discord_user_id: string;
  discord_username: string;
  discord_global_name?: string;
  discord_avatar_hash?: string;
  discord_avatar_url?: string;
  discord_avatar_updated_at: string;
}

/**
 * Construct Discord avatar URL from user data
 */
export function getDiscordAvatarUrl(
  userId: string, 
  avatarHash: string | null | undefined, 
  size: number = 256
): string | null {
  if (!avatarHash) {
    return null; // No custom avatar
  }
  
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=${size}`;
}

/**
 * Get default Discord avatar URL for users without custom avatars
 */
export function getDefaultDiscordAvatar(discriminator: string, size: number = 256): string {
  // Discord's default avatar is based on discriminator modulo 5
  const defaultAvatarNumber = parseInt(discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png?size=${size}`;
}

/**
 * Get the best available avatar URL for a Discord user
 */
export function getBestDiscordAvatar(
  userId: string,
  avatarHash: string | null | undefined,
  discriminator: string = '0',
  size: number = 256
): string {
  const customAvatar = getDiscordAvatarUrl(userId, avatarHash, size);
  if (customAvatar) {
    return customAvatar;
  }
  
  return getDefaultDiscordAvatar(discriminator, size);
}

/**
 * Extract Discord avatar data from Supabase auth user metadata
 */
export function extractDiscordAvatarData(user: any): DiscordAvatarData | null {
  console.log('🔍 Extracting Discord avatar data from user:', {
    userMetadata: user.user_metadata,
    appMetadata: user.app_metadata,
    provider: user.app_metadata?.provider
  });

  // Supabase stores Discord data in user.user_metadata
  const metadata = user.user_metadata;
  if (!metadata || !metadata.sub) {
    console.log('❌ No user metadata or sub found');
    return null;
  }

  const discordUserId = metadata.sub;
  const avatarHash = metadata.avatar || null;
  const username = metadata.user_name || metadata.name || '';
  const globalName = metadata.full_name || metadata.global_name || null;
  
  // For discriminator, check both discriminator field and extract from username
  let discriminator = metadata.discriminator;
  if (!discriminator && username.includes('#')) {
    discriminator = username.split('#')[1];
  }
  discriminator = discriminator || '0';

  const avatarUrl = getBestDiscordAvatar(discordUserId, avatarHash, discriminator);

  const result = {
    discord_user_id: discordUserId,
    discord_username: username,
    discord_global_name: globalName,
    discord_avatar_hash: avatarHash,
    discord_avatar_url: avatarUrl,
    discord_avatar_updated_at: new Date().toISOString()
  };

  console.log('✅ Discord avatar data extracted:', result);

  return result;
}

/**
 * Update member avatar data when Discord info changes
 */
export function shouldUpdateAvatar(
  currentAvatarHash: string | null,
  newAvatarHash: string | null,
  lastUpdated: string | null,
  maxAgeHours: number = 24
): boolean {
  // Always update if avatar hash changed
  if (currentAvatarHash !== newAvatarHash) {
    return true;
  }

  // Update if it's been too long since last update
  if (lastUpdated) {
    const lastUpdatedDate = new Date(lastUpdated);
    const hoursAgo = (Date.now() - lastUpdatedDate.getTime()) / (1000 * 60 * 60);
    return hoursAgo > maxAgeHours;
  }

  // Update if never updated before
  return true;
}
