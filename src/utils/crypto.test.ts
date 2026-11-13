/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDigest,
  generateReferenceCode,
  calculateShareScopeSummary,
  evaluateVerificationState,
  filterMedicalRecords,
  calculatePasswordStrength,
  validateAuthCredentials,
} from './crypto.ts';

test('formatDigest truncates long hex digest with bullet points', () => {
  const hash = '8F4E6B2A99C048DF72E3108B3492C91A04EF52A807BC4D9284D76E2A1019CFB5';
  const formatted = formatDigest(hash, 4);
  assert.equal(formatted, '8F4E••CFB5');
});

test('generateReferenceCode formats according to UHW-VRF-2024-8842 standard', () => {
  const custom = generateReferenceCode('99C0');
  assert.equal(custom, 'UHW-VRF-2024-8842-99C0');
  const generated = generateReferenceCode();
  assert.match(generated, /^UHW-VRF-2024-8842-[0-9A-F]{4}$/);
});

test('calculateShareScopeSummary creates human-readable consent text', () => {
  const summary = calculateShareScopeSummary(
    ['Comprehensive Metabolic Panel', 'Chest X-Ray'],
    'Dr. Marcus Chen, MD',
    '1 hour'
  );
  assert.match(summary, /2 medical records authorized for Dr\. Marcus Chen, MD/);
  assert.match(summary, /strictly for 1 hour/);
});

test('evaluateVerificationState correctly produces all 4 simulation matrix states', () => {
  const verified = evaluateVerificationState('verified');
  assert.equal(verified.badge, '100% VALIDATED');
  assert.equal(verified.badgeType, 'success');

  const invalid = evaluateVerificationState('invalid');
  assert.equal(invalid.badgeType, 'error');

  const expired = evaluateVerificationState('expired');
  assert.equal(expired.badgeType, 'warning');

  const timeout = evaluateVerificationState('timeout');
  assert.equal(timeout.badgeType, 'neutral');
});

test('filterMedicalRecords filters correctly by category, query, and verified status', () => {
  const records = [
    { title: 'Lipid Profile', category: 'lab', clinician: 'Dr. Sarah Jenkins', verified: true, code: 'LOINC 24323-8' },
    { title: 'Chest X-Ray', category: 'imaging', clinician: 'Dr. Kevin Vance', verified: true, code: 'DICOM-RAD-30' },
    { title: 'Unsigned Consultation', category: 'consult', clinician: 'Dr. Sarah Jenkins', verified: false, code: 'SNOMED' }
  ];

  const labsOnly = filterMedicalRecords(records, '', 'lab', false);
  assert.equal(labsOnly.length, 1);
  assert.equal(labsOnly[0].title, 'Lipid Profile');

  const verifiedOnly = filterMedicalRecords(records, '', 'all', true);
  assert.equal(verifiedOnly.length, 2);

  const querySearch = filterMedicalRecords(records, 'Vance', 'all', false);
  assert.equal(querySearch.length, 1);
  assert.equal(querySearch[0].title, 'Chest X-Ray');
});

test('calculatePasswordStrength evaluates criteria and scores correctly', () => {
  const unacceptable = calculatePasswordStrength('');
  assert.equal(unacceptable.score, 0);
  assert.equal(unacceptable.label, 'Unacceptable');

  const weak = calculatePasswordStrength('short1');
  assert.equal(weak.lengthCheck, false);
  assert.equal(weak.numberCheck, true);
  assert.equal(weak.score, 1);
  assert.equal(weak.label, 'Weak');

  const good = calculatePasswordStrength('Password1234');
  assert.equal(good.lengthCheck, true);
  assert.equal(good.upperCheck, true);
  assert.equal(good.numberCheck, true);
  assert.equal(good.symbolCheck, false);
  assert.equal(good.score, 3);
  assert.equal(good.label, 'Good');

  const vault = calculatePasswordStrength('VaultKey_99182!Eleanor');
  assert.equal(vault.score, 4);
  assert.equal(vault.label, 'Vault Grade');
});

test('validateAuthCredentials validates email format and presence of passphrase', () => {
  const invalidEmail = validateAuthCredentials('notanemail', 'secret123');
  assert.equal(invalidEmail.valid, false);

  const missingPass = validateAuthCredentials('eleanor@demo.health', '');
  assert.equal(missingPass.valid, false);

  const valid = validateAuthCredentials('eleanor@demo.health', 'secret123');
  assert.equal(valid.valid, true);
});

test('generateEncryptedQrPayload builds valid temporary envelope and verifyDoctorQrPayload checks PIN and expiration', async () => {
  const { generateEncryptedQrPayload, verifyDoctorQrPayload } = await import('./crypto.ts');

  const record = {
    id: 'rec-1',
    title: 'Complete Blood Count & Metabolic Panel (CBC + KFT)',
    category: 'lab',
    code: 'LOINC 24323-8',
    clinician: 'Dr. Ananya Iyer, MD',
    hospital: 'AIIMS Central Pathology Lab, New Delhi',
    date: '02/11/2024',
    sha256: '8F4E6B2A99C048DF72E3108B3492C91A04EF52A807BC4D9284D76E2A1019CFB5',
    biomarkers: [
      { name: 'Glucose, Fasting', value: '92', unit: 'mg/dL' },
      { name: 'HbA1c', value: '5.4', unit: '%' }
    ]
  };

  const qrResult = generateEncryptedQrPayload({
    record,
    patientName: 'Aarav Sharma',
    abhaId: '14-8842-9914-2024',
    ttlMinutes: 15,
    pin: '584920'
  });

  assert.equal(qrResult.pin, '584920');
  assert.equal(qrResult.payload.protocol, 'ABHA-SMART-QR-v1');
  assert.match(qrResult.sessionToken, /^ABHA-EPH-8842-[A-Z0-9]{4}$/);
  assert.equal(qrResult.payload.encryption.cipher, 'AES-256-GCM');
  assert.equal(qrResult.payload.patient.name, 'Aarav Sharma');
  assert.equal(qrResult.payload.patient.abhaId, '14-8842-9914-2024');

  // Verify successful verification by doctor
  const verifySuccess = verifyDoctorQrPayload(qrResult.qrPayloadString, '584920');
  assert.equal(verifySuccess.valid, true);
  assert.equal(verifySuccess.status, 'VERIFIED');
  assert.equal(verifySuccess.recordDetails?.recordTitle, 'Complete Blood Count & Metabolic Panel (CBC + KFT)');

  // Verify failure on wrong PIN
  const verifyWrongPin = verifyDoctorQrPayload(qrResult.qrPayloadString, '123456');
  assert.equal(verifyWrongPin.valid, false);
  assert.equal(verifyWrongPin.status, 'INVALID_PIN');

  // Verify failure on expired timestamp
  const pastDate = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes in future (after 15 min TTL)
  const verifyExpired = verifyDoctorQrPayload(qrResult.qrPayloadString, '584920', pastDate);
  assert.equal(verifyExpired.valid, false);
  assert.equal(verifyExpired.status, 'EXPIRED');
});

