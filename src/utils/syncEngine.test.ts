/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectRecordConflict,
  nextRetryDelayMs,
  syncEngine,
} from './syncEngine.ts';
import {
  encryptBackupEnvelope,
  decryptBackupEnvelope,
  setDriveFileId,
  getDriveFileId,
  recordUploadedDigest,
  isDuplicateDriveUpload,
} from './googleDrive.ts';
import { MedicalRecord } from '../data/mockData.ts';

function sampleRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: 'rec-test-1',
    title: 'Complete Blood Count (CBC)',
    category: 'lab',
    code: 'LOINC 58410-2',
    codeStandard: 'LOINC',
    date: '14/10/2024',
    clinician: 'Dr. Ananya Iyer',
    hospital: 'AIIMS New Delhi',
    integrityStatus: 'SHA-256 Valid',
    verified: true,
    sha256: 'A'.repeat(64),
    fileSize: '1.2 MB',
    fileFormat: 'PDF',
    version: 1,
    updatedAt: 1700000000000,
    ...overrides,
  };
}

test('AES-GCM-256 encryption and decryption round-trip for Drive backups', async () => {
  const rec = sampleRecord();
  const envelope = await encryptBackupEnvelope([rec], 'aarav-seed-123');
  assert.equal(envelope.encrypted, true);
  assert.equal(envelope.algorithm, 'AES-GCM-256');
  assert.ok(envelope.ciphertext.length > 0);
  assert.equal(envelope.recordsCount, 1);

  const decrypted = await decryptBackupEnvelope(envelope, 'aarav-seed-123');
  assert.equal(decrypted.length, 1);
  assert.equal(decrypted[0].id, rec.id);
  assert.equal(decrypted[0].title, rec.title);
});

test('Drive file ID mapping and duplicate upload prevention', () => {
  const rec = sampleRecord({ id: 'rec-dup-1', sha256: 'DEADBEEF', version: 2 });
  assert.equal(isDuplicateDriveUpload(rec), false);

  setDriveFileId(rec.id, 'drive_file_abc123');
  recordUploadedDigest(rec.id, 'DEADBEEF', 2);
  assert.equal(getDriveFileId(rec.id), 'drive_file_abc123');
  assert.equal(isDuplicateDriveUpload(rec), true);

  // Version bump invalidates duplicate skip so update uploads
  assert.equal(isDuplicateDriveUpload({ ...rec, version: 3 }), false);

  // Cleanup removes mapping
  setDriveFileId(rec.id, null);
  assert.equal(getDriveFileId(rec.id), null);
  assert.equal(isDuplicateDriveUpload(rec), false);
});

test('detectRecordConflict handles equal, newer, and diverged versions', () => {
  const base = sampleRecord({ version: 2, updatedAt: 2000, sha256: 'HASH1' });
  const same = sampleRecord({ version: 2, updatedAt: 2000, sha256: 'HASH1' });
  assert.equal(detectRecordConflict(base, same).hasConflict, false);
  assert.equal(detectRecordConflict(base, same).resolution, 'equal');

  const newerLocal = sampleRecord({ version: 3, updatedAt: 3000, sha256: 'HASH2' });
  const resLocal = detectRecordConflict(newerLocal, base);
  assert.equal(resLocal.hasConflict, true);
  assert.equal(resLocal.resolution, 'local_newer');
  assert.equal(resLocal.winner.version, 3);

  const newerRemote = sampleRecord({ version: 4, updatedAt: 4000, sha256: 'HASH3' });
  const resRemote = detectRecordConflict(newerLocal, newerRemote);
  assert.equal(resRemote.resolution, 'remote_newer');
  assert.equal(resRemote.winner.version, 4);

  const diverged = sampleRecord({ version: 2, updatedAt: 5000, sha256: 'HASH_DIFF' });
  const resDiv = detectRecordConflict(base, diverged);
  assert.equal(resDiv.resolution, 'diverged');
  assert.equal(resDiv.winner.version, 3);
});

test('nextRetryDelayMs applies bounded exponential backoff', () => {
  assert.equal(nextRetryDelayMs(0), 1500);
  assert.equal(nextRetryDelayMs(1), 3000);
  assert.equal(nextRetryDelayMs(2), 6000);
  assert.ok(nextRetryDelayMs(10) <= 60000);
});

test('syncEngine never reports false cloud sync success when Drive is disconnected', async () => {
  const rec = sampleRecord({ id: 'rec-honest-1' });
  const result = await syncEngine.autoSaveRecord(rec, 'Aarav Sharma');
  assert.equal(result.localSuccess, true);
  assert.equal(result.cloudSuccess, false);
  assert.notEqual(syncEngine.getStatus().state, 'Synced');

  const manualOk = await syncEngine.triggerManualSync([rec], 'Aarav Sharma');
  assert.equal(manualOk, false);
});
