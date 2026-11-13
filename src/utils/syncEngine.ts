/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Background Synchronization & Dual Storage Engine
 * Official Slogan: Digital Health Locker for Citizens
 */

import { localVaultDB, LocalStorageStats } from './indexedDb.ts';
import {
  upsertRecordToDrive,
  backupRecordsToDrive,
  deleteDriveFileForRecord,
  getDriveStatus,
  getDriveFileId,
} from './googleDrive.ts';
import { saveRecordToSupabase, deleteRecordFromSupabase, isSupabaseConfigured } from './supabase.ts';
import { MedicalRecord } from '../types/health.ts';

export type SyncStatusState =
  | 'Saved on Device'
  | 'Cloud Syncing'
  | 'Synced'
  | 'Sync Pending'
  | 'Sync Failed';

export interface SyncStatusInfo {
  state: SyncStatusState;
  lastSyncTimestamp: number | null;
  pendingCount: number;
  isOnline: boolean;
  driveConnected: boolean;
  driveAccount: string | null;
  supabaseConfigured: boolean;
  localStorageStats: LocalStorageStats | null;
  errorMessage?: string;
}

export interface ConflictResolutionResult {
  hasConflict: boolean;
  resolution: 'local_newer' | 'remote_newer' | 'equal' | 'diverged';
  winner: MedicalRecord;
}

/**
 * Pure conflict-detection and version resolution helper.
 */
export function detectRecordConflict(
  localRecord: MedicalRecord,
  remoteRecord: MedicalRecord
): ConflictResolutionResult {
  const localVer = localRecord.version || 1;
  const remoteVer = remoteRecord.version || 1;
  const localTime = localRecord.updatedAt || 0;
  const remoteTime = remoteRecord.updatedAt || 0;

  if (localVer === remoteVer && localRecord.sha256 === remoteRecord.sha256) {
    return { hasConflict: false, resolution: 'equal', winner: localRecord };
  }

  if (localVer === remoteVer && localRecord.sha256 !== remoteRecord.sha256) {
    const winner = localTime >= remoteTime ? localRecord : remoteRecord;
    return {
      hasConflict: true,
      resolution: 'diverged',
      winner: { ...winner, version: Math.max(localVer, remoteVer) + 1 },
    };
  }

  if (localVer > remoteVer) {
    return { hasConflict: true, resolution: 'local_newer', winner: localRecord };
  }

  return { hasConflict: true, resolution: 'remote_newer', winner: remoteRecord };
}

/**
 * Exponential backoff delay calculation for foreground sync retry.
 */
export function nextRetryDelayMs(attempt: number): number {
  const safeAttempt = Math.max(0, Math.min(attempt, 6));
  return Math.min(60000, 1500 * Math.pow(2, safeAttempt));
}

type SyncStatusListener = (info: SyncStatusInfo) => void;

class BackgroundSyncEngine {
  private currentState: SyncStatusState = 'Saved on Device';
  private lastSyncTimestamp: number | null = null;
  private pendingCount: number = 0;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<SyncStatusListener> = new Set();
  private isSyncing: boolean = false;
  private storageStats: LocalStorageStats | null = null;
  private retryTimer: any = null;
  private retryAttempt: number = 0;
  private lastErrorMessage: string | undefined = undefined;
  private lastPatientName: string = 'Swasthya Citizen';
  private activeUserId: string | null = null;

