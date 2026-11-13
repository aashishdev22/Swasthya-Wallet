/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Supabase PostgreSQL Database Client & Sync Integration
 * Official Slogan: Digital Health Locker for Citizens
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    const cleanedPath = parsed.pathname
      .replace(/\/+(rest|auth|storage|realtime|functions)\/v\d+.*$/i, '')
      .replace(/\/+$/, '');
    return `${parsed.origin}${cleanedPath}`;
  } catch {
    return trimmed
      .replace(/\/+(rest|auth|storage|realtime|functions)\/v\d+.*$/i, '')
      .replace(/\/+$/, '');
  }
}

const SUPABASE_URL = normalizeSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL || '');
const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('http') &&
      !SUPABASE_URL.includes('your-project') &&
      !SUPABASE_ANON_KEY.includes('your-supabase-anon-key') &&
      !SUPABASE_ANON_KEY.includes('your-anon-key')
  );
}

export function getSupabaseConfigError(): string | null {
  if (isSupabaseConfigured()) return null;
  return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.';
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.warn('[Swasthya Wallet] Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export interface CloudSyncResult {
  success: boolean;
  isConfigured: boolean;
  syncedRecordsCount: number;
  message: string;
  timestamp: string;
}

/**
 * Synchronize local health records with Supabase cloud database
 */
export async function syncHealthRecordsWithSupabase(
  records: any[],
  userId: string
): Promise<CloudSyncResult> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  if (!client) {
    return {
      success: false,
      isConfigured: false,
      syncedRecordsCount: 0,
      message: getSupabaseConfigError() || 'Supabase credentials not configured.',
      timestamp: now,
    };
  }

  if (!userId) {
    return {
      success: false,
      isConfigured: true,
      syncedRecordsCount: 0,
      message: 'Authenticated user session required for Supabase synchronization.',
      timestamp: now,
    };
  }

  try {
    const payload = records.map((r) => ({
      id: r.id,
      user_id: userId,
      title: r.title,
      category: r.category,
      code: r.code,
      code_standard: r.codeStandard,
      record_date: r.date,
      clinician: r.clinician,
      hospital: r.hospital,
      integrity_status: r.integrityStatus,
      sha256: r.sha256,
      file_size: r.fileSize,
      file_format: r.fileFormat,
      file_storage_path: r.fileStoragePath || null,
      storage_bucket: r.storageBucket || 'health-documents',
      original_document_name: r.originalDocumentName || null,
      uploaded_at: r.uploadedAt || null,
      ocr_extracted_text: r.ocrExtractedText || null,
      drive_file_id: r.driveFileId || null,
      biomarkers: r.biomarkers || null,
      dosage_sig: r.dosageSig || null,
      refills_left: r.refillsLeft ?? null,
      total_refills: r.totalRefills ?? null,
      indication: r.indication || null,
      impression: r.impression || null,
      verified: r.verified ?? true,
      version: r.version ?? 1,
      updated_at: now,
    }));

    if (payload.length > 0) {
      const { error } = await client.from('health_records').upsert(payload, { onConflict: 'id' });
      if (error) {
        throw error;
      }
    }

    return {
      success: true,
      isConfigured: true,
      syncedRecordsCount: records.length,
      message: `Successfully synced ${records.length} record(s) to Supabase PostgreSQL.`,
      timestamp: now,
    };
  } catch (err: any) {
    return {
      success: false,
      isConfigured: true,
      syncedRecordsCount: 0,
      message: `Supabase sync error: ${err?.message || 'Network or permission error'}.`,
      timestamp: now,
    };
  }
}

/**
 * Save single record metadata to Supabase
 */
export async function saveRecordToSupabase(record: any, userId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !userId) return false;
  try {
    const { error } = await client.from('health_records').upsert(
      {
        id: record.id,
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
        file_storage_path: record.fileStoragePath || null,
        storage_bucket: record.storageBucket || 'health-documents',
        original_document_name: record.originalDocumentName || null,
        uploaded_at: record.uploadedAt || null,
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
    );
    return !error;
  } catch {
    return false;
  }
}

/**
 * Delete record from Supabase
 */
export async function deleteRecordFromSupabase(recordId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !recordId) return false;
  try {
    const { error } = await client.from('health_records').delete().eq('id', recordId);
    return !error;
  } catch {
    return false;
  }
}
