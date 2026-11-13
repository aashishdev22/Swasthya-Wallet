/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Category Icon Unit Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectRecordCategory, detectMedicineCategory } from './CategoryIcon.tsx';
import { MedicalRecord } from '../data/mockData.ts';
import { MedicineItem } from '../data/medicineDatabase.ts';

test('detectRecordCategory accurately identifies specific clinical categories', () => {
  // Kidney test
  const recKidney: Partial<MedicalRecord> = {
    title: 'Kidney Function Test (KFT & Serum Creatinine)',
    category: 'lab',
  };
  assert.equal(detectRecordCategory(recKidney as MedicalRecord), 'kidney');

  // Liver test
  const recLiver: Partial<MedicalRecord> = {
    title: 'Liver Function Test (LFT Profile)',
    category: 'lab',
  };
  assert.equal(detectRecordCategory(recLiver as MedicalRecord), 'liver');

  // Diabetes test
  const recDiabetes: Partial<MedicalRecord> = {
    title: 'Fasting Blood Glucose & HbA1c Panel',
    category: 'lab',
  };
  assert.equal(detectRecordCategory(recDiabetes as MedicalRecord), 'diabetes');

  // Blood Test
  const recBlood: Partial<MedicalRecord> = {
    title: 'Complete Blood Count (CBC) with Differential',
    category: 'lab',
  };
  assert.equal(detectRecordCategory(recBlood as MedicalRecord), 'blood_test');

  // X-Ray
  const recXray: Partial<MedicalRecord> = {
    title: 'Chest X-Ray 2-View (PA and Lateral)',
    category: 'imaging',
  };
  assert.equal(detectRecordCategory(recXray as MedicalRecord), 'xray');

  // MRI
  const recMri: Partial<MedicalRecord> = {
    title: 'Brain MRI with Contrast',
    category: 'imaging',
  };
  assert.equal(detectRecordCategory(recMri as MedicalRecord), 'mri');

  // CT Scan
  const recCt: Partial<MedicalRecord> = {
    title: 'HRCT Chest (Computed Tomography)',
    category: 'imaging',
  };
  assert.equal(detectRecordCategory(recCt as MedicalRecord), 'ct_scan');

  // ECG
  const recEcg: Partial<MedicalRecord> = {
    title: '12-Lead ECG & 2D Doppler Echocardiogram',
    category: 'imaging',
  };
  assert.equal(detectRecordCategory(recEcg as MedicalRecord), 'ecg');

  // Ultrasound
  const recUsg: Partial<MedicalRecord> = {
    title: 'Abdominal Ultrasound (USG Whole Abdomen)',
    category: 'imaging',
  };
  assert.equal(detectRecordCategory(recUsg as MedicalRecord), 'ultrasound');

  // Dental
  const recDental: Partial<MedicalRecord> = {
    title: 'Orthodontic Dental Examination & OPG',
    category: 'other',
  };
  assert.equal(detectRecordCategory(recDental as MedicalRecord), 'dental');

  // Eye
  const recEye: Partial<MedicalRecord> = {
    title: 'Comprehensive Eye Examination & Vision Test',
    category: 'other',
  };
  assert.equal(detectRecordCategory(recEye as MedicalRecord), 'eye');

  // Discharge Summary
  const recDischarge: Partial<MedicalRecord> = {
    title: 'Inpatient Hospital Discharge Summary',
    category: 'discharge',
  };
  assert.equal(detectRecordCategory(recDischarge as MedicalRecord), 'discharge');

  // Doctor Consultation
  const recConsult: Partial<MedicalRecord> = {
    title: 'Cardiology Specialist Doctor Consultation',
    category: 'consult',
  };
  assert.equal(detectRecordCategory(recConsult as MedicalRecord), 'consultation');

  // Doctor Prescription
  const recRx: Partial<MedicalRecord> = {
    title: 'Telmisartan 40mg Tab Daily (Prescription)',
    category: 'prescription',
  };
  assert.equal(detectRecordCategory(recRx as MedicalRecord), 'prescription');

  // Vaccination
  const recVaccine: Partial<MedicalRecord> = {
    title: 'Covishield COVID-19 Booster Vaccination Certificate',
    category: 'other',
  };
  assert.equal(detectRecordCategory(recVaccine as MedicalRecord), 'vaccination');
});

test('detectMedicineCategory accurately identifies medicine form and systems', () => {
  // Tablet
  const medTablet: Partial<MedicineItem> = {
    name: 'Dolo 650',
    dosageForm: 'Tablet',
    system: 'allopathy',
  };
  assert.equal(detectMedicineCategory(medTablet as MedicineItem), 'tablets');

  // Capsule
  const medCapsule: Partial<MedicineItem> = {
    name: 'Omeprazole 20mg',
    dosageForm: 'Capsule',
    system: 'allopathy',
  };
  assert.equal(detectMedicineCategory(medCapsule as MedicineItem), 'capsules');

  // Syrup
  const medSyrup: Partial<MedicineItem> = {
    name: 'Ascoril D Plus',
    dosageForm: 'Syrup',
    system: 'allopathy',
  };
  assert.equal(detectMedicineCategory(medSyrup as MedicineItem), 'syrup');

  // Powder / Churna
  const medChurna: Partial<MedicineItem> = {
    name: 'Ashwagandha Churna',
    dosageForm: 'Churna (Herbal Powder)',
    system: 'ayurveda',
  };
  assert.equal(detectMedicineCategory(medChurna as MedicineItem), 'powder_churna');

  // Eye Drops
  const medEye: Partial<MedicineItem> = {
    name: 'Ciplox Eye Drops',
    dosageForm: 'Eye Drop',
    system: 'allopathy',
  };
  assert.equal(detectMedicineCategory(medEye as MedicineItem), 'eye_drops');

  // Ear Drops
  const medEar: Partial<MedicineItem> = {
    name: 'Otorex Ear Drops',
    dosageForm: 'Ear Drop',
    system: 'allopathy',
  };
  assert.equal(detectMedicineCategory(medEar as MedicineItem), 'ear_drops');

  // Ointment
  const medOintment: Partial<MedicineItem> = {
    name: 'Betadine Ointment',
    dosageForm: 'Ointment',
    system: 'allopathy',
  };
  assert.equal(detectMedicineCategory(medOintment as MedicineItem), 'ointment');

  // Injection
  const medInjection: Partial<MedicineItem> = {
    name: 'Insulin Glargine',
    dosageForm: 'Injection (Vial)',
    system: 'allopathy',
  };
  assert.equal(detectMedicineCategory(medInjection as MedicineItem), 'injection');

  // Ayurveda general
  const medAyur: Partial<MedicineItem> = {
    name: 'Arjunarishta',
    dosageForm: 'Arishta (Liquid)',
    system: 'ayurveda',
  };
  assert.equal(detectMedicineCategory(medAyur as MedicineItem), 'syrup');

  // Homeopathy
  const medHomeo: Partial<MedicineItem> = {
    name: 'Arnica Montana',
    dosageForm: 'Dilution / Globules',
    system: 'homeopathy',
  };
  assert.equal(detectMedicineCategory(medHomeo as MedicineItem), 'homeopathy');
});
