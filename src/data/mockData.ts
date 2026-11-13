/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientProfile {
  name: string;
  age: number;
  dob: string;
  mrn: string;
  synthMrn: string;
  verified: boolean;
  bloodType: string;
  criticalAllergy: string;
  primaryAttending: string;
  clinicalNetwork: string;
  insurance: string;
  avatarUrl: string;
  sessionKey: string;
  email?: string;
  phone?: string;
}

export interface MedicalRecord {
  id: string;
  title: string;
  category: 'lab' | 'imaging' | 'notes' | 'prescription' | 'discharge' | 'consult' | 'other';
  code: string;
  codeStandard: string;
  date: string;
  clinician: string;
  hospital: string;
  integrityStatus: string;
  verified: boolean;
  sha256: string;
  fileSize: string;
  fileFormat: string;
  indication?: string;
  impression?: string;
  biomarkers?: Array<{ name: string; value: string; unit: string; status: 'NORMAL' | 'OPTIMAL' | 'BORDERLINE' | 'ELEVATED'; ref: string; progress: number }>;
  dosageSig?: string;
  refillsLeft?: number;
  totalRefills?: number;
  imageUrl?: string;
  uploadedAt?: string;
  ocrExtractedText?: string;
  originalDocumentName?: string;
  driveFileId?: string;
  version?: number;
  updatedAt?: number;
}

export interface VaccineItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'due' | 'seasonal' | 'administered';
  priority?: 'high' | 'normal';
  status: string;
  code: string;
  dueDate?: string;
  interval?: string;
  lastDose?: string;
  lot?: string;
  facility?: string;
  registryState?: string;
  serologyTiter?: string;
  fhirId?: string;
  ndcCode?: string;
  clinicianSig?: string;
  dosesHistory?: Array<{ dose: string; date: string }>;
}

export interface ActiveDelegation {
  id: string;
  recipientName: string;
  facility: string;
  initials: string;
  expiresIn: string;
  expiresDate: string;
  scopesSummary: string;
  tokenCode: string;
  tokenHash: string;
  purpose: string;
  revoked?: boolean;
}

export interface AuditEvent {
  id: string;
  title: string;
  timestamp: string;
  actor: string;
  clientIp: string;
  statusCode: string;
  details: string;
  sigVerified: boolean;
  nonce?: string;
}

export const initialPatient: PatientProfile = {
  name: 'Aarav Sharma',
  age: 34,
  dob: '14/03/1990',
  mrn: 'DEL-8842-AS',
  synthMrn: '14-8842-9914-2024',
  verified: true,
  bloodType: 'B+ (B Positive)',
  criticalAllergy: 'Penicillin',
  primaryAttending: 'Dr. Ananya Iyer, MD (Internal Medicine)',
  clinicalNetwork: 'AIIMS New Delhi / Max Healthcare',
  insurance: 'Ayushman Bharat (PM-JAY) / Star Health',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlbtVH-nlpi1wsvTKRQINs2UmVtnhG2stBDwi-3rjHLya2SuJuLXTfXzJOTw0zk0lJJEcZ5ooPN3hxe1RouA7tfu3ppFSh-s7Q5jPkO7BtaKt4A22KrY9A-BO1f_VEc-vJSHhBmHuI4CVFDZweJPHb9dV8ZKHICGc4n3zVgdD-G9Hbu6xaXq1t0bGUopYqP-KkAeru-W37vtx9dxO7k-X6GZ0ilvmxaOHVvHhe6sq5qdmXtudLuYmhNA',
  sessionKey: '0x9F41...B28E'
};

