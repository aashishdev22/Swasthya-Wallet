/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Profile Photo Validation, Cropping & Helper Utilities
 * Official Slogan: Digital Health Locker for Citizens
 */

export const PROFILE_PHOTOS_BUCKET = 'profile-photos';
export const HEALTH_DOCUMENTS_BUCKET = 'health-documents';
export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_PROFILE_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_PROFILE_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export type AllowedProfilePhotoExt = (typeof ALLOWED_PROFILE_PHOTO_EXTENSIONS)[number];

export interface ProfilePhotoValidationResult {
  valid: boolean;
  error?: string;
  extension?: AllowedProfilePhotoExt;
  normalizedMimeType?: string;
}

export interface CropOptions {
  zoom?: number; // 1.0 to 3.0
  offsetX?: number; // -1.0 to 1.0 normalized pan
  offsetY?: number; // -1.0 to 1.0 normalized pan
  outputSize?: number; // e.g. 512px square
  quality?: number; // 0.1 to 1.0
}

export interface CroppedPhotoResult {
  blob: Blob;
  mimeType: string;
  ext: 'webp' | 'jpg';
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Validate profile image file type (JPG, JPEG, PNG, WEBP) and size (max 5 MB).
 */
export function validateProfilePhotoFile(file: {
  name: string;
  type?: string;
  size: number;
}): ProfilePhotoValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'Please choose an image file to upload.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'Selected image file is empty (0 bytes).' };
  }

  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Image is too large (${sizeMb} MB). Maximum allowed profile photo size is 5 MB.`,
    };
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase().trim() || '';
  const mime = (file.type || '').toLowerCase().trim();

  const extAllowed = (ALLOWED_PROFILE_PHOTO_EXTENSIONS as readonly string[]).includes(rawExt);
  const mimeAllowed = mime ? (ALLOWED_PROFILE_PHOTO_MIME_TYPES as readonly string[]).includes(mime) : true;

  if (!extAllowed || (mime && !mimeAllowed)) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPG, JPEG, PNG, or WEBP photo.',
    };
  }

  const normalizedMimeType =
    mime === 'image/png'
      ? 'image/png'
      : mime === 'image/webp'
      ? 'image/webp'
      : 'image/jpeg';

  return {
    valid: true,
    extension: rawExt as AllowedProfilePhotoExt,
    normalizedMimeType,
  };
}

/**
 * Build deterministic owner-scoped storage object path for Supabase private bucket.
 */
export function buildProfilePhotoStoragePath(userId: string, ext: string): string {
  const cleanUserId = (userId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanUserId) {
    throw new Error('Authenticated user ID is required to build storage path.');
  }
  const cleanExt = (ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedExt = cleanExt === 'jpeg' ? 'jpg' : cleanExt || 'jpg';
  return `${cleanUserId}/profile-photo.${normalizedExt}`;
}

/**
 * Generate crisp 1-2 letter uppercase initials for avatar fallbacks.
 */
export function getInitials(fullName?: string | null): string {
  const cleaned = (fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'U';
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Format file bytes into readable KB/MB display.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Client-side square crop + zoom + compression via HTML5 <canvas>.
 */
export async function cropAndCompressProfilePhoto(
  imageSrc: string,
  options: CropOptions = {}
): Promise<CroppedPhotoResult> {
  if (typeof document === 'undefined') {
    throw new Error('Canvas cropping is only available in browser contexts.');
  }

  const zoom = Math.max(1, Math.min(3, options.zoom ?? 1));
  const offsetX = Math.max(-1, Math.min(1, options.offsetX ?? 0));
  const offsetY = Math.max(-1, Math.min(1, options.offsetY ?? 0));
  const outputSize = options.outputSize ?? 512;
  const quality = options.quality ?? 0.86;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode selected image file.'));
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to initialize canvas 2D context.');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputSize, outputSize);

  const minSide = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const cropSide = minSide / zoom;
  const maxShiftX = Math.max(0, (img.naturalWidth - cropSide) / 2);
  const maxShiftY = Math.max(0, (img.naturalHeight - cropSide) / 2);

  const sx = Math.max(
    0,
    Math.min(img.naturalWidth - cropSide, (img.naturalWidth - cropSide) / 2 - offsetX * maxShiftX)
  );
  const sy = Math.max(
    0,
    Math.min(img.naturalHeight - cropSide, (img.naturalHeight - cropSide) / 2 - offsetY * maxShiftY)
  );

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, cropSide, cropSide, 0, 0, outputSize, outputSize);

  // Prefer image/jpeg for broad compatibility across browsers & Supabase storage limits
  const targetMime = 'image/jpeg';
  const ext: 'jpg' | 'webp' = 'jpg';

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Failed to compress profile photo.'));
      },
      targetMime,
      quality
    );
  });

  const dataUrl = canvas.toDataURL(targetMime, quality);

  return {
    blob,
    mimeType: targetMime,
    ext,
    dataUrl,
    width: outputSize,
    height: outputSize,
  };
}