  public setActiveUserId(userId: string | null) {
    this.activeUserId = userId;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));

      const savedTime = localStorage.getItem('swasthya_last_sync_timestamp');
      if (savedTime) {
        this.lastSyncTimestamp = parseInt(savedTime, 10);
      }
    }
  }

  public init() {
    this.refreshStats();
    this.registerBackgroundSyncTag();
    setTimeout(() => {
      this.processPendingQueue(this.lastPatientName);
    }, 1200);
  }

  private async registerBackgroundSyncTag() {
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const reg: any = await navigator.serviceWorker.getRegistration();
        if (reg && 'sync' in reg) {
          await reg.sync.register('swasthya-health-sync');
        }
      }
    } catch {
      // Background Sync API not active; foreground retry mechanism handles queue
    }
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncStatusInfo {
    const driveStatus = getDriveStatus();
    return {
      state: this.currentState,
      lastSyncTimestamp: this.lastSyncTimestamp,
      pendingCount: this.pendingCount,
      isOnline: this.isOnline,
      driveConnected: driveStatus.isConnected,
      driveAccount: driveStatus.userEmail,
      supabaseConfigured: isSupabaseConfigured(),
      localStorageStats: this.storageStats,
      errorMessage: this.lastErrorMessage,
    };
  }

  private notify() {
    const info = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(info);
      } catch (err) {
        console.error('[SyncEngine] Error in listener callback:', err);
      }
    });
  }

  private setSyncState(newState: SyncStatusState, errorMessage?: string) {
    this.currentState = newState;
    this.lastErrorMessage = errorMessage;
    this.notify();
  }

  private clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private scheduleRetry(patientName: string) {
    this.clearRetryTimer();
    if (!this.isOnline || this.retryAttempt >= 5) return;
    const delay = nextRetryDelayMs(this.retryAttempt);
    this.retryAttempt += 1;
    this.retryTimer = setTimeout(() => {
      this.processPendingQueue(patientName);
    }, delay);
  }

  private async refreshStats() {
    try {
      this.storageStats = await localVaultDB.getStorageStats();
      const queue = await localVaultDB.getPendingSyncQueue();
      this.pendingCount = queue.length;
      if (this.pendingCount > 0 && this.currentState === 'Synced') {
        this.currentState = 'Sync Pending';
      }
      this.notify();
    } catch {
      // ignore
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    if (online) {
      this.retryAttempt = 0;
      this.setSyncState(this.pendingCount > 0 ? 'Sync Pending' : 'Saved on Device');
      this.processPendingQueue(this.lastPatientName);
    } else {
      this.clearRetryTimer();
      this.setSyncState(this.pendingCount > 0 ? 'Sync Pending' : 'Saved on Device');
    }
  }

  /**
   * Automatic Dual Save Workflow:
   * 1. Version record and save immediately to Local Encrypted Device Storage (IndexedDB).
   * 2. Persist metadata to Supabase PostgreSQL if configured.
   * 3. Upload encrypted payload to authorized Google Drive folder if connected.
   * 4. Never report 'Synced' unless cloud providers actually confirm the upload.
   */
  public async autoSaveRecord(
    record: MedicalRecord,
    patientName: string = 'Swasthya Citizen'
  ): Promise<{ localSuccess: boolean; cloudSuccess: boolean; versionedRecord: MedicalRecord }> {
    this.lastPatientName = patientName;
    const versionedRecord: MedicalRecord = {
      ...record,
      version: (record.version || 0) + 1,
      updatedAt: Date.now(),
      driveFileId: record.driveFileId || getDriveFileId(record.id) || undefined,
    };

    // 1. Immediately save to Mobile Device Storage (IndexedDB)
    let localSuccess = false;
    try {
      await localVaultDB.saveHealthRecord(versionedRecord, 'pending');
      localSuccess = true;
    } catch (err) {
      console.error('[SyncEngine] Local save failed:', err);
    }

    // 2. Check online state & Supabase (only sync when configured AND authenticated userId present)
    let supabaseOk = !isSupabaseConfigured();
    if (this.isOnline && isSupabaseConfigured() && this.activeUserId) {
      supabaseOk = await saveRecordToSupabase(versionedRecord, this.activeUserId);
    } else if (!this.isOnline && isSupabaseConfigured()) {
      supabaseOk = false;
    }

    // 3. Attempt Google Drive background sync only if connected & online
    const driveStatus = getDriveStatus();
    let cloudSuccess = false;

    if (!this.isOnline) {
      await localVaultDB.enqueueSyncAction('insert', 'records', versionedRecord);
      this.setSyncState('Sync Pending', 'Device offline. Queued for automatic cloud sync.');
      await this.refreshStats();
      return { localSuccess, cloudSuccess: false, versionedRecord };
    }

    if (driveStatus.isConnected) {
      this.setSyncState('Cloud Syncing');
      try {
        const driveRes = await upsertRecordToDrive(versionedRecord, patientName);
        if (driveRes.success) {
          cloudSuccess = supabaseOk;
          if (driveRes.fileId) {
            versionedRecord.driveFileId = driveRes.fileId;
          }
          await localVaultDB.saveHealthRecord(versionedRecord, cloudSuccess ? 'synced' : 'pending');
          if (cloudSuccess) {
            this.lastSyncTimestamp = Date.now();
            this.retryAttempt = 0;
            this.clearRetryTimer();
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('swasthya_last_sync_timestamp', String(this.lastSyncTimestamp));
            }
            this.setSyncState('Synced');
          } else {
            await localVaultDB.enqueueSyncAction('update', 'records', versionedRecord);
            this.setSyncState('Sync Pending', 'Drive synced; metadata sync pending.');
            this.scheduleRetry(patientName);
          }
        } else {
          await localVaultDB.enqueueSyncAction('insert', 'records', versionedRecord);
          this.setSyncState('Sync Pending', driveRes.error || 'Google Drive upload deferred.');
          this.scheduleRetry(patientName);
        }
      } catch (err: any) {
        await localVaultDB.enqueueSyncAction('insert', 'records', versionedRecord);
        this.setSyncState('Sync Pending', err?.message || 'Drive upload failed.');
        this.scheduleRetry(patientName);
      }
    } else {
      // Drive is not authorized by user: stay honest!
      if (!supabaseOk) {
        await localVaultDB.enqueueSyncAction('insert', 'records', versionedRecord);
        this.setSyncState('Sync Pending', 'Supabase metadata sync queued.');
        this.scheduleRetry(patientName);
      } else {
        await localVaultDB.saveHealthRecord(versionedRecord, 'synced');
        this.setSyncState('Saved on Device');
      }
    }

    await this.refreshStats();
    return { localSuccess, cloudSuccess, versionedRecord };
  }

  /**
   * Delete Record across storage destinations based on authorized deletion policy.
   */
  public async autoDeleteRecord(
    recordId: string,
    policy: 'delete_everywhere' | 'local_only' | 'archive' = 'delete_everywhere'
  ): Promise<void> {
    this.setSyncState('Cloud Syncing');
    try {
      if (policy === 'delete_everywhere' || policy === 'local_only') {
        await localVaultDB.deleteHealthRecord(recordId);
      }

      if (policy === 'delete_everywhere') {
        const supaOk = this.isOnline ? await deleteRecordFromSupabase(recordId) : false;
        const driveConnected = getDriveStatus().isConnected;

        if (!this.isOnline) {
          await localVaultDB.enqueueSyncAction('delete', 'records', { id: recordId });
          this.setSyncState('Sync Pending', 'Deletion queued until online.');
        } else if (driveConnected) {
          const driveDel = await deleteDriveFileForRecord(recordId);
          if (driveDel.success && supaOk) {
            this.lastSyncTimestamp = Date.now();
            this.setSyncState('Synced');
          } else {
            await localVaultDB.enqueueSyncAction('delete', 'records', { id: recordId });
            this.setSyncState('Sync Pending', driveDel.error || 'Cloud deletion retry scheduled.');
            this.scheduleRetry(this.lastPatientName);
          }
        } else if (supaOk) {
          this.setSyncState('Saved on Device');
        } else {
          await localVaultDB.enqueueSyncAction('delete', 'records', { id: recordId });
          this.setSyncState('Sync Pending');
          this.scheduleRetry(this.lastPatientName);
        }
      } else {
        this.setSyncState('Saved on Device');
      }
    } catch (err: any) {
      console.error('[SyncEngine] Delete failed:', err);
      this.setSyncState('Sync Failed', err?.message || 'Delete operation failed');
    }
    await this.refreshStats();
  }

  /**
   * Process pending sync queue idempotently without duplicating records.
   */
  public async processPendingQueue(patientName: string = 'Swasthya Citizen'): Promise<number> {
    if (this.isSyncing || !this.isOnline) return 0;
    this.lastPatientName = patientName;
    this.isSyncing = true;

    try {
      const queue = await localVaultDB.getPendingSyncQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        this.clearRetryTimer();
        if (this.currentState === 'Cloud Syncing' || this.currentState === 'Sync Pending') {
          this.setSyncState(getDriveStatus().isConnected ? 'Synced' : 'Saved on Device');
        }
        return 0;
      }

      const driveStatus = getDriveStatus();
      if (!driveStatus.isConnected) {
        this.isSyncing = false;
        this.setSyncState('Saved on Device');
        return 0;
      }

      this.setSyncState('Cloud Syncing');
      let processed = 0;

      // Deduplicate by record ID preserving latest action
      const latestActionById = new Map<string, { action: string; payload: any; queueIds: string[] }>();

      for (const item of queue) {
        if (item.collection !== 'records' || !item.payload) continue;
        const recId = item.payload.id || item.id;
        const existing = latestActionById.get(recId);
        const queueIds = existing ? [...existing.queueIds, item.id] : [item.id];
        latestActionById.set(recId, { action: item.action, payload: item.payload, queueIds });
      }

      let anyFailure = false;
      let lastErr: string | undefined;

      for (const [, entry] of latestActionById.entries()) {
        if (entry.action === 'delete') {
          const supaDel = await deleteRecordFromSupabase(entry.payload.id);
          const driveDel = await deleteDriveFileForRecord(entry.payload.id);
          if (supaDel && driveDel.success) {
            for (const qId of entry.queueIds) {
              await localVaultDB.clearSyncQueueItem(qId);
              processed++;
            }
          } else {
            anyFailure = true;
            lastErr = driveDel.error || 'Pending deletion failed';
          }
        } else {
          const supaOk =
            isSupabaseConfigured() && this.activeUserId
              ? await saveRecordToSupabase(entry.payload, this.activeUserId)
              : !isSupabaseConfigured();
          const driveRes = await upsertRecordToDrive(entry.payload, patientName);
          if (driveRes.success && supaOk) {
            if (driveRes.fileId) {
              entry.payload.driveFileId = driveRes.fileId;
            }
            await localVaultDB.saveHealthRecord(entry.payload, 'synced');
            for (const qId of entry.queueIds) {
              await localVaultDB.clearSyncQueueItem(qId);
              processed++;
            }
          } else {
            anyFailure = true;
            lastErr = driveRes.error || 'Pending upload failed';
          }
        }
      }

      if (!anyFailure) {
        this.retryAttempt = 0;
        this.clearRetryTimer();
        this.lastSyncTimestamp = Date.now();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('swasthya_last_sync_timestamp', String(this.lastSyncTimestamp));
        }
        this.setSyncState('Synced');
      } else {
        this.setSyncState('Sync Pending', lastErr);
        this.scheduleRetry(patientName);
      }
      return processed;
    } catch (err: any) {
      console.warn('[SyncEngine] Pending queue sync retry error:', err);
      this.setSyncState('Sync Failed', err?.message || 'Background sync error');
      this.scheduleRetry(patientName);
      return 0;
    } finally {
      this.isSyncing = false;
      await this.refreshStats();
    }
  }

  /**
   * Trigger manual encrypted backup & retry sync (used in Settings).
   */
  public async triggerManualSync(allRecords: MedicalRecord[], patientName: string = 'Swasthya Citizen'): Promise<boolean> {
    this.lastPatientName = patientName;
    if (!getDriveStatus().isConnected) {
      this.setSyncState('Saved on Device', 'Connect Google Drive to back up encrypted records to cloud.');
      return false;
    }
    this.setSyncState('Cloud Syncing');
    try {
      await this.processPendingQueue(patientName);
      const res = await backupRecordsToDrive(allRecords, patientName);
      if (res.success) {
        for (const rec of allRecords) {
          await localVaultDB.saveHealthRecord(rec, 'synced');
        }
        this.lastSyncTimestamp = Date.now();
        this.retryAttempt = 0;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('swasthya_last_sync_timestamp', String(this.lastSyncTimestamp));
        }
        this.setSyncState('Synced');
        await this.refreshStats();
        return true;
      } else {
        this.setSyncState('Sync Failed', res.error || 'Google Drive backup failed.');
        await this.refreshStats();
        return false;
      }
    } catch (err: any) {
      this.setSyncState('Sync Failed', err?.message || 'Backup error.');
      await this.refreshStats();
      return false;
    }
  }
}

export const syncEngine = new BackgroundSyncEngine();
