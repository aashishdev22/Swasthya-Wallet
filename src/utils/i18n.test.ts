/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_LANGUAGES,
  getTranslation,
  formatIndianDate,
  formatIndianCurrency,
  formatIndianNumber,
  formatIndianTime,
  SupportedLanguage,
} from './i18n.ts';

test('i18n provides all 12 requested Indian languages', () => {
  const expectedCodes: SupportedLanguage[] = [
    'en', 'hi', 'bn', 'mr', 'ta', 'te', 'gu', 'kn', 'ml', 'pa', 'or', 'ur'
  ];
  assert.equal(SUPPORTED_LANGUAGES.length, 12);
  for (const code of expectedCodes) {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    assert.ok(found, `Language code ${code} must exist in SUPPORTED_LANGUAGES`);
    const t = getTranslation(code);
    assert.ok(t.appName, `Translation dictionary for ${code} must have appName`);
    assert.ok(t.dashboard, `Translation dictionary for ${code} must have dashboard`);
    assert.ok(t.medicalRecords, `Translation dictionary for ${code} must have medicalRecords`);
    assert.ok(t.vaccinationWallet, `Translation dictionary for ${code} must have vaccinationWallet`);
    assert.ok(t.remindersSchedule, `Translation dictionary for ${code} must have remindersSchedule`);
    assert.ok(t.secureSharing, `Translation dictionary for ${code} must have secureSharing`);
    assert.ok(t.documentVerification, `Translation dictionary for ${code} must have documentVerification`);
    assert.ok(t.securityAudit, `Translation dictionary for ${code} must have securityAudit`);
    assert.ok(t.settings, `Translation dictionary for ${code} must have settings`);
  }
});

test('formatIndianDate formats dates into DD/MM/YYYY', () => {
  assert.equal(formatIndianDate('2024-11-02'), '02/11/2024');
  assert.equal(formatIndianDate('14/03/1990'), '14/03/1990');
  assert.equal(formatIndianDate(new Date(2024, 0, 15)), '15/01/2024');
});

test('formatIndianCurrency formats numbers with ₹ and Indian grouping', () => {
  assert.equal(formatIndianCurrency(0), '₹0');
  assert.equal(formatIndianCurrency(600), '₹600');
  assert.equal(formatIndianCurrency(1200), '₹1,200');
  assert.equal(formatIndianCurrency(100000), '₹1,00,000');
});

test('formatIndianNumber formats using Indian comma grouping', () => {
  assert.equal(formatIndianNumber(0), '0');
  assert.equal(formatIndianNumber(5000), '5,000');
  assert.equal(formatIndianNumber(100000), '1,00,000');
});

test('formatIndianTime appends IST and formats properly', () => {
  const result = formatIndianTime(new Date(2024, 10, 11, 10, 30));
  assert.ok(result.includes('IST'));
});
