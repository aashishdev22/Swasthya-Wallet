/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Multi-System Prescription & Medicine Catalog Unit Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOfflinePrescriptionFallback } from './prescriptionOcr.ts';
import {
  INDIAN_MEDICINE_CATALOG,
  findMedicineAlternatives,
  MANDATORY_SAFETY_DISCLAIMER,
} from '../data/medicineDatabase.ts';

test('Prescription OCR: Correctly identifies and extracts Allopathic prescriptions', () => {
  const result = parseOfflinePrescriptionFallback('Doctor_Prescription_Allopathy_Dolo.jpg');
  assert.equal(result.detectedSystem, 'allopathy');
  assert.equal(result.confidenceScore >= 90, true);
  assert.equal(result.medicines.length >= 2, true);

  const dolo = result.medicines.find((m) => m.name.includes('Dolo'));
  assert.ok(dolo);
  assert.equal(dolo?.system, 'allopathy');
  assert.equal(dolo?.strengthOrPotency, '650 mg');
  assert.equal(dolo?.dosageForm, 'Tablet');
});

test('Prescription OCR: Correctly identifies and extracts Ayurvedic prescriptions and classical formulations', () => {
  const result = parseOfflinePrescriptionFallback('Ayurvedic_Vaidya_Churna_Prescription.png');
  assert.equal(result.detectedSystem, 'ayurveda');
  assert.equal(result.confidenceScore >= 90, true);

  const ashwa = result.medicines.find((m) => m.name.includes('Ashwagandha'));
  assert.ok(ashwa);
  assert.equal(ashwa?.system, 'ayurveda');
  assert.ok(ashwa?.sanskritName);
  assert.ok(ashwa?.classicalFormulation);
  assert.equal(ashwa?.dosageForm, 'Churna');
});

test('Prescription OCR: Correctly identifies and extracts Homeopathic remedies with exact potency notation', () => {
  const result = parseOfflinePrescriptionFallback('Homeopathic_Remedies_30C_Prescription.jpg');
  assert.equal(result.detectedSystem, 'homeopathy');
  assert.equal(result.confidenceScore >= 90, true);

  const arnica = result.medicines.find((m) => m.name.includes('Arnica'));
  assert.ok(arnica);
  assert.equal(arnica?.system, 'homeopathy');
  assert.equal(arnica?.strengthOrPotency?.includes('30C'), true);
  assert.ok(arnica?.dosageForm);
});

test('Medicine Catalog: Covers Allopathy, Ayurveda, and Homeopathy with verified Indian market data', () => {
  const allopathyItems = INDIAN_MEDICINE_CATALOG.filter((m) => m.system === 'allopathy');
  const ayurvedaItems = INDIAN_MEDICINE_CATALOG.filter((m) => m.system === 'ayurveda');
  const homeopathyItems = INDIAN_MEDICINE_CATALOG.filter((m) => m.system === 'homeopathy');

  assert.equal(allopathyItems.length >= 4, true);
  assert.equal(ayurvedaItems.length >= 3, true);
  assert.equal(homeopathyItems.length >= 3, true);

  // Check Jan Aushadhi generic savings
  const dolo = allopathyItems.find((m) => m.name.includes('Dolo'));
  assert.ok(dolo?.janAushadhiEquivalent);
  assert.equal(dolo?.janAushadhiEquivalent?.savingsPct > 50, true);
  assert.equal(dolo?.janAushadhiEquivalent?.approxPrice < dolo?.approxMrp, true);
});

test('Medicine Alternatives: Categorizes results into exact match, same ingredient/formulation, and different approaches', () => {
  const dolo = INDIAN_MEDICINE_CATALOG.find((m) => m.id === 'allo-1');
  assert.ok(dolo);

  const alts = findMedicineAlternatives(dolo!);
  assert.equal(alts.length >= 3, true);

  // Must have a generic/same ingredient alternative
  const genericAlt = alts.find((a) => a.matchType === 'same_ingredient');
  assert.ok(genericAlt);
  assert.ok(genericAlt?.savingsInfo);

  // Must have exact branded match
  const exactAlt = alts.find((a) => a.matchType === 'exact_match');
  assert.ok(exactAlt);

  // Must include mandatory safety notice
  assert.ok(MANDATORY_SAFETY_DISCLAIMER.includes('Always consult your doctor'));
});
