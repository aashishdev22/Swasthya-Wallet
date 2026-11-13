/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Profile Photo Upload, Crop/Preview, View Lightbox & Remove Modal
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  cropAndCompressProfilePhoto,
  formatFileSize,
  validateProfilePhotoFile,
} from '../utils/profilePhoto.ts';
import { AvatarBadge } from './AvatarBadge.tsx';

interface ProfilePhotoManagerModalProps {
  isOpen: boolean;
  initialMode: 'upload' | 'view' | 'remove';
  patientName: string;
  currentAvatarUrl?: string | null;
  onClose: () => void;
  onUploadConfirmed: (payload: {
    blob: Blob;
    ext: string;
    dataUrl: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onRemoveConfirmed: () => Promise<{ success: boolean; error?: string }>;
}

export const ProfilePhotoManagerModal: React.FC<ProfilePhotoManagerModalProps> = ({
  isOpen,
  initialMode,
  patientName,
  currentAvatarUrl,
  onClose,
  onUploadConfirmed,
  onRemoveConfirmed,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<'upload' | 'view' | 'remove'>(initialMode);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setValidationError(null);
      setIsSubmitting(false);
      if (initialMode !== 'upload') {
        setRawImageSrc(null);
        setSelectedFileName('');
        setSelectedFileSize(0);
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    const check = validateProfilePhotoFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!check.valid) {
      setValidationError(check.error || 'Invalid image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(String(reader.result || ''));
      setSelectedFileName(file.name);
      setSelectedFileSize(file.size);
      setZoom(1.1);
      setOffsetX(0);
      setOffsetY(0);
      setMode('upload');
    };
    reader.onerror = () => {
      setValidationError('Unable to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!rawImageSrc) {
      setValidationError('Please choose a valid JPG, JPEG, PNG, or WEBP image first.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const cropped = await cropAndCompressProfilePhoto(rawImageSrc, {
        zoom,
        offsetX,
        offsetY,
        outputSize: 512,
        quality: 0.86,
      });

      const res = await onUploadConfirmed({
        blob: cropped.blob,
        ext: cropped.ext,
        dataUrl: cropped.dataUrl,
      });

      if (!res.success) {
        setValidationError(res.error || 'Upload failed. Your previous photo remains unchanged.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setRawImageSrc(null);
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to crop or upload image.');
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    setIsSubmitting(true);
    setValidationError(null);
    try {
      const res = await onRemoveConfirmed();
      if (!res.success) {
        setValidationError(res.error || 'Unable to remove profile photo.');
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to remove profile photo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Profile Photo Management"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {mode === 'view'
                  ? 'Citizen Profile Photo'
                  : mode === 'remove'
                  ? 'Remove Profile Photo'
                  : currentAvatarUrl
                  ? 'Change Profile Photo'
                  : 'Upload Profile Photo'}
              </h2>
              <p className="text-[11px] text-blue-200">
                Swasthya Wallet • Private Encrypted Storage
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close photo dialog"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">error</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* VIEW LIGHTBOX MODE */}
          {mode === 'view' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center shadow-inner">
                <AvatarBadge
                  name={patientName}
                  avatarUrl={currentAvatarUrl}
                  sizeClass="w-full h-full"
                  textSizeClass="text-5xl"
                  roundedClass="rounded-none"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Stored in your private Swasthya Wallet photo bucket. Only your authenticated session can read or modify this photo.
              </p>
              <div className="flex items-center gap-2 w-full justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Change Photo
                </button>
                {currentAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setMode('remove')}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* REMOVE CONFIRMATION MODE */}
          {mode === 'remove' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <AvatarBadge
                  name={patientName}
                  avatarUrl={currentAvatarUrl}
                  sizeClass="w-16 h-16"
                  textSizeClass="text-lg"
                />
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-900 text-sm mb-0.5">
                    Delete profile photo for {patientName}?
                  </p>
                  <p>
                    Your photo will be permanently deleted from private storage and replaced with your initials badge.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>{isSubmitting ? 'Removing...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </div>
          )}

          {/* UPLOAD & CROP MODE */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleSelectFile}
                className="hidden"
                aria-label="Choose profile photo file"
              />

              {!rawImageSrc ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      Select a Profile Photo
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Supported formats: JPG, JPEG, PNG, WEBP • Maximum 5 MB
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-52 h-52 rounded-full overflow-hidden border-4 border-blue-100 shadow-md bg-slate-100 relative flex items-center justify-center">
                      <img
                        src={rawImageSrc}
                        alt="Crop preview"
                        className="w-full h-full object-cover select-none"
                        style={{
                          transform: `scale(${zoom}) translate(${offsetX * 25}%, ${offsetY * 25}%)`,
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{selectedFileName}</span>
                      <span>•</span>
                      <span>{formatFileSize(selectedFileSize)}</span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-700 font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Choose another
                      </button>
                    </div>
                  </div>

                  {/* Crop & Position Controls */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 text-xs">
                    <label className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-700 w-24">Zoom</span>
                      <input
                        type="range"
                        min={1}
                        max={2.6}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                      <span className="font-mono text-slate-600 w-10 text-right">{zoom.toFixed(1)}x</span>
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-700 w-24">Horizontal</span>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={offsetX}
                        onChange={(e) => setOffsetX(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-700 w-24">Vertical</span>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={offsetY}
                        onChange={(e) => setOffsetY(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  disabled={isSubmitting || !rawImageSrc}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSubmitting ? 'sync' : 'cloud_upload'}
                  </span>
                  <span>{isSubmitting ? 'Uploading...' : 'Save Profile Photo'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
