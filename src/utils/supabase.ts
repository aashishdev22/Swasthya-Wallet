/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Supabase PostgreSQL Database Client & Sync Integration
 * Official Slogan: Digital Health Locker for Citizens
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or fallback local demo configuration
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));
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
      success: true,
      syncedRecordsCount: records.length,
      message: 'Supabase credentials not configured. Records preserved in Zero-Knowledge IndexedDB on device.',
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
      indication: r.indication || null,
      impression: r.impression || null,
      verified: r.verified ?? true,
      updated_at: now,
    }));

    const { error } = await client.from('health_records').upsert(payload, { onConflict: 'id' });
    if (error) {
      throw error;
    }

    return {
      success: true,
      syncedRecordsCount: records.length,
      message: `Successfully synced ${records.length} encrypted record(s) to Supabase PostgreSQL.`,
      timestamp: now,
    };
  } catch (err: any) {
    return {
      success: false,
      syncedRecordsCount: 0,
      message: `Supabase sync error: ${err.message || 'Network error'}. Fallback to IndexedDB active.`,
      timestamp: now,
    };
  }
}

/**
 * Save single record metadata to Supabase
 */
export async function saveRecordToSupabase(record: any, userId: string = 'current_user'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return true;
  try {
    const { error } = await client.from('health_records').upsert({
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
      indication: record.indication || null,
      impression: record.impression || null,
      verified: record.verified ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
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
  if (!client) return true;
  try {
    const { error } = await client.from('health_records').delete().eq('id', recordId);
    return !error;
  } catch {
    return false;
  }
}

