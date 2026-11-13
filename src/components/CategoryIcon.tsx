/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Category-Specific Medical and Medicine Icons
 * Official Slogan: Digital Health Locker for Citizens
 */

import React from 'react';
import { MedicalRecord } from '../data/mockData.ts';
import { MedicineItem } from '../data/medicineDatabase.ts';
import {
  Stethoscope,
  FlaskConical,
  Droplet,
  Brain,
  Activity,
  ClipboardList,
  Syringe,
  Eye,
  Building2,
  FileText,
  Pill,
  Leaf,
  Sprout,
  HeartPulse,
} from 'lucide-react';

/* =========================================================================
   A. HEALTH RECORD CATEGORY DETECTION & ICONS
   ========================================================================= */

export type RecordCategoryKind =
  | 'prescription'
  | 'lab_report'
  | 'blood_test'
  | 'xray'
  | 'mri'
  | 'ct_scan'
  | 'ecg'
  | 'ultrasound'
  | 'medical_history'
  | 'vaccination'
  | 'dental'
  | 'eye'
  | 'discharge'
  | 'consultation'
  | 'diabetes'
  | 'kidney'
  | 'liver'
  | 'other';

/**
 * Automatically determine the specific record category based on record fields
 */
export function detectRecordCategory(record: MedicalRecord): RecordCategoryKind {
  const text = `${record.title || ''} ${record.code || ''} ${record.indication || ''} ${record.impression || ''} ${record.category || ''}`.toLowerCase();

  // Kidney Function Report
  if (text.includes('kft') || text.includes('kidney') || text.includes('renal') || text.includes('creatinine') || text.includes('egfr') || text.includes('urea')) {
    return 'kidney';
  }

  // Liver Function Report
  if (text.includes('lft') || text.includes('liver') || text.includes('hepatic') || text.includes('bilirubin') || text.includes('sgot') || text.includes('sgpt')) {
    return 'liver';
  }

  // Diabetes Report
  if (text.includes('glucose') || text.includes('hba1c') || text.includes('sugar') || text.includes('diabetes') || text.includes('insulin')) {
    return 'diabetes';
  }

  // Blood Test (CBC, Hemoglobin, Lipids)
  if (text.includes('cbc') || text.includes('blood') || text.includes('hemoglobin') || text.includes('lipid') || text.includes('cholesterol') || text.includes('platelet') || text.includes('serology')) {
    return 'blood_test';
  }

  // Doctor Consultation
  if (record.category === 'consult' || text.includes('consult') || text.includes('opd') || text.includes('review visit')) {
    return 'consultation';
  }

  // Doctor Prescription
  if (record.category === 'prescription' || text.includes('prescription') || text.includes('rxnorm') || text.includes('dosage') || text.includes('refill')) {
    return 'prescription';
  }

  // Dental Report
  if (text.includes('dental') || text.includes('tooth') || text.includes('teeth') || text.includes('orthodontic') || text.includes('caries') || text.includes('periodontal')) {
    return 'dental';
  }

  // Eye Report
  if (text.includes('eye') || text.includes('vision') || text.includes('ophthalm') || text.includes('retina') || text.includes('optometry') || text.includes('cataract')) {
    return 'eye';
  }

  // ECG / Echocardiogram (specific cardiac diagnostic tests)
  if (text.includes('ecg') || text.includes('ekg') || text.includes('echocardiogram') || text.includes('2d doppler') || text.includes('holter') || (text.includes('echo') && !text.includes('consult'))) {
    return 'ecg';
  }

  // MRI Scan
  if (text.includes('mri') || text.includes('magnetic resonance') || text.includes('brain scan')) {
    return 'mri';
  }

  // CT Scan
  if (text.includes('ct scan') || text.includes('computed tomography') || text.includes('hrct') || text.includes('ct angiography')) {
    return 'ct_scan';
  }

  // Ultrasound
  if (text.includes('ultrasound') || text.includes('usg') || text.includes('sonography')) {
    return 'ultrasound';
  }

  // X-Ray
  if (text.includes('x-ray') || text.includes('xray') || text.includes('radiograph') || text.includes('chest pa') || text.includes('dicom-rad')) {
    return 'xray';
  }

  // Vaccination
  if (text.includes('vaccin') || text.includes('immuniz') || text.includes('cowin') || text.includes('booster') || text.includes('tetanus') || text.includes('covishield')) {
    return 'vaccination';
  }

  // Hospital Discharge Summary
  if (text.includes('discharge') || text.includes('inpatient') || text.includes('admission summary')) {
    return 'discharge';
  }

  // Doctor Consultation
  if (text.includes('consult') || text.includes('consultation') || text.includes('opd') || text.includes('review visit')) {
    return 'consultation';
  }

  // Doctor Prescription
  if (text.includes('prescription') || text.includes('rxnorm') || text.includes('dosage') || text.includes('refill')) {
    return 'prescription';
  }

  // Medical History / Notes
  if (record.category === 'notes' || text.includes('medical history') || text.includes('annual preventive') || text.includes('summary')) {
    return 'medical_history';
  }

  // General Lab Report
  if (record.category === 'lab' || text.includes('pathology') || text.includes('loinc') || text.includes('lab test')) {
    return 'lab_report';
  }

  return 'other';
}

