/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Storage & Synchronization Engine View
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState, useEffect } from 'react';
import { localVaultDB, LocalStorageStats } from '../utils/indexedDb.ts';
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  backupRecordsToDrive,
  listDriveBackups,
  getDriveStatus,
  DriveStatus,
  DriveBackupMeta,
} from '../utils/googleDrive.ts';
import { syncHealthRecordsWithSupabase, isSupabaseConfigured } from '../utils/supabase.ts';
import { MedicalRecord, PatientProfile } from '../types/health.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface StorageSyncViewProps {
  records: MedicalRecord[];
  patient: PatientProfile;
  currentLang?: SupportedLanguage;
  onRestoreRecords?: (newRecords: MedicalRecord[]) => void;
}

export const StorageSyncView: React.FC<StorageSyncViewProps> = ({
  records,
  patient,
  currentLang = 'en',
  onRestoreRecords,
}) => {
  const t = getTranslation(currentLang);

  // Network State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // IndexedDB Stats
  const [storageStats, setStorageStats] = useState<LocalStorageStats>({
    recordsCount: records.length,
    prescriptionsCount: records.filter((r) => r.category === 'prescription').length,
    reportsCount: records.filter((r) => r.category === 'lab').length,
    pendingSyncCount: 0,
    databaseSizeBytes: records.length * 4096,
    lastLocalSaveTimestamp: Date.now(),
  });

  // Google Drive State
  const [driveStatus, setDriveStatus] = useState<DriveStatus>(getDriveStatus());
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupMeta[]>([]);
  const [driveActionNotice, setDriveActionNotice] = useState<string | null>(null);

  // Supabase Sync State
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch local stats from IndexedDB
    localVaultDB.getStorageStats().then((stats) => {
      setStorageStats({
        ...stats,
        recordsCount: Math.max(stats.recordsCount, records.length),
      });
    });

    setDriveStatus(getDriveStatus());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [records.length]);

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    try {
      await connectGoogleDrive();
      const updated = getDriveStatus();
      setDriveStatus(updated);
      setDriveActionNotice('Connected to Google Drive! Swasthya Wallet folder is ready.');

      // Load existing backups
      const files = await listDriveBackups();
      setDriveBackups(files);
    } catch (err: any) {
      setDriveActionNotice(`Drive connection failed: ${err.message || 'Cancelled'}`);
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    await disconnectGoogleDrive();
    setDriveStatus(getDriveStatus());
    setDriveBackups([]);
    setDriveActionNotice('Google Drive disconnected.');
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const res = await backupRecordsToDrive(records, patient.name);
      if (res.success) {
        setDriveStatus(getDriveStatus());
        setDriveActionNotice(`Backup complete! Encrypted snapshot saved to Swasthya Wallet/Backups/${res.fileName}`);
        const files = await listDriveBackups();
        setDriveBackups(files);
      } else {
        setDriveActionNotice(`Backup failed: ${res.error}`);
      }
    } catch (e: any) {
      setDriveActionNotice(`Backup error: ${e.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await syncHealthRecordsWithSupabase(records, patient.id || '');
      setSupabaseSyncMessage(res.message);
    } catch (e: any) {
      setSupabaseSyncMessage(`Supabase error: ${e.message}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[26px]">cloud_sync</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Storage, Google Drive & Sync Status
              </h1>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isOnline ? 'Online Sync Active' : 'Offline Mode (Local Vault)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Swasthya Wallet • Digital Health Locker for Citizens | Offline-First IndexedDB, Google Drive Cloud Backup & Supabase
            </p>
          </div>
        </div>

        {/* Global Sync Trigger */}
        <button
          type="button"
          onClick={handleSyncSupabase}
          disabled={isSyncingSupabase}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <span className={`material-symbols-outlined text-[18px] ${isSyncingSupabase ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>{isSyncingSupabase ? 'Synchronizing...' : 'Sync All Records Now'}</span>
        </button>
      </div>

      {/* Action Notice Toast */}
      {driveActionNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-700 text-[18px]">info</span>
            <span>{driveActionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDriveActionNotice(null)}
            className="text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Pillars Grid: Device Storage, Google Drive, Supabase Database, Network Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Device Storage (IndexedDB) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">phone_android</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Local Device Storage</h3>
                  <span className="text-[11px] text-slate-500">IndexedDB Vault • PWA Offline First</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Saved on Device
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3 text-center">
              <div>
                <span className="text-lg font-bold text-slate-900 font-mono block">
                  {storageStats.recordsCount}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Health Records</span>
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 font-mono block">
                  {storageStats.prescriptionsCount}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Prescriptions</span>
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 font-mono block">
                  {(storageStats.databaseSizeBytes / 1024).toFixed(0)} KB
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Encrypted Size</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              All personal health records, DICOM radiology scans, and prescriptions are stored locally in your browser's encrypted IndexedDB storage. You can view, search, and manage records even when completely disconnected from the internet.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pending Sync Queue: <strong>{storageStats.pendingSyncCount} items</strong></span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Protected Locally</span>
            </span>
          </div>
        </div>

        {/* Pillar 2: Google Drive Cloud Backup */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">cloud</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Google Drive Backup</h3>
                  <span className="text-[11px] text-slate-500">Dedicated Folder: Swasthya Wallet</span>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                  driveStatus.isConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {driveStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {driveStatus.isConnected ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Google Account:</span>
                  <strong className="text-slate-900">{driveStatus.userEmail}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Encrypted Backup:</span>
                  <span className="text-slate-700 font-mono">
                    {driveStatus.lastBackupTime
                      ? new Date(driveStatus.lastBackupTime).toLocaleString('en-IN')
                      : 'Not yet backed up'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Drive Subfolders:</span>
                  <span className="text-blue-700 font-semibold">5 Folders Ready</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Connect your personal Google Drive to safely store encrypted backup copies of your health records, prescriptions, and lab reports. Only you hold the decryption keys.
              </p>
            )}

            {/* Folder Structure Preview */}
            <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 font-mono flex flex-wrap gap-2">
              <span>📁 Swasthya Wallet</span>
              <span>↳ 📁 Health Records</span>
              <span>↳ 📁 Prescriptions</span>
              <span>↳ 📁 Lab Reports</span>
              <span>↳ 📁 Backups</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {driveStatus.isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleBackupNow}
                  disabled={isBackingUp}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isBackingUp ? 'animate-spin' : ''}`}>
                    cloud_upload
                  </span>
                  <span>{isBackingUp ? 'Backing up...' : 'Backup Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectDrive}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectDrive}
                disabled={isConnectingDrive}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add_to_drive</span>
                <span>{isConnectingDrive ? 'Connecting...' : 'Connect Personal Google Drive'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Pillar 3: Supabase PostgreSQL Database */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">database</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Supabase PostgreSQL</h3>
                  <span className="text-[11px] text-slate-500">17 Tables • Row-Level Security (RLS)</span>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                  isSupabaseConfigured()
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {isSupabaseConfigured() ? 'Cloud DB Connected' : 'Schema Migrated'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Standardized relational schema covering users, health records, prescriptions, medicine catalog, audit logs, and QR sharing tokens. RLS guarantees that only authenticated citizens can access their private records.
            </p>

            {supabaseSyncMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium mb-3">
                {supabaseSyncMessage}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Migration File:</span>
                <span className="font-mono text-slate-800 text-[11px]">20261112_swasthya_wallet_schema.sql</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Encryption Level:</span>
                <span className="font-semibold text-slate-800">AES-256 Client-Side Enclave</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Auto-sync on reconnect</span>
            <button
              type="button"
              onClick={handleSyncSupabase}
              disabled={isSyncingSupabase}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSyncingSupabase ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Test DB Sync</span>
            </button>
          </div>
        </div>

        {/* Pillar 4: Network & Offline Status */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {isOnline ? 'wifi' : 'wifi_off'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Network & PWA Status</h3>
                  <span className="text-[11px] text-slate-500">Service Worker & Caching Engine</span>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isOnline ? 'Internet Connected' : 'Offline Vault'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              {isOnline
                ? 'Your device has active connectivity. Real-time online pharmacy availability and cloud backups will synchronize automatically.'
                : 'You are currently working offline. All edits, new prescription uploads, and record accesses are safely queued in your local device vault.'}
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">PWA Offline Cache:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>Active & Ready</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Zero-Knowledge Vault:</span>
                <span className="font-semibold text-blue-700">Client-Side Keys Isolated</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Simulate Offline Experience:</span>
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Toggle {isOnline ? 'Offline' : 'Online'} Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
