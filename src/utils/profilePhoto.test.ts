/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PROFILE_PHOTO_BYTES,
  buildProfilePhotoStoragePath,
  formatFileSize,
  getInitials,
  validateProfilePhotoFile,
} from './profilePhoto.ts';

describe('Profile Photo Validation & Storage Path Utilities', () => {
  test('validateProfilePhotoFile accepts valid JPG, JPEG, PNG, and WEBP files within 5 MB', () => {
    const validJpg = validateProfilePhotoFile({
      name: 'portrait.jpg',
      type: 'image/jpeg',
      size: 450 * 1024,
    });
    assert.equal(validJpg.valid, true);
    assert.equal(validJpg.extension, 'jpg');

    const validPng = validateProfilePhotoFile({
      name: 'citizen.PNG',
      type: 'image/png',
      size: 2 * 1024 * 1024,
    });
    assert.equal(validPng.valid, true);
    assert.equal(validPng.extension, 'png');
    assert.equal(validPng.normalizedMimeType, 'image/png');

    const validWebp = validateProfilePhotoFile({
      name: 'avatar.webp',
      type: 'image/webp',
      size: MAX_PROFILE_PHOTO_BYTES,
    });
    assert.equal(validWebp.valid, true);
    assert.equal(validWebp.extension, 'webp');
  });

  test('validateProfilePhotoFile rejects oversized (> 5 MB), empty, and unsupported files', () => {
    const oversized = validateProfilePhotoFile({
      name: 'huge.jpg',
      type: 'image/jpeg',
      size: MAX_PROFILE_PHOTO_BYTES + 1,
    });
    assert.equal(oversized.valid, false);
    assert.ok(oversized.error?.includes('5 MB'));

    const emptyFile = validateProfilePhotoFile({
      name: 'blank.png',
      type: 'image/png',
      size: 0,
    });
    assert.equal(emptyFile.valid, false);

    const pdfFile = validateProfilePhotoFile({
      name: 'report.pdf',
      type: 'application/pdf',
      size: 102400,
    });
    assert.equal(pdfFile.valid, false);
    assert.ok(pdfFile.error?.includes('JPG, JPEG, PNG, or WEBP'));

    const gifFile = validateProfilePhotoFile({
      name: 'anim.gif',
      type: 'image/gif',
      size: 102400,
    });
    assert.equal(gifFile.valid, false);
  });

  test('buildProfilePhotoStoragePath constructs deterministic owner-scoped private object paths', () => {
    assert.equal(
      buildProfilePhotoStoragePath('user-123-abc', 'jpeg'),
      'user-123-abc/profile-photo.jpg'
    );
    assert.equal(
      buildProfilePhotoStoragePath('usr_999', 'webp'),
      'usr_999/profile-photo.webp'
    );
    assert.throws(() => buildProfilePhotoStoragePath('', 'jpg'));
  });

  test('getInitials generates clean fallback initials', () => {
    assert.equal(getInitials('Rohan Deshmukh'), 'RD');
    assert.equal(getInitials('Ananya'), 'AN');
    assert.equal(getInitials('  Vikram   Singh   Rathore '), 'VR');
    assert.equal(getInitials(''), 'U');
  });

  test('formatFileSize formats KB and MB cleanly', () => {
    assert.equal(formatFileSize(0), '0 KB');
    assert.equal(formatFileSize(1024), '1 KB');
    assert.equal(formatFileSize(2 * 1024 * 1024), '2.00 MB');
  });
});
