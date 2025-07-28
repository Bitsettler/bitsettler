'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getProfessionById } from '../constants/professions';

interface ProfessionAvatarProps {
  profession?: string;
  displayName: string;
  profileColor: string;
  profileInitials: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10', 
  lg: 'h-12 w-12',
  xl: 'h-20 w-20'
};

export function ProfessionAvatar({ 
  profession, 
  displayName, 
  profileColor, 
  profileInitials, 
  size = 'md',
  className = ''
}: ProfessionAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const professionData = profession ? getProfessionById(profession) : null;
  
  const handleImageError = () => {
    setImageError(true);
  };

  const avatarStyle = professionData && !imageError 
    ? { backgroundColor: professionData.fallbackColor } 
    : { backgroundColor: profileColor };

  return (
    <Avatar 
      className={`${sizeClasses[size]} ${className}`} 
      style={avatarStyle}
      title={professionData?.name ? `${displayName} - ${professionData.name}` : displayName}
    >
      {professionData && !imageError && (
        <AvatarImage 
          src={professionData.imagePath} 
          alt={`${professionData.name} avatar`}
          onError={handleImageError}
        />
      )}
      <AvatarFallback style={avatarStyle}>
        <span className="text-white font-medium">
          {profileInitials}
        </span>
      </AvatarFallback>
    </Avatar>
  );
} 