export const initialMedicalRecords: MedicalRecord[] = [
  {
    id: 'rec-1',
    title: 'Complete Blood Count & Metabolic Panel (CBC + KFT)',
    category: 'lab',
    code: 'LOINC 24323-8',
    codeStandard: 'LOINC',
    date: '02/11/2024',
    clinician: 'Dr. Ananya Iyer, MD',
    hospital: 'AIIMS Central Pathology Lab, New Delhi',
    integrityStatus: 'SHA-256 Valid',
    verified: true,
    sha256: '8F4E6B2A99C048DF72E3108B3492C91A04EF52A807BC4D9284D76E2A1019CFB5',
    fileSize: '1.84 MB',
    fileFormat: 'PDF',
    indication: 'Routine Preventive Health Screening & Lipid Profile',
    biomarkers: [
      { name: 'Glucose, Fasting (FSS)', value: '92', unit: 'mg/dL', status: 'NORMAL', ref: '70 – 99 mg/dL', progress: 50 },
      { name: 'Total Cholesterol', value: '182', unit: 'mg/dL', status: 'NORMAL', ref: '< 200 mg/dL', progress: 58 },
      { name: 'HDL Cholesterol (Good)', value: '58', unit: 'mg/dL', status: 'OPTIMAL', ref: '> 50 mg/dL', progress: 65 },
      { name: 'LDL Cholesterol (Calc)', value: '104', unit: 'mg/dL', status: 'BORDERLINE', ref: '< 100 mg/dL', progress: 68 },
      { name: 'Glycated HbA1c', value: '5.4', unit: '%', status: 'OPTIMAL', ref: '< 5.7 %', progress: 44 },
      { name: 'eGFR Kidney Function', value: '>90', unit: 'mL/min/1.73m²', status: 'NORMAL', ref: '> 60 mL/min', progress: 95 }
    ]
  },
  {
    id: 'rec-2',
    title: 'Chest X-Ray 2-View Report (Digital PA/Lat)',
    category: 'imaging',
    code: 'RAD #RAD-XR-0442',
    codeStandard: 'DICOM-RAD-30',
    date: '12/09/2024',
    clinician: 'Dr. Rajesh Sharma, MD (Radiology)',
    hospital: 'Apollo Diagnostic & Imaging Centre, New Delhi',
    integrityStatus: 'Cryptographic Seal',
    verified: true,
    sha256: '3A190CB810034AA892114F2E8F4E6B228B07D3E8C91A77E2A91D0E44B78125C7',
    fileSize: '14.2 MB',
    fileFormat: 'DICOM + PDF',
    indication: 'Clinical Indication: Pre-Employment Health Checkup & Cardiopulmonary Baseline',
    impression: 'Clear lung fields bilaterally. Normal cardiac silhouette. No active cardiopulmonary infiltrates or pleural effusion noted.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDxDdcrfqVQXufhxt2kO3aEQK9PIIXh3vEKGR_y0TffPpERmaiVXGp-3qeTitmsBEOY3uy4zVjqkGuX1YpwG6__FIUHwKWLcTpDTX65QJLQsOrF_-56mG2-xXiCk9qTiqbpbkNekPdYQVgGm-apf0p13hfWWLLq5DfI6_cqv-yEzxFUB6J6alSW6aiG7nnIgzG-O6Uo6woLM2I7PeB-KiSRF2SPin7nS3tNz5kNZNQqH8b6f2fjzhyZw'
  },
  {
    id: 'rec-3',
    title: 'Annual Preventive Health Consultation Summary',
    category: 'notes',
    code: 'SNOMED 410604004',
    codeStandard: 'SNOMED CT',
    date: '15/08/2024',
    clinician: 'Dr. Ananya Iyer, MD',
    hospital: 'Max Super Speciality Hospital, Saket',
    integrityStatus: 'ABHA Verified Record',
    verified: true,
    sha256: '9F280A15E8BC019A8877123A4D6B2A99C048DF72E3108B3492C91A04EF52A807',
    fileSize: '820 KB',
    fileFormat: 'PDF Report',
    impression: 'Comprehensive health evaluation completed. Blood pressure 120/78 mmHg. Pulse 72 bpm. Balanced diet and daily brisk walking recommended.',
    indication: 'Routine Annual Medical Review'
  },
  {
    id: 'rec-4',
    title: 'Telmisartan 40mg Tab Daily (Prescription)',
    category: 'prescription',
    code: 'RxNorm #409121',
    codeStandard: 'RxNorm',
    date: '04/10/2024',
    clinician: 'Dr. Rajesh Sharma, MD',
    hospital: 'Apollo Pharmacy #4912, Greater Kailash',
    integrityStatus: 'E-Prescription Verified',
    verified: true,
    sha256: '7E11D9048E6641BC90D420FA817E22108B7390F16C824C9142E98F9B2A7E11D9',
    fileSize: '140 KB',
    fileFormat: 'Digital Prescription',
    dosageSig: 'Take 1 tablet orally every morning after breakfast for blood pressure control.',
    refillsLeft: 3,
    totalRefills: 3
  },
  {
    id: 'rec-5',
    title: 'Inpatient Observation & Care Discharge Summary',
    category: 'discharge',
    code: 'SNOMED CT 371530004',
    codeStandard: 'SNOMED CT',
    date: '14/06/2024',
    clinician: 'Dr. Suresh Patel, DM (Cardiology)',
    hospital: 'Fortis Escorts Heart Institute, Okhla • Ward 3A',
    integrityStatus: 'Hospital Certified',
    verified: true,
    sha256: 'B78125C78F4E6B228B07D3E8C91A77E2A91D0E443A190CB810034AA892114F2E',
    fileSize: '4.6 MB',
    fileFormat: 'PDF Summary',
    impression: 'Mild transient vertigo evaluated. ECG and 2D Echo within normal physiological limits. Advised hydration and salt moderation. Discharged in stable condition.'
  },
  {
    id: 'rec-6',
    title: '2D Doppler Echocardiogram Study',
    category: 'imaging',
    code: 'LOINC 18053-9',
    codeStandard: 'LOINC',
    date: '08/05/2024',
    clinician: 'Dr. Suresh Patel, DM (Cardiology)',
    hospital: 'Medanta Cardiology Centre, Gurugram',
    integrityStatus: 'Digital DICOM Record',
    verified: true,
    sha256: 'C048DF72E3108B3492C91A04EF52A807BC4D9284D76E2A1019CFB58F4E6B2A99',
    fileSize: '28.4 MB',
    fileFormat: 'DICOM Series'
  }
];

