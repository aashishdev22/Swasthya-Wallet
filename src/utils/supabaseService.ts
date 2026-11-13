/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Real Supabase PostgreSQL & Private Storage Service Layer
 * Official Slogan: Digital Health Locker for Citizens
 */

import {
  ActiveDelegation,
  AppointmentItem,
  AuditEvent,
  DashboardSummary,
  MedicalRecord,
  NotificationItem,
  NotificationPreferences,
  PatientProfile,
  UserMedicine,
  VaccineItem,
} from '../types/health.ts';
import {
  getSupabaseClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from './supabase.ts';
import {
  buildProfilePhotoStoragePath,
  HEALTH_DOCUMENTS_BUCKET,
  PROFILE_PHOTOS_BUCKET,
} from './profilePhoto.ts';
import { PrescriptionOcrResult } from './prescriptionOcr.ts';

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  isConfigured: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  smsEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
};

/**
 * Generate a valid UUID v4 for Supabase UUID primary keys in both browser & Node.
 */
export function generateUuid(): string {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Compute whole years of age from DD/MM/YYYY or YYYY-MM-DD DOB strings.
 */
export function computeAgeFromDob(dob?: string | null): number {
  if (!dob) return 0;
  const trimmed = dob.trim();
  let day = 0;
  let month = 0;
  let year = 0;

  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split(/[\/\-]/).map((n) => parseInt(n, 10));
    day = d;
    month = m;
    year = y;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map((n) => parseInt(n, 10));
    day = d;
    month = m;
    year = y;
  } else {
    return 0;
  }

  if (!year || !month || !day) return 0;
  const today = new Date();
  let age = today.getFullYear() - year;
  const mDiff = today.getMonth() + 1 - month;
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Create a clean PatientProfile from authenticated user identity (zero mock placeholders).
 */
export function createCleanPatientProfile(params: {
  id?: string;
  username?: string;
  name: string;
  dob?: string;
  email?: string;
  phone?: string;
  abhaId?: string;
  avatarUrl?: string;
  avatarPath?: string | null;
}): PatientProfile {
  const dob = params.dob || '';
  const suffix = (params.id || '0000').replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase() || '0000';
  return {
    id: params.id,
    username: params.username,
    name: params.name.trim() || 'Citizen',
    age: computeAgeFromDob(dob),
    dob,
    mrn: `SW-${suffix}`,
    synthMrn: params.abhaId || 'Not linked',
    verified: Boolean(params.id),
    bloodType: 'Not specified',
    criticalAllergy: 'None reported',
    primaryAttending: 'Not assigned',
    clinicalNetwork: 'Not linked',
    insurance: 'Not linked',
    avatarUrl: params.avatarUrl || '',
    avatarPath: params.avatarPath || null,
    avatarUpdatedAt: null,
    sessionKey: params.id ? `0x${params.id.replace(/[^a-f0-9]/gi, '').slice(0, 4).toUpperCase()}...LOCK` : 'LOCAL-VAULT',
    email: params.email || '',
    phone: params.phone || '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFS },
  };
}

/**
 * Compute real dashboard statistics directly from loaded user records & items.
 */
export function computeDashboardSummary(params: {
  records: MedicalRecord[];
  vaccines: VaccineItem[];
  delegations: ActiveDelegation[];
  appointments: AppointmentItem[];
  notifications: NotificationItem[];
  medicines: UserMedicine[];
}): DashboardSummary {
  const { records, vaccines, delegations, appointments, notifications, medicines } = params;
  return {
    totalRecordsCount: records.length,
    prescriptionsCount: records.filter((r) => r.category === 'prescription').length,
    vaccinesCount: vaccines.length,
    dueVaccinesCount: vaccines.filter((v) => v.type === 'due' || v.type === 'seasonal').length,
    activeSharesCount: delegations.filter((d) => !d.revoked).length,
    upcomingAppointmentsCount: appointments.filter((a) => a.status === 'upcoming').length,
    unreadNotificationsCount: notifications.filter((n) => !n.read).length,
    activeMedicinesCount: medicines.filter((m) => m.isActive).length,
  };
}

// ============================================================================
// ROW MAPPERS
// ============================================================================

export function mapProfileRowToPatient(
  row: any,
  fallback: Partial<PatientProfile> = {},
  signedAvatarUrl?: string
): PatientProfile {
  const dob = row?.dob_aadhaar || fallback.dob || '';
  const name = row?.full_name || fallback.name || 'Citizen';
  const id = row?.user_id || fallback.id;
  const suffix = (id || '0000').replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase() || '0000';

  return {
    id,
    username: row?.username || fallback.username,
    name,
    age: computeAgeFromDob(dob),
    dob,
    mrn: fallback.mrn || `SW-${suffix}`,
    synthMrn: row?.abha_id || fallback.synthMrn || 'Not linked',
    verified: true,
    bloodType: row?.blood_group || fallback.bloodType || 'Not specified',
    criticalAllergy: row?.critical_allergy || fallback.criticalAllergy || 'None reported',
    primaryAttending: row?.primary_doctor || fallback.primaryAttending || 'Not assigned',
    clinicalNetwork: row?.hospital_network || fallback.clinicalNetwork || 'Not linked',
    insurance: row?.insurance_provider || fallback.insurance || 'Not linked',
    avatarUrl: signedAvatarUrl || row?.avatar_url || fallback.avatarUrl || '',
    avatarPath: row?.avatar_path ?? fallback.avatarPath ?? null,
    avatarUpdatedAt: row?.avatar_updated_at ?? fallback.avatarUpdatedAt ?? null,
    sessionKey: fallback.sessionKey || `0x${suffix}...VAULT`,
    email: row?.email || fallback.email || '',
    phone: row?.mobile_number || fallback.phone || '',
    emergencyContactName: row?.emergency_contact_name || fallback.emergencyContactName || '',
    emergencyContactPhone: row?.emergency_contact_phone || fallback.emergencyContactPhone || '',
    notificationPreferences: row?.notification_preferences || fallback.notificationPreferences || { ...DEFAULT_NOTIFICATION_PREFS },
  };
}

export function mapHealthRecordRow(row: any, signedUrl?: string): MedicalRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category || 'other',
    code: row.code || 'RECORD',
    codeStandard: row.code_standard || 'CUSTOM',
    date: row.record_date || '',
    clinician: row.clinician || 'Not specified',
    hospital: row.hospital || 'Not specified',
    integrityStatus: row.integrity_status || 'SHA-256 Valid',
    verified: Boolean(row.verified),
    sha256: row.sha256 || '',
    fileSize: row.file_size || '0 KB',
    fileFormat: row.file_format || 'PDF',
    indication: row.indication || undefined,
    impression: row.impression || undefined,
    biomarkers: Array.isArray(row.biomarkers) ? row.biomarkers : undefined,
    dosageSig: row.dosage_sig || undefined,
    refillsLeft: row.refills_left ?? undefined,
    totalRefills: row.total_refills ?? undefined,
    imageUrl: signedUrl || undefined,
    fileStoragePath: row.file_storage_path || undefined,
    storageBucket: row.storage_bucket || undefined,
    uploadedAt: row.uploaded_at || undefined,
    ocrExtractedText: row.ocr_extracted_text || undefined,
    originalDocumentName: row.original_document_name || undefined,
    driveFileId: row.drive_file_id || undefined,
    version: row.version || 1,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  };
}

