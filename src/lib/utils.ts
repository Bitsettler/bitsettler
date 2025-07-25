import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert camelCase or PascalCase string to spaced words
 * Examples: "ClothesTorso" -> "Clothes Torso", "maskPattern" -> "Mask Pattern"
 */
export function camelCaseToSpaces(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Handle consecutive capitals
    .trim()
}