export const initialVaccines: VaccineItem[] = [
  {
    id: 'vac-1',
    title: 'Tetanus Toxoid (TT / Td Booster)',
    subtitle: 'Tetanus & Adult Diphtheria Booster',
    type: 'due',
    priority: 'high',
    status: 'Due for 10-Yr Booster',
    code: 'CVX 115',
    dueDate: '14/11/2024',
    interval: '10-Yr Interval',
    lastDose: '14/10/2014'
  },
  {
    id: 'vac-2',
    title: 'Annual Influenza (Flu Vaccine) 2024-2025',
    subtitle: 'Quadrivalent Inactivated Formulation',
    type: 'seasonal',
    priority: 'normal',
    status: 'Eligible Window',
    code: 'CVX 158',
    dueDate: 'Winter 2024',
    interval: 'Seasonal Window',
    lastDose: 'Optimal: Oct - Dec'
  },
  {
    id: 'vac-3',
    title: 'Covishield (COVID-19 Recombinant Vaccine)',
    subtitle: 'ChAdOx1 nCoV-19 • Precaution Dose Completed',
    type: 'administered',
    status: 'CoWIN Digital Certificate Verified',
    code: 'CVX 229',
    lastDose: '12/10/2023',
    lot: '4121Z028',
    facility: 'Safdarjung Hospital Community Centre, New Delhi',
    registryState: 'CoWIN India',
    fhirId: 'cowin-cert-98244102',
    ndcCode: 'COV-SERUM-IN',
    clinicianSig: 'Dr. K. Verma, Medical Officer'
  },
  {
    id: 'vac-4',
    title: 'Hepatitis B Vaccination (3 Doses Complete)',
    subtitle: 'Recombinant DNA Vaccine (Universal Immunization)',
    type: 'administered',
    status: 'Lifetime Immunity Verified',
    code: 'CVX 45',
    lastDose: '19/05/2019',
    serologyTiter: 'Anti-HBs > 100 mIU/mL (Strong Immunity)',
    facility: 'AIIMS Primary Healthcare Centre, New Delhi',
    dosesHistory: [
      { dose: 'Dose 1 (Initial)', date: '15/11/2018' },
      { dose: 'Dose 2 (1 month)', date: '18/12/2018' },
      { dose: 'Dose 3 (6 months)', date: '19/05/2019' }
    ]
  },
  {
    id: 'vac-5',
    title: 'Typhoid Conjugate Vaccine (Typbar-TCV)',
    subtitle: 'Single Dose Long-Term Protection',
    type: 'administered',
    status: 'Verified Immunity',
    code: 'CVX 03',
    lastDose: '22/08/2021',
    facility: 'Delhi Civil Hospital Immunization Unit',
    dosesHistory: [
      { dose: 'Primary Dose', date: '22/08/2021' }
    ]
  }
];