/* =========================================================================
   B. MEDICINE CATEGORY DETECTION & ICONS
   ========================================================================= */

export type MedicineCategoryKind =
  | 'tablets'
  | 'capsules'
  | 'syrup'
  | 'injection'
  | 'eye_drops'
  | 'ear_drops'
  | 'ointment'
  | 'powder_churna'
  | 'ayurveda'
  | 'homeopathy'
  | 'herbal'
  | 'general';

/**
 * Automatically determine medicine category based on dosageForm, system, and catalog data
 */
export function detectMedicineCategory(medicine: MedicineItem): MedicineCategoryKind {
  const form = (medicine.dosageForm || '').toLowerCase();
  const name = (medicine.name || '').toLowerCase();
  const sys = medicine.system;

  if (form.includes('churna') || form.includes('powder') || form.includes('bhasma') || form.includes('choornam')) {
    return 'powder_churna';
  }

  if (form.includes('eye drop') || name.includes('eye drop') || form.includes('ophthalmic')) {
    return 'eye_drops';
  }

  if (form.includes('ear drop') || name.includes('ear drop')) {
    return 'ear_drops';
  }

  if (form.includes('ointment') || form.includes('cream') || form.includes('gel') || form.includes('tube')) {
    return 'ointment';
  }

  if (form.includes('injection') || form.includes('vial') || form.includes('ampoule') || form.includes('infusion')) {
    return 'injection';
  }

  if (form.includes('syrup') || form.includes('arishta') || form.includes('asava') || form.includes('liquid') || form.includes('tonic') || form.includes('suspension')) {
    return 'syrup';
  }

  if (form.includes('capsule') || name.includes('capsule')) {
    return 'capsules';
  }

  if (form.includes('tablet') || form.includes('vati') || form.includes('pill') || form.includes('tab') || form.includes('gutika')) {
    return 'tablets';
  }

  if (sys === 'homeopathy' || form.includes('globule') || form.includes('dilution') || form.includes('potency') || form.includes('tincture')) {
    return 'homeopathy';
  }

  if (sys === 'ayurveda' || form.includes('kwath') || form.includes('taila') || form.includes('ghrita')) {
    return 'ayurveda';
  }

  return 'general';
}

/* =========================================================================
   CUSTOM MEDICAL SVG ILLUSTRATIONS (Crisp, High-Quality, Professional)
   ========================================================================= */

