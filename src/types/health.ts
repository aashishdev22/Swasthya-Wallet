/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Core Health Domain Types
 * Official Slogan: Digital Health Locker for Citizens
 */

export interface NotificationPreferences {
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export interface PatientProfile {
  id?: string;
  username?: string;
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
  avatarPath?: string | null;
  avatarUpdatedAt?: string | null;
  sessionKey: string;
  email?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notificationPreferences?: NotificationPreferences;
}

export interface BiomarkerItem {
  name: string;
  value: string;
  unit: string;
  status: 'NORMAL' | 'OPTIMAL' | 'BORDERLINE' | 'ELEVATED';
  ref: string;
  progress: number;
}

export interface MedicalRecord {
  id: string;
  userId?: string;
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
  biomarkers?: BiomarkerItem[];
  dosageSig?: string;
  refillsLeft?: number;
  totalRefills?: number;
  imageUrl?: string;
  fileStoragePath?: string;
  storageBucket?: string;
  uploadedAt?: string;
  ocrExtractedText?: string;
  originalDocumentName?: string;
  driveFileId?: string;
  version?: number;
  updatedAt?: number;
}

export interface VaccineItem {
  id: string;
  userId?: string;
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
  updatedAt?: string;
}

export interface ActiveDelegation {
  id: string;
  userId?: string;
  recipientName: string;
  facility: string;
  initials: string;
  expiresIn: string;
  expiresDate: string;
  expiresAtIso?: string;
  scopesSummary: string;
  selectedRecordIds?: string[];
  tokenCode: string;
  tokenHash: string;
  purpose: string;
  revoked?: boolean;
  createdAt?: string;
}

export interface AuditEvent {
  id: string;
  userId?: string;
  title: string;
  timestamp: string;
  actor: string;
  actionType?: string;
  clientIp: string;
  statusCode: string;
  details: string;
  sigVerified: boolean;
  nonce?: string;
  createdAt?: string;
}

export interface AppointmentItem {
  id: string;
  userId?: string;
  title: string;
  clinicianOrFacility: string;
  category: 'consultation' | 'lab' | 'vaccination' | 'follow_up';
  scheduledDate: string;
  scheduledTime: string;
  feeInr?: string;
  notes?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'security' | 'reminder';
  read: boolean;
  createdAt: string;
  actionView?: string;
}

export interface UserMedicine {
  id: string;
  userId?: string;
  catalogMedicineId?: string;
  name: string;
  system: 'allopathy' | 'ayurveda' | 'homeopathy';
  genericOrActiveSalt: string;
  dosageForm: string;
  strengthOrPotency: string;
  manufacturer?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  prescriberName?: string;
  prescriptionDate?: string;
  linkedRecordId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  totalRecordsCount: number;
  prescriptionsCount: number;
  vaccinesCount: number;
  dueVaccinesCount: number;
  activeSharesCount: number;
  upcomingAppointmentsCount: number;
  unreadNotificationsCount: number;
  activeMedicinesCount: number;
}