export function mapUserMedicineRow(row: any): UserMedicine {
  return {
    id: row.id,
    userId: row.user_id,
    catalogMedicineId: row.catalog_medicine_id || undefined,
    name: row.name,
    system: row.system || 'allopathy',
    genericOrActiveSalt: row.generic_or_active_salt || '',
    dosageForm: row.dosage_form || 'Tablet',
    strengthOrPotency: row.strength_or_potency || '',
    manufacturer: row.manufacturer || undefined,
    frequency: row.frequency || undefined,
    duration: row.duration || undefined,
    instructions: row.instructions || undefined,
    prescriberName: row.prescriber_name || undefined,
    prescriptionDate: row.prescription_date || undefined,
    linkedRecordId: row.linked_record_id || undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapVaccineRow(row: any): VaccineItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    subtitle: row.subtitle || '',
    type: row.vaccine_type || 'administered',
    priority: row.priority || 'normal',
    status: row.status || 'Recorded',
    code: row.code || 'CVX',
    dueDate: row.due_date || undefined,
    interval: row.interval_label || undefined,
    lastDose: row.last_dose || undefined,
    lot: row.lot_number || undefined,
    facility: row.facility || undefined,
    registryState: row.registry_state || undefined,
    serologyTiter: row.serology_titer || undefined,
    fhirId: row.fhir_id || undefined,
    ndcCode: row.ndc_code || undefined,
    clinicianSig: row.clinician_sig || undefined,
    dosesHistory: Array.isArray(row.doses_history) ? row.doses_history : undefined,
    updatedAt: row.updated_at,
  };
}