// Anatomical Tooth SVG for Dental Reports
const ToothIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M7 3C4.8 3 3 5 3 7.5C3 11 4.5 13 5 15.5C5.5 18 6 21 8 21C9.5 21 10 18.5 10.5 16C11 13.5 13 13.5 13.5 16C14 18.5 14.5 21 16 21C18 21 18.5 18 19 15.5C19.5 13 21 11 21 7.5C21 5 19.2 3 17 3C15.2 3 13.8 4 12 5.5C10.2 4 8.8 3 7 3Z" />
    <path d="M9 8C10 9 14 9 15 8" />
  </svg>
);

// Human Skeleton / X-Ray Ribcage & Spine Scan SVG
const XRayScanIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="2" width="18" height="20" rx="3" />
    <line x1="12" y1="5" x2="12" y2="19" />
    {/* Ribs */}
    <path d="M7 8C8.5 9 10 9 12 9C14 9 15.5 9 17 8" />
    <path d="M6.5 11C8.2 12 10 12 12 12C14 12 15.8 12 17.5 11" />
    <path d="M7 14C8.5 15 10 15 12 15C14 15 15.5 15 17 14" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
  </svg>
);

// CT Scanner Gantry Machine SVG
const CTScanIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="18" rx="4" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="4" y1="12" x2="7" y2="12" />
    <line x1="17" y1="12" x2="20" y2="12" />
  </svg>
);

// Ultrasound Machine & Transducer Screen SVG
const UltrasoundIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="13" height="11" rx="2" />
    {/* Sound waves inside screen */}
    <path d="M6 8.5C7 7.5 8 7.5 9 8.5C10 9.5 11 9.5 12 8.5" />
    <path d="M6 11C7 10 8 10 9 11C10 12 11 12 12 11" />
    {/* Stand & probe */}
    <path d="M9.5 14V19H5" />
    <line x1="4" y1="21" x2="15" y2="21" />
    <path d="M19 8V17C19 18 18 19 17 19" />
    <rect x="17.5" y="4" width="3" height="4" rx="1" />
  </svg>
);

// Glucose Meter (Glucometer) SVG
const GlucoseMeterIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="4" width="14" height="17" rx="4" />
    <rect x="8" y="7" width="8" height="5" rx="1" fill="currentColor" fillOpacity="0.15" />
    {/* Test Strip on top */}
    <rect x="10.5" y="1" width="3" height="4" rx="0.5" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    <line x1="9" y1="9" x2="12" y2="9" />
  </svg>
);

// Anatomical Kidney SVG
const KidneyIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.5 5C14 3.5 9 4.5 7 8C5 11.5 5.5 16 8 19C10.5 22 15 21 17.5 18C19.5 15.5 19.5 12 18 10C16.8 8.5 16.8 6.5 17.5 5Z" />
    <path d="M11 11C11.5 12 12 12.5 13 13" />
    <path d="M11.5 14C12 15 13 15.5 14 16" />
  </svg>
);

// Anatomical Liver SVG
const LiverIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M4 6.5C4 5.5 5.5 4.5 8 4.5C12 4.5 19 6 20 10C21 14 19 18.5 15 19.5C10 20.5 6 18 4.5 15C3.5 13 4 8 4 6.5Z" />
    <path d="M13 5.5C14 9 14.5 13 14 19" />
    <circle cx="10" cy="12" r="1" fill="currentColor" />
  </svg>
);

// Two-Tone Capsule SVG
const CapsuleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M6.5 17.5L17.5 6.5C19 5 21.5 5 22.5 6.5C23.5 8 23.5 10.5 22 12L11 23C9.5 24.5 7 24.5 5.5 23C4 21.5 4 19 5.5 17.5L6.5 17.5" transform="translate(-2, -2)" />
    <line x1="8.5" y1="15.5" x2="15.5" y2="8.5" />
    <path d="M5.5 14.5C4 16 4 18.5 5.5 20C7 21.5 9.5 21.5 11 20L15.5 15.5L10 10L5.5 14.5Z" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