export const initialActiveDelegations: ActiveDelegation[] = [
  {
    id: 'del-1',
    recipientName: 'Dr. Rajesh Sharma (Cardiology)',
    facility: 'Apollo Hospital, New Delhi',
    initials: 'RS',
    expiresIn: '45m',
    expiresDate: 'Today in 45m',
    scopesSummary: '2 LAB & X-RAY REPORTS',
    tokenCode: 'APL-2441-IN',
    tokenHash: '0x7F2A...9C1B-SHA256',
    purpose: 'Cardiology Review & Consultation'
  },
  {
    id: 'del-2',
    recipientName: 'Dr. Lal PathLabs Diagnostic Intake',
    facility: 'South Delhi Collection Centre #14',
    initials: 'LP',
    expiresIn: '24h',
    expiresDate: 'Tomorrow at 05:00 PM IST',
    scopesSummary: '1 PATIENT ID & BLOOD TEST REQUISITION',
    tokenCode: 'LAL-8902-IN',
    tokenHash: '0x4D9E...1A80-ABHA-SYNC',
    purpose: 'Diagnostic Sample Processing'
  }
];

export const initialAuditEvents: AuditEvent[] = [
  {
    id: 'LOG-98124-77',
    title: 'Health Records Accessed & Downloaded',
    timestamp: 'Today, 10:14 AM IST',
    actor: 'Aarav Sharma (Patient Mobile App)',
    clientIp: 'New Delhi, IN • Airtel 5G',
    statusCode: '200 OK',
    details: 'Complete Blood Count & Chest X-Ray viewed securely',
    sigVerified: true
  },
  {
    id: 'LOG-98101-34',
    title: 'Doctor Consultation Access Authorized',
    timestamp: 'Yesterday, 03:45 PM IST',
    actor: 'Dr. Rajesh Sharma (Apollo Hospital)',
    clientIp: 'New Delhi, IN • Apollo Hospital Network',
    statusCode: 'AUTHORIZED',
    details: 'Secure 4-digit PIN validated for Cardiology records',
    sigVerified: true,
    nonce: '0x9f4a...8c1e'
  },
  {
    id: 'LOG-98042-90',
    title: 'Digital Seal & Lab Signature Verified',
    timestamp: '28/10/2024, 11:02 AM IST',
    actor: 'AIIMS Central Pathology Lab',
    clientIp: 'AIIMS Health Network Gateway',
    statusCode: 'VERIFIED',
    details: 'Digital SHA-256 seal verified with 0 alterations',
    sigVerified: true
  },
  {
    id: 'LOG-97990-11',
    title: 'Biometric Unlock & Passkey Authentication',
    timestamp: '25/10/2024, 08:30 AM IST',
    actor: 'Aarav Sharma (Device Fingerprint)',
    clientIp: 'Touch ID / Sensor Attestation Challenge',
    statusCode: 'AUTH PASSED',
    details: 'Biometric verified via device security enclave',
    sigVerified: true
  }
];