export function mapAppointmentRow(row: any): AppointmentItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    clinicianOrFacility: row.clinician_or_facility,
    category: row.category || 'consultation',
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    feeInr: row.fee_inr || undefined,
    notes: row.notes || undefined,
    status: row.status || 'upcoming',
    createdAt: row.created_at,
  };
}

export function mapDelegationRow(row: any): ActiveDelegation {
  const expiresAtDate = row.expires_at ? new Date(row.expires_at) : null;
  const remainingMins = expiresAtDate
    ? Math.max(0, Math.round((expiresAtDate.getTime() - Date.now()) / 60000))
    : 0;
  const expiresIn =
    remainingMins <= 0
      ? 'Expired'
      : remainingMins < 60
      ? `${remainingMins}m`
      : `${Math.round(remainingMins / 60)}h`;
  const parts = (row.recipient_name || 'DR').trim().split(/\s+/);
  const initials = parts.map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'DR';
  const ids: string[] = Array.isArray(row.selected_record_ids) ? row.selected_record_ids : [];

  return {
    id: row.id,
    userId: row.user_id,
    recipientName: row.recipient_name,
    facility: row.recipient_facility || 'Verified Clinical Facility',
    initials,
    expiresIn,
    expiresDate: expiresAtDate ? expiresAtDate.toLocaleString('en-IN') : 'Temporary Pass',
    expiresAtIso: row.expires_at,
    scopesSummary: `${ids.length || 1} RECORD${ids.length === 1 ? '' : 'S'} • ${String(row.scope_type || 'selected').toUpperCase()}`,
    selectedRecordIds: ids,
    tokenCode: (row.token_id || row.id).toString().slice(0, 8).toUpperCase(),
    tokenHash: `0x${row.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
    purpose: row.purpose || 'Clinical Consultation',
    revoked: Boolean(row.revoked),
    createdAt: row.created_at,
  };
}

export function mapAuditRow(row: any): AuditEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    timestamp: row.created_at ? new Date(row.created_at).toLocaleString('en-IN') : 'Just now',
    actor: row.actor,
    actionType: row.action_type,
    clientIp: row.client_ip || 'Swasthya Citizen Portal',
    statusCode: row.status_code || '200 OK',
    details: row.details || '',
    sigVerified: Boolean(row.sig_verified),
    createdAt: row.created_at,
  };
}

export function mapNotificationRow(row: any): NotificationItem {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.notification_type || 'info',
    read: Boolean(row.is_read),
    createdAt: row.created_at || new Date().toISOString(),
    actionView: row.action_view || undefined,
  };
}

// ============================================================================
// LOCAL PER-USER VAULT STORAGE (CLEAN, ZERO MOCK DATA)
// ============================================================================
const LOCAL_USER_DATA_PREFIX = 'swasthya_user_vault_v1_';

export interface LocalUserVaultBundle {
  profile: PatientProfile | null;
  records: MedicalRecord[];
  medicines: UserMedicine[];
  vaccines: VaccineItem[];
  appointments: AppointmentItem[];
  delegations: ActiveDelegation[];
  auditLogs: AuditEvent[];
  notifications: NotificationItem[];
}

export function loadLocalUserVault(userId: string): LocalUserVaultBundle {
  const empty: LocalUserVaultBundle = {
    profile: null,
    records: [],
    medicines: [],
    vaccines: [],
    appointments: [],
    delegations: [],
    auditLogs: [],
    notifications: [],
  };
  if (typeof window === 'undefined' || !userId) return empty;
  try {
    const raw = localStorage.getItem(`${LOCAL_USER_DATA_PREFIX}${userId}`);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || null,
      records: Array.isArray(parsed.records) ? parsed.records : [],
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
      vaccines: Array.isArray(parsed.vaccines) ? parsed.vaccines : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
      delegations: Array.isArray(parsed.delegations) ? parsed.delegations : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    };
  } catch {
    return empty;
  }
}

export function saveLocalUserVault(userId: string, bundle: Partial<LocalUserVaultBundle>): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const existing = loadLocalUserVault(userId);
    const merged: LocalUserVaultBundle = {
      ...existing,
      ...bundle,
    };
    localStorage.setItem(`${LOCAL_USER_DATA_PREFIX}${userId}`, JSON.stringify(merged));
  } catch (err) {
    console.warn('[Swasthya Wallet] Unable to persist local user vault:', err);
  }
}

// ============================================================================
// PROFILE & PRIVATE PROFILE PHOTO STORAGE OPERATIONS
// ============================================================================

export async function getSignedProfilePhotoUrl(
  avatarPath: string | null | undefined
): Promise<ServiceResult<string>> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  }
  if (!avatarPath) {
    return { data: null, error: null, isConfigured: true };
  }
  try {
    const { data, error } = await client.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .createSignedUrl(avatarPath, 3600);
    if (error) {
      return { data: null, error: error.message, isConfigured: true };
    }
    return { data: data?.signedUrl || null, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to sign photo URL', isConfigured: true };
  }
}

export async function fetchUserProfile(
  userId: string,
  fallback: Partial<PatientProfile> = {}
): Promise<ServiceResult<PatientProfile>> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  }
  try {
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message, isConfigured: true };
    }

    if (!data) {
      return { data: null, error: null, isConfigured: true };
    }

    let signedUrl = '';
    if (data.avatar_path) {
      const signedRes = await getSignedProfilePhotoUrl(data.avatar_path);
      if (signedRes.data) signedUrl = signedRes.data;
    }

    return {
      data: mapProfileRowToPatient(data, fallback, signedUrl),
      error: null,
      isConfigured: true,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Failed to load citizen profile from Supabase.',
      isConfigured: true,
    };
  }
}

export async function upsertUserProfile(
  userId: string,
  profile: PatientProfile
): Promise<ServiceResult<PatientProfile>> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  }
  try {
    const now = new Date().toISOString();
    const rowPayload = {
      user_id: userId,
      username: profile.username || null,
      full_name: profile.name,
      email: profile.email || null,
      mobile_number: profile.phone || null,
      dob_aadhaar: profile.dob || null,
      abha_id: profile.synthMrn && profile.synthMrn !== 'Not linked' ? profile.synthMrn : null,
      blood_group: profile.bloodType || null,
      critical_allergy: profile.criticalAllergy || 'None reported',
      emergency_contact_name: profile.emergencyContactName || null,
      emergency_contact_phone: profile.emergencyContactPhone || null,
      primary_doctor: profile.primaryAttending || null,
      hospital_network: profile.clinicalNetwork || null,
      insurance_provider: profile.insurance || null,
      avatar_path: profile.avatarPath ?? null,
      avatar_updated_at: profile.avatarUpdatedAt ?? null,
      notification_preferences: profile.notificationPreferences || DEFAULT_NOTIFICATION_PREFS,
      updated_at: now,
    };

    const { data, error } = await client
      .from('user_profiles')
      .upsert(rowPayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message, isConfigured: true };
    }

    return {
      data: mapProfileRowToPatient(data, profile, profile.avatarUrl),
      error: null,
      isConfigured: true,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Failed to save profile to Supabase.',
      isConfigured: true,
    };
  }
}

/**
 * Upload compressed avatar image to private 'profile-photos' bucket and update user_profiles.avatar_path.
 * Never deletes or overwrites previous avatar path if upload fails.
 */
export async function uploadProfilePhotoToSupabase(
  userId: string,
  fileOrBlob: Blob,
  ext: string,
  previousAvatarPath?: string | null
): Promise<ServiceResult<{ avatarPath: string; signedUrl: string; updatedAt: string }>> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  }

  const targetPath = buildProfilePhotoStoragePath(userId, ext);
  const updatedAt = new Date().toISOString();

  try {
    const { error: uploadError } = await client.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(targetPath, fileOrBlob, {
        cacheControl: '3600',
        contentType: fileOrBlob.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return {
        data: null,
        error: `Storage upload failed: ${uploadError.message}`,
        isConfigured: true,
      };
    }

    const { error: dbError } = await client
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          avatar_path: targetPath,
          avatar_updated_at: updatedAt,
          updated_at: updatedAt,
        },
        { onConflict: 'user_id' }
      );

    if (dbError) {
      return {
        data: null,
        error: `Photo uploaded, but failed to update profile record: ${dbError.message}`,
        isConfigured: true,
      };
    }

    if (previousAvatarPath && previousAvatarPath !== targetPath) {
      await client.storage.from(PROFILE_PHOTOS_BUCKET).remove([previousAvatarPath]);
    }

    const signedRes = await getSignedProfilePhotoUrl(targetPath);
    if (!signedRes.data) {
      return {
        data: null,
        error: signedRes.error || 'Photo saved, but failed to generate signed URL.',
        isConfigured: true,
      };
    }

    return {
      data: {
        avatarPath: targetPath,
        signedUrl: signedRes.data,
        updatedAt,
      },
      error: null,
      isConfigured: true,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Unexpected error uploading profile photo.',
      isConfigured: true,
    };
  }
}

/**
 * Remove profile photo from private storage bucket and clear avatar_path in user_profiles.
 */
export async function removeProfilePhotoFromSupabase(
  userId: string,
  currentAvatarPath?: string | null
): Promise<ServiceResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  }
  try {
    if (currentAvatarPath) {
      const { error: removeError } = await client.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .remove([currentAvatarPath]);
      if (removeError) {
        return {
          data: null,
          error: `Could not delete photo from storage: ${removeError.message}`,
          isConfigured: true,
        };
      }
    }

    const { error: dbError } = await client
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          avatar_path: null,
          avatar_url: null,
          avatar_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (dbError) {
      return {
        data: null,
        error: `Could not clear avatar reference in database: ${dbError.message}`,
        isConfigured: true,
      };
    }

    return { data: true, error: null, isConfigured: true };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Failed to remove profile photo.',
      isConfigured: true,
    };
  }
}

// ============================================================================
// HEALTH RECORDS & PRIVATE HEALTH DOCUMENTS BUCKET
// ============================================================================

export async function getSignedHealthDocumentUrl(
  storagePath?: string | null
): Promise<ServiceResult<string>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  if (!storagePath) return { data: null, error: null, isConfigured: true };
  try {
    const { data, error } = await client.storage
      .from(HEALTH_DOCUMENTS_BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: data?.signedUrl || null, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to sign document URL', isConfigured: true };
  }
}

export async function fetchHealthRecords(
  userId: string
): Promise<ServiceResult<MedicalRecord[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };

  try {
    const { data, error } = await client
      .from('health_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message, isConfigured: true };

    const mapped = await Promise.all(
      (data || []).map(async (row) => {
        let signedUrl: string | undefined;
        if (row.file_storage_path) {
          const urlRes = await getSignedHealthDocumentUrl(row.file_storage_path);
          if (urlRes.data) signedUrl = urlRes.data;
        }
        return mapHealthRecordRow(row, signedUrl);
      })
    );

    return { data: mapped, error: null, isConfigured: true };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Failed to fetch health records from Supabase.',
      isConfigured: true,
    };
  }
}

export async function upsertHealthRecord(
  userId: string,
  record: MedicalRecord,
  rawFile?: File | null
): Promise<ServiceResult<MedicalRecord>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };

  try {
    const recordId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.id)
      ? record.id
      : generateUuid();

    let fileStoragePath = record.fileStoragePath || null;
    let signedUrl = record.imageUrl;

    if (rawFile) {
      const safeName = rawFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = `${userId}/${recordId}/${safeName}`;
      const { error: uploadErr } = await client.storage
        .from(HEALTH_DOCUMENTS_BUCKET)
        .upload(targetPath, rawFile, { upsert: true, contentType: rawFile.type || 'application/octet-stream' });

      if (uploadErr) {
        return {
          data: null,
          error: `Document upload failed: ${uploadErr.message}`,
          isConfigured: true,
        };
      }
      fileStoragePath = targetPath;
      const urlRes = await getSignedHealthDocumentUrl(targetPath);
      if (urlRes.data) signedUrl = urlRes.data;
    }

    const { data, error } = await client
      .from('health_records')
      .upsert(
        {
          id: recordId,
          user_id: userId,
          title: record.title,
          category: record.category,
          code: record.code,
          code_standard: record.codeStandard,
          record_date: record.date,
          clinician: record.clinician,
          hospital: record.hospital,
          integrity_status: record.integrityStatus,
          sha256: record.sha256,
          file_size: record.fileSize,
          file_format: record.fileFormat,
          file_storage_path: fileStoragePath,
          storage_bucket: HEALTH_DOCUMENTS_BUCKET,
          original_document_name: record.originalDocumentName || rawFile?.name || null,
          uploaded_at: record.uploadedAt || new Date().toLocaleString('en-IN'),
          ocr_extracted_text: record.ocrExtractedText || null,
          drive_file_id: record.driveFileId || null,
          biomarkers: record.biomarkers || null,
          dosage_sig: record.dosageSig || null,
          refills_left: record.refillsLeft ?? null,
          total_refills: record.totalRefills ?? null,
          indication: record.indication || null,
          impression: record.impression || null,
          verified: record.verified ?? true,
          version: record.version ?? 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) return { data: null, error: error.message, isConfigured: true };

    return {
      data: mapHealthRecordRow(data, signedUrl),
      error: null,
      isConfigured: true,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Failed to save health record.',
      isConfigured: true,
    };
  }
}

export async function deleteHealthRecordFromCloud(
  userId: string,
  recordId: string,
  fileStoragePath?: string | null
): Promise<ServiceResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };

  try {
    if (fileStoragePath) {
      await client.storage.from(HEALTH_DOCUMENTS_BUCKET).remove([fileStoragePath]);
    }
    const { error } = await client
      .from('health_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', userId);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: true, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to delete health record.', isConfigured: true };
  }
}

// ============================================================================
// USER MEDICINES & PRESCRIPTIONS
// ============================================================================

export async function fetchUserMedicines(
  userId: string
): Promise<ServiceResult<UserMedicine[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };

  try {
    const { data, error } = await client
      .from('user_medicines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: (data || []).map(mapUserMedicineRow), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to fetch medicines.', isConfigured: true };
  }
}

export async function upsertUserMedicine(
  userId: string,
  medicine: UserMedicine
): Promise<ServiceResult<UserMedicine>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };

  try {
    const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(medicine.id)
      ? medicine.id
      : generateUuid();

    const { data, error } = await client
      .from('user_medicines')
      .upsert(
        {
          id,
          user_id: userId,
          catalog_medicine_id: medicine.catalogMedicineId || null,
          name: medicine.name,
          system: medicine.system,
          generic_or_active_salt: medicine.genericOrActiveSalt,
          dosage_form: medicine.dosageForm,
          strength_or_potency: medicine.strengthOrPotency,
          manufacturer: medicine.manufacturer || null,
          frequency: medicine.frequency || null,
          duration: medicine.duration || null,
          instructions: medicine.instructions || null,
          prescriber_name: medicine.prescriberName || null,
          prescription_date: medicine.prescriptionDate || null,
          linked_record_id: medicine.linkedRecordId || null,
          is_active: medicine.isActive ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: mapUserMedicineRow(data), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to save medicine.', isConfigured: true };
  }
}

export async function deleteUserMedicine(
  userId: string,
  medicineId: string
): Promise<ServiceResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { error } = await client
      .from('user_medicines')
      .delete()
      .eq('id', medicineId)
      .eq('user_id', userId);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: true, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to delete medicine.', isConfigured: true };
  }
}

export async function savePrescriptionOcrBundle(
  userId: string,
  healthRecordId: string | null,
  ocr: PrescriptionOcrResult
): Promise<ServiceResult<string>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };

  try {
    const prescriptionId = generateUuid();
    const { error: rxErr } = await client.from('prescriptions').insert({
      id: prescriptionId,
      user_id: userId,
      health_record_id: healthRecordId,
      prescriber_name: ocr.prescriberName || 'Attending Physician',
      prescriber_reg_no: ocr.prescriberRegistration || null,
      clinic_hospital: ocr.clinicOrHospital || null,
      medical_system: ocr.detectedSystem,
      prescription_date: ocr.prescriptionDate || new Date().toLocaleDateString('en-GB'),
      notes: ocr.rawTextNotes || null,
      verified_by_user: true,
    });
    if (rxErr) return { data: null, error: rxErr.message, isConfigured: true };

    if (ocr.medicines.length > 0) {
      await client.from('prescription_medicines').insert(
        ocr.medicines.map((m) => ({
          id: generateUuid(),
          user_id: userId,
          prescription_id: prescriptionId,
          medicine_name: m.name,
          system: m.system,
          active_ingredients: m.activeIngredients || m.botanicalOrLatinName || null,
          brand_name: m.brandName || null,
          potency: m.strengthOrPotency || null,
          dosage_form: m.dosageForm || null,
          strength: m.strengthOrPotency || null,
          frequency: m.frequency || null,
          duration: m.duration || null,
          instructions: m.instructions || null,
          ocr_confidence: m.confidence ?? null,
          verified_by_user: true,
        }))
      );
    }

    await client.from('prescription_ocr_results').insert({
      id: generateUuid(),
      user_id: userId,
      prescription_id: prescriptionId,
      detected_system: ocr.detectedSystem,
      confidence_score: ocr.confidenceScore,
      extracted_medicines: ocr.medicines,
      raw_text: ocr.rawTextNotes || null,
    });

    return { data: prescriptionId, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to save prescription bundle.', isConfigured: true };
  }
}

// ============================================================================
// VACCINATIONS, APPOINTMENTS, DELEGATIONS, AUDIT LOGS, NOTIFICATIONS
// ============================================================================

export async function fetchVaccinations(userId: string): Promise<ServiceResult<VaccineItem[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { data, error } = await client
      .from('vaccinations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: (data || []).map(mapVaccineRow), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to load vaccinations.', isConfigured: true };
  }
}

export async function upsertVaccination(
  userId: string,
  vaccine: VaccineItem
): Promise<ServiceResult<VaccineItem>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vaccine.id)
      ? vaccine.id
      : generateUuid();
    const { data, error } = await client
      .from('vaccinations')
      .upsert(
        {
          id,
          user_id: userId,
          title: vaccine.title,
          subtitle: vaccine.subtitle || null,
          vaccine_type: vaccine.type,
          priority: vaccine.priority || 'normal',
          status: vaccine.status,
          code: vaccine.code,
          due_date: vaccine.dueDate || null,
          interval_label: vaccine.interval || null,
          last_dose: vaccine.lastDose || null,
          lot_number: vaccine.lot || null,
          facility: vaccine.facility || null,
          registry_state: vaccine.registryState || null,
          serology_titer: vaccine.serologyTiter || null,
          fhir_id: vaccine.fhirId || null,
          ndc_code: vaccine.ndcCode || null,
          clinician_sig: vaccine.clinicianSig || null,
          doses_history: vaccine.dosesHistory || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: mapVaccineRow(data), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to save vaccine.', isConfigured: true };
  }
}

export async function deleteVaccination(userId: string, vaccineId: string): Promise<ServiceResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { error } = await client.from('vaccinations').delete().eq('id', vaccineId).eq('user_id', userId);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: true, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to delete vaccine.', isConfigured: true };
  }
}

export async function fetchAppointments(userId: string): Promise<ServiceResult<AppointmentItem[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { data, error } = await client
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: (data || []).map(mapAppointmentRow), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to load appointments.', isConfigured: true };
  }
}

export async function upsertAppointment(
  userId: string,
  appointment: AppointmentItem
): Promise<ServiceResult<AppointmentItem>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointment.id)
      ? appointment.id
      : generateUuid();
    const { data, error } = await client
      .from('appointments')
      .upsert(
        {
          id,
          user_id: userId,
          title: appointment.title,
          clinician_or_facility: appointment.clinicianOrFacility,
          category: appointment.category,
          scheduled_date: appointment.scheduledDate,
          scheduled_time: appointment.scheduledTime,
          fee_inr: appointment.feeInr || null,
          notes: appointment.notes || null,
          status: appointment.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: mapAppointmentRow(data), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to save appointment.', isConfigured: true };
  }
}

export async function deleteAppointment(userId: string, appointmentId: string): Promise<ServiceResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { error } = await client.from('appointments').delete().eq('id', appointmentId).eq('user_id', userId);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: true, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to delete appointment.', isConfigured: true };
  }
}

export async function fetchSharedDelegations(userId: string): Promise<ServiceResult<ActiveDelegation[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { data, error } = await client
      .from('shared_records')
      .select('*')
      .eq('user_id', userId)
      .eq('revoked', false)
      .order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: (data || []).map(mapDelegationRow), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to load active shares.', isConfigured: true };
  }
}

export async function createSharedDelegation(
  userId: string,
  delegation: ActiveDelegation
): Promise<ServiceResult<ActiveDelegation>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(delegation.id)
      ? delegation.id
      : generateUuid();
    const { data, error } = await client
      .from('shared_records')
      .insert({
        id,
        user_id: userId,
        recipient_name: delegation.recipientName,
        recipient_facility: delegation.facility,
        scope_type: 'selected',
        selected_record_ids: delegation.selectedRecordIds || [],
        purpose: delegation.purpose,
        expires_at: delegation.expiresAtIso || new Date(Date.now() + 3600000).toISOString(),
        revoked: false,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: mapDelegationRow(data), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to create share delegation.', isConfigured: true };
  }
}

export async function revokeSharedDelegation(
  userId: string,
  delegationId: string
): Promise<ServiceResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { error } = await client
      .from('shared_records')
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq('id', delegationId)
      .eq('user_id', userId);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: true, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to revoke share delegation.', isConfigured: true };
  }
}

export async function fetchAuditLogs(userId: string): Promise<ServiceResult<AuditEvent[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: (data || []).map(mapAuditRow), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to load audit logs.', isConfigured: true };
  }
}

export async function appendAuditLog(
  userId: string,
  event: Omit<AuditEvent, 'id' | 'timestamp'>
): Promise<ServiceResult<AuditEvent>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { data, error } = await client
      .from('audit_logs')
      .insert({
        id: generateUuid(),
        user_id: userId,
        title: event.title,
        actor: event.actor,
        action_type: event.actionType || 'USER_ACTION',
        client_ip: event.clientIp || 'Swasthya Citizen Web',
        status_code: event.statusCode || '200 OK',
        details: event.details,
        sig_verified: event.sigVerified ?? true,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: mapAuditRow(data), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to record audit event.', isConfigured: true };
  }
}

export async function fetchNotifications(userId: string): Promise<ServiceResult<NotificationItem[]>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: (data || []).map(mapNotificationRow), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to load notifications.', isConfigured: true };
  }
}

export async function createNotification(
  userId: string,
  notif: Omit<NotificationItem, 'id' | 'createdAt'>
): Promise<ServiceResult<NotificationItem>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { data, error } = await client
      .from('notifications')
      .insert({
        id: generateUuid(),
        user_id: userId,
        title: notif.title,
        message: notif.message,
        notification_type: notif.type || 'info',
        is_read: notif.read ?? false,
        action_view: notif.actionView || null,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: mapNotificationRow(data), error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to create notification.', isConfigured: true };
  }
}

export async function markAllNotificationsRead(userId: string): Promise<ServiceResult<boolean>> {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: getSupabaseConfigError(), isConfigured: false };
  try {
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return { data: null, error: error.message, isConfigured: true };
    return { data: true, error: null, isConfigured: true };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to mark notifications read.', isConfigured: true };
  }
}

/**
 * Check if Supabase configured status flag helper.
 */
export function getDatabaseConnectionSummary(): {
  configured: boolean;
  errorMessage: string | null;
} {
  const configured = isSupabaseConfigured();
  return {
    configured,
    errorMessage: configured ? null : getSupabaseConfigError(),
  };
}
