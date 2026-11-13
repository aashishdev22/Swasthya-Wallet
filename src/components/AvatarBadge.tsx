/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Citizen Avatar Badge with Crisp Initials Fallback
 */

import React, { useEffect, useState } from 'react';
import { getInitials } from '../utils/profilePhoto.ts';

interface AvatarBadgeProps {
  name?: string | null;
  avatarUrl?: string | null;
  sizeClass?: string;
  textSizeClass?: string;
  roundedClass?: string;
  className?: string;
  onClick?: () => void;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  name,
  avatarUrl,
  sizeClass = 'w-10 h-10',
  textSizeClass = 'text-xs',
  roundedClass = 'rounded-full',
  className = '',
  onClick,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl && avatarUrl.trim().length > 0 && !imgFailed);
  const initials = getInitials(name);
  const label = `${name || 'Citizen'} profile photo`;

  const innerContent = showImage ? (
    <img
      src={avatarUrl!}
      alt={label}
      onError={() => setImgFailed(true)}
      className={`${sizeClass} ${roundedClass} object-cover shrink-0 bg-blue-100 ${onClick ? '' : className}`}
    />
  ) : (
    <div
      aria-label={`${name || 'Citizen'} avatar initials ${initials}`}
      className={`${sizeClass} ${roundedClass} shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold flex items-center justify-center select-none ${textSizeClass} ${onClick ? '' : className}`}
    >
      {initials}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Manage ${label}`}
        className={`inline-flex shrink-0 ${roundedClass} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${className}`}
      >
        {innerContent}
      </button>
    );
  }

  return innerContent;
};