// Syrup / Tonic Medicine Bottle SVG
const SyrupBottleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="6" y="8" width="12" height="13" rx="3" />
    <path d="M9 8V4C9 3.5 9.5 3 10 3H14C14.5 3 15 3.5 15 4V8" />
    <line x1="8" y1="3" x2="16" y2="3" />
    <rect x="9" y="12" width="6" height="5" rx="1" fill="currentColor" fillOpacity="0.15" />
    {/* Measuring Cap Line */}
    <line x1="12" y1="13" x2="12" y2="16" />
    <line x1="10.5" y1="14.5" x2="13.5" y2="14.5" />
  </svg>
);

// Eye Drop Bottle SVG
const EyeDropBottleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="7" y="10" width="10" height="11" rx="3" />
    <path d="M10 10V6H14V10" />
    {/* Dropper tip */}
    <path d="M12 2L11 6H13L12 2Z" fill="currentColor" />
    {/* Falling single droplet */}
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
  </svg>
);

// Ear Drop / Dropper Bottle SVG
const DropperBottleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="6" y="9" width="12" height="12" rx="3" />
    <path d="M9 9V5H15V9" />
    <path d="M10 5C10 3.5 11 2 12 2C13 2 14 3.5 14 5" />
    <line x1="10" y1="13" x2="14" y2="13" />
    <line x1="10" y1="16" x2="13" y2="16" />
  </svg>
);

// Ointment Cream Squeeze Tube SVG
const CreamTubeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M7 21L17 21L15 8L9 8L7 21Z" />
    <rect x="9.5" y="3" width="5" height="5" rx="1" />
    <line x1="7" y1="21" x2="17" y2="21" strokeWidth="2.5" />
    {/* Squeeze wave */}
    <path d="M10 12C11 13 13 13 14 12" />
    <path d="M10 16C11 17 13 17 14 16" />
  </svg>
);

// Medicine Powder / Ayurvedic Churna Container SVG
const PowderContainerIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="8" width="14" height="13" rx="2" />
    {/* Lid */}
    <path d="M4 8C4 6.5 5.5 5 8 5H16C18.5 5 20 6.5 20 8" />
    <line x1="9" y1="3" x2="15" y2="3" />
    <line x1="12" y1="3" x2="12" y2="5" />
    {/* Herb / Powder dots */}
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="13" r="1" fill="currentColor" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
    <circle cx="10.5" cy="17" r="1" fill="currentColor" />
    <circle cx="13.5" cy="17" r="1" fill="currentColor" />
  </svg>
);

// Homeopathic Remedy Bottle with Globules SVG
const HomeopathicGlobulesIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Glass homeopathic vial */}
    <rect x="7" y="7" width="10" height="14" rx="2" />
    <path d="M9 7V4H15V7" />
    <rect x="8" y="2" width="8" height="2" rx="0.5" fill="currentColor" />
    {/* Tiny round globules (pills) */}
    <circle cx="10" cy="12" r="1.2" fill="currentColor" />
    <circle cx="13" cy="11.5" r="1.2" fill="currentColor" />
    <circle cx="11.5" cy="14" r="1.2" fill="currentColor" />
    <circle cx="14" cy="15" r="1.2" fill="currentColor" />
    <circle cx="10" cy="17" r="1.2" fill="currentColor" />
    <circle cx="12.5" cy="18" r="1.2" fill="currentColor" />
  </svg>
);

// Ayurvedic Herbal Leaf & Kalasha Bottle SVG
const AyurvedicHerbalIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Pot / Kalasha base */}
    <path d="M6 11C6 9 8 8 12 8C16 8 18 9 18 11C18 15 17 20 12 20C7 20 6 15 6 11Z" />
    <line x1="9" y1="20" x2="15" y2="20" strokeWidth="2.5" />
    {/* Ayurvedic Sprout/Leaf rising out */}
    <path d="M12 8V2C12 2 15 3 16 5C17 7 15 8 12 8Z" fill="currentColor" fillOpacity="0.25" />
    <path d="M12 6C12 6 9 5 8 3C7 2 9 2 12 4" />
  </svg>
);

