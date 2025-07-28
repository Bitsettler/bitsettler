/**
 * Settlement Invite Code Utilities
 * Generates and manages 6-digit alphanumeric invite codes for settlement sharing
 */

// Characters used for invite codes (excluding confusing ones like 0, O, I, l)
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a 6-digit alphanumeric invite code
 * Format: ABC123 (3 letters + 3 numbers for easy reading)
 */
export function generateInviteCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  
  let code = '';
  
  // Generate 3 letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Generate 3 numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
}

/**
 * Alternative: Fully random 6-character alphanumeric code
 */
export function generateRandomInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CODE_CHARS.charAt(Math.floor(Math.random() * INVITE_CODE_CHARS.length));
  }
  return code;
}

/**
 * Validate invite code format
 */
export function isValidInviteCode(code: string): boolean {
  if (!code || code.length !== 6) {
    return false;
  }
  
  // Check if all characters are valid
  return code.split('').every(char => INVITE_CODE_CHARS.includes(char.toUpperCase()));
}

/**
 * Format invite code for display (no spaces)
 */
export function formatInviteCode(code: string): string {
  return code;
}

/**
 * Remove formatting from invite code (for storage/comparison)
 */
export function normalizeInviteCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}

/**
 * Generate a new invite code for a settlement
 */
export function generateSettlementInviteCode(settlementId: string, settlementName: string): {
  code: string;
  formattedCode: string;
  createdAt: string;
  settlementId: string;
  settlementName: string;
} {
  const code = generateInviteCode();
  
  return {
    code,
    formattedCode: code,
    createdAt: new Date().toISOString(),
    settlementId,
    settlementName
  };
}

/**
 * Copy invite code to clipboard
 */
export async function copyInviteCodeToClipboard(code: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Failed to copy invite code:', fallbackError);
      return false;
    }
  }
}

/**
 * Generate shareable invite link (for future use)
 */
export function generateInviteLink(code: string, baseUrl: string = window.location.origin): string {
  return `${baseUrl}/settlement/join/${code}`;
}

/**
 * Create invite message for sharing
 */
export function createInviteMessage(settlementName: string, inviteCode: string): string {
  return `🏘️ Join me in ${settlementName}!\n\nUse invite code: ${inviteCode}\n\nManage your settlement at Bitcraft.Guide`;
} 