/* =========================================================================
   COMPONENTS: RecordCategoryIcon & MedicineCategoryIcon
   ========================================================================= */

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Record Category Icon with styled container and subtle category tint
 */
export const RecordCategoryIcon: React.FC<{ record: MedicalRecord; size?: number; containerClassName?: string }> = ({
  record,
  size = 32,
  containerClassName = '',
}) => {
  const category = detectRecordCategory(record);

  switch (category) {
    case 'prescription':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Stethoscope size={size} strokeWidth={2.2} />
        </div>
      );
    case 'blood_test':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Droplet size={size} strokeWidth={2.2} />
        </div>
      );
    case 'kidney':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <KidneyIcon size={size} />
        </div>
      );
    case 'liver':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <LiverIcon size={size} />
        </div>
      );
    case 'diabetes':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <GlucoseMeterIcon size={size} />
        </div>
      );
    case 'xray':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <XRayScanIcon size={size} />
        </div>
      );
    case 'mri':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Brain size={size} strokeWidth={2.2} />
        </div>
      );
    case 'ct_scan':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <CTScanIcon size={size} />
        </div>
      );
    case 'ecg':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-red-50 text-red-700 border border-red-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <HeartPulse size={size} strokeWidth={2.2} />
        </div>
      );
    case 'ultrasound':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <UltrasoundIcon size={size} />
        </div>
      );
    case 'vaccination':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Syringe size={size} strokeWidth={2.2} />
        </div>
      );
    case 'dental':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <ToothIcon size={size} />
        </div>
      );
    case 'eye':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Eye size={size} strokeWidth={2.2} />
        </div>
      );
    case 'discharge':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Building2 size={size} strokeWidth={2.2} />
        </div>
      );
    case 'consultation':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Stethoscope size={size} strokeWidth={2.2} />
        </div>
      );
    case 'medical_history':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <ClipboardList size={size} strokeWidth={2.2} />
        </div>
      );
    case 'lab_report':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <FlaskConical size={size} strokeWidth={2.2} />
        </div>
      );
    default:
      return (
        <div className={`w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <FileText size={size} strokeWidth={2.2} />
        </div>
      );
  }
};

/**
 * Medicine Category Icon with styled container and subtle category tint
 */
export const MedicineCategoryIcon: React.FC<{ medicine: MedicineItem; size?: number; containerClassName?: string }> = ({
  medicine,
  size = 32,
  containerClassName = '',
}) => {
  const category = detectMedicineCategory(medicine);

  switch (category) {
    case 'tablets':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Pill size={size} strokeWidth={2.2} />
        </div>
      );
    case 'capsules':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <CapsuleIcon size={size} />
        </div>
      );
    case 'syrup':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <SyrupBottleIcon size={size} />
        </div>
      );
    case 'injection':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Syringe size={size} strokeWidth={2.2} />
        </div>
      );
    case 'eye_drops':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <EyeDropBottleIcon size={size} />
        </div>
      );
    case 'ear_drops':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <DropperBottleIcon size={size} />
        </div>
      );
    case 'ointment':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-orange-50 text-orange-700 border border-orange-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <CreamTubeIcon size={size} />
        </div>
      );
    case 'powder_churna':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <PowderContainerIcon size={size} />
        </div>
      );
    case 'ayurveda':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <AyurvedicHerbalIcon size={size} />
        </div>
      );
    case 'homeopathy':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-purple-50 text-purple-800 border border-purple-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <HomeopathicGlobulesIcon size={size} />
        </div>
      );
    case 'herbal':
      return (
        <div className={`w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Leaf size={size} strokeWidth={2.2} />
        </div>
      );
    default:
      return (
        <div className={`w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200/80 flex items-center justify-center shadow-2xs ${containerClassName}`}>
          <Pill size={size} strokeWidth={2.2} />
        </div>
      );
  }
};
