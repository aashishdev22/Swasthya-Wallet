/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PatientProfile, MedicalRecord } from '../data/mockData.ts';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n.ts';
import {
  getDriveStatus,
  connectGoogleDrive,
  disconnectGoogleDrive,
  listDriveBackups,
  restoreFromDrive,
  DriveStatus,
} from '../utils/googleDrive.ts';
import { syncEngine, SyncStatusInfo } from '../utils/syncEngine.ts';
import { localVaultDB, LocalStorageStats } from '../utils/indexedDb.ts';

interface SettingsViewProps {
  patient: PatientProfile;
  allRecords?: MedicalRecord[];
  onRestoreRecords?: (restored: MedicalRecord[]) => void;
  biometricUnlockEnabled?: boolean;
  onToggleBiometricUnlock?: (enabled: boolean) => void;
  onTestBiometricChallenge?: () => void;
  currentLang?: SupportedLanguage;
  onSelectLang?: (lang: SupportedLanguage) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  patient,
  allRecords = [],
  onRestoreRecords,
  biometricUnlockEnabled: controlledBiometric,
  onToggleBiometricUnlock,
  onTestBiometricChallenge,
  currentLang = 'en',
  onSelectLang,
}) => {
  const [localBiometric, setLocalBiometric] = useState(false);
  const biometricUnlockEnabled = controlledBiometric !== undefined ? controlledBiometric : localBiometric;
  const t = getTranslation(currentLang);

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [autoSyncAbha, setAutoSyncAbha] = useState(true);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>(() => getDriveStatus());
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(() => syncEngine.getStatus());
  const [storageStats, setStorageStats] = useState<LocalStorageStats | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [isDriveBusy, setIsDriveBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localVaultDB.getStorageStats().then((stats) => setStorageStats(stats));
    const unsub = syncEngine.subscribe((info) => {
      setSyncStatus(info);
      setDriveStatus(getDriveStatus());
      if (info.localStorageStats) {
        setStorageStats(info.localStorageStats);
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(t.success + ': ' + t.settingsTitle);
  };

  const handleConnectDrive = async () => {
    setDriveError(null);
    setIsDriveBusy(true);
    try {
      const res = await connectGoogleDrive();
      setDriveStatus(getDriveStatus());
      showToast(`Connected to Google Drive as ${res.user.email}`);
      await syncEngine.processPendingQueue(patient.name);
    } catch (err: any) {
      setDriveStatus(getDriveStatus());
      const msg = err?.message || 'Google Drive authorization was cancelled or failed. Storage remains DISCONNECTED.';
      setDriveError(msg);
      showToast('Google Drive connection failed. Local storage remains active.');
    } finally {
      setIsDriveBusy(false);
    }
  };

  const handleManualBackup = async () => {
    setDriveError(null);
    setIsDriveBusy(true);
    const ok = await syncEngine.triggerManualSync(allRecords, patient.name);
    setIsDriveBusy(false);
    setDriveStatus(getDriveStatus());
    if (ok) {
      showToast('Encrypted backup uploaded and verified in Google Drive.');
    } else {
      const errMsg = syncEngine.getStatus().errorMessage || 'Google Drive backup could not be completed.';
      setDriveError(errMsg);
      showToast(errMsg);
    }
  };

  const handleRestoreFromDrive = async () => {
    setDriveError(null);
    setIsDriveBusy(true);
    try {
      const backups = await listDriveBackups();
      if (backups.length === 0) {
        setDriveError('No encrypted Swasthya Wallet backups found in your Google Drive folder.');
        showToast('No backups found in Google Drive.');
        return;
      }
      const latest = backups[0];
      const restored = await restoreFromDrive(latest.id, patient.name);
      if (!restored.success || !restored.data) {
        throw new Error(restored.error || 'Could not decrypt or restore backup.');
      }
      for (const rec of restored.data) {
        await localVaultDB.saveHealthRecord(rec, 'synced');
      }
      if (onRestoreRecords) {
        onRestoreRecords(restored.data);
      }
      const stats = await localVaultDB.getStorageStats();
      setStorageStats(stats);
      showToast(`Restored ${restored.data.length} encrypted record(s) from Google Drive.`);
    } catch (err: any) {
      const msg = err?.message || 'Restore from Google Drive failed.';
      setDriveError(msg);
      showToast(msg);
    } finally {
      setIsDriveBusy(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-800 text-[22px]">tune</span>
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            {t.settingsTitle}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{t.settingsTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {t.settingsSubtitle}
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Section 1: 12 Indian Languages Preference */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-800">translate</span>
              <span className="font-bold text-sm text-slate-900">{t.languageSection}</span>
            </div>
            <span className="text-[11px] bg-blue-50 text-blue-900 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full">
              12 Official Indian Languages
            </span>
          </div>

          <p className="text-slate-500 text-xs">
            Choose your preferred language. The entire application will update instantly and save your choice.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    if (onSelectLang) {
                      onSelectLang(lang.code);
                    }
                    showToast(`Language changed to ${lang.nativeName} (${lang.name})`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{lang.nativeName}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <span className={`text-[11px] mt-1 ${isSelected ? 'text-blue-800 font-medium' : 'text-slate-500'}`}>
                    {lang.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Biometric Hardware Authentication */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-800">fingerprint</span>
              <span className="font-bold text-sm text-slate-900">{t.biometricSection}</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                biometricUnlockEnabled
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {biometricUnlockEnabled ? t.biometricEnforced : t.biometricOptional}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-start gap-3 min-w-0 pr-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  biometricUnlockEnabled
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">fingerprint</span>
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                  {t.biometricToggleLabel}
                </span>
                <span className="text-slate-500 text-xs mt-0.5 block leading-relaxed">
                  {t.biometricToggleDesc}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="biometric-unlock-toggle"
              role="switch"
              aria-checked={biometricUnlockEnabled}
              onClick={() => {
                const nextVal = !biometricUnlockEnabled;
                if (onToggleBiometricUnlock) {
                  onToggleBiometricUnlock(nextVal);
                } else {
                  setLocalBiometric(nextVal);
                }
                showToast(`Biometric Unlock requirement ${nextVal ? 'enabled' : 'disabled'}`);
              }}
              className={`w-12 h-6 rounded-full relative transition-colors p-0.5 shrink-0 cursor-pointer ${
                biometricUnlockEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                  biometricUnlockEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {biometricUnlockEnabled && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 animate-fadeIn">
              <span className="text-[11px] text-blue-900 uppercase font-bold tracking-wider">
                Active Enclave Protection Scopes
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">Prompt Biometric on Application Launch</span>
                  <span className="text-slate-500 text-[11px]">
                    Locks session whenever the application re-opens or switches identity
                  </span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                  REQUIRED
                </span>
              </div>

              <div className="h-px bg-blue-100"></div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">Decryption of Sensitive Health Records</span>
                  <span className="text-slate-500 text-[11px]">
                    Requires hardware biometric attestation before decrypting lab tests or DICOM studies
                  </span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                  REQUIRED
                </span>
              </div>

              {onTestBiometricChallenge && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onTestBiometricChallenge}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>{t.testBiometric}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Ayushman Bharat Health Account (ABHA) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-700">id_card</span>
              <span className="font-bold text-sm text-slate-900">{t.abhaSection}</span>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full">
              ACTIVE & LINKED
            </span>
          </div>

          <p className="text-slate-500 text-xs">
            {t.abhaDesc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-[11px] text-slate-500 block">ABHA Number</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">{patient.synthMrn}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Linked Health Facility</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">AIIMS New Delhi</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <div>
              <span className="font-semibold text-slate-900 block">Automatic Record Sync across Indian Hospitals</span>
              <span className="text-slate-500 text-[11px]">Sync blood tests and discharge summaries automatically</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoSyncAbha(!autoSyncAbha)}
              className={`w-11 h-6 rounded-full relative transition-colors p-0.5 shrink-0 cursor-pointer ${
                autoSyncAbha ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                  autoSyncAbha ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>
        </div>

        {/* Section 4: Notifications (SMS & WhatsApp) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-800">notifications</span>
              <span className="font-bold text-sm text-slate-900">{t.notificationPreferences}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <div>
              <span className="font-semibold text-slate-900 block">{t.smsAlerts}</span>
              <span className="text-slate-500 text-[11px]">Receive test results and visit reminders via SMS</span>
            </div>
            <button
              type="button"
              onClick={() => setSmsAlerts(!smsAlerts)}
              className={`w-11 h-6 rounded-full relative transition-colors p-0.5 shrink-0 cursor-pointer ${
                smsAlerts ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                  smsAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <div>
              <span className="font-semibold text-slate-900 block">{t.whatsappAlerts}</span>
              <span className="text-slate-500 text-[11px]">Receive PDF reports and appointment updates on WhatsApp</span>
            </div>
            <button
              type="button"
              onClick={() => setWhatsappAlerts(!whatsappAlerts)}
              className={`w-11 h-6 rounded-full relative transition-colors p-0.5 shrink-0 cursor-pointer ${
                whatsappAlerts ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                  whatsappAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>
        </div>

        {/* Section 5: Device Storage & Google Drive Cloud Backup */}
        <div id="storage-settings" className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-900">cloud_sync</span>
              <span className="font-bold text-sm text-slate-900">Storage & Cloud Backup Settings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                syncStatus.state === 'Synced'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : syncStatus.state === 'Sync Failed'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : syncStatus.state === 'Sync Pending'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}>
                {syncStatus.state} {syncStatus.pendingCount > 0 ? `(${syncStatus.pendingCount} queued)` : ''}
              </span>
            </div>
          </div>

          <p className="text-slate-500 text-xs">
            Swasthya Wallet automatically stores your medical records on your mobile device (offline encrypted IndexedDB) and synchronizes automatically in the background once Google Drive is authorized.
          </p>

          {driveError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">error</span>
              <span>{driveError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Column A: Device Storage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-blue-800 text-[18px]">smartphone</span>
                    <span>Device Storage (IndexedDB Vault)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    ACTIVE
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage Usage:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {storageStats ? `${(storageStats.databaseSizeBytes / (1024 * 1024)).toFixed(2)} MB` : '0.00 MB'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Locally Saved Records:</span>
                    <span className="font-semibold text-slate-800">
                      {storageStats ? storageStats.recordsCount : allRecords.length} records
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Connectivity:</span>
                    <span className={`font-medium ${syncStatus.isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {syncStatus.isOnline ? 'Online (Background Queue Ready)' : 'Offline (Queued Locally)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Local Storage Status:</span>
                    <span className="text-emerald-700 font-medium">Encrypted & Available Offline</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-400">
                  Zero-Knowledge AES-GCM Encrypted on your physical device.
                </span>
              </div>
            </div>

            {/* Column B: Google Drive */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <span className="material-symbols-outlined text-emerald-700 text-[18px]">add_to_drive</span>
                    <span>Google Drive Cloud Backup</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      driveStatus.isConnected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {driveStatus.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Authorized Drive Account:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[170px]">
                      {driveStatus.isConnected && driveStatus.userEmail
                        ? driveStatus.userEmail
                        : driveStatus.signedInGoogleEmail
                        ? `${driveStatus.signedInGoogleEmail} (Drive scope pending)`
                        : 'Not connected'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Connection Status:</span>
                    <span className="font-medium text-slate-800 text-right">
                      {driveStatus.isConnected ? 'Auto-Sync Active (Swasthya Wallet Folder)' : 'Authorization required'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Last Successful Backup:</span>
                    <span className="font-mono text-slate-800">
                      {driveStatus.lastBackupTime
                        ? new Date(driveStatus.lastBackupTime).toLocaleString('en-IN')
                        : 'Not backed up yet'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Connect / Back Up / Restore / Disconnect */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                {driveStatus.isConnected ? (
                  <>
                    <button
                      type="button"
                      disabled={isDriveBusy}
                      onClick={handleManualBackup}
                      className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isDriveBusy ? 'Syncing...' : 'Back Up Now'}
                    </button>
                    <button
                      type="button"
                      disabled={isDriveBusy}
                      onClick={handleRestoreFromDrive}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Restore from Drive
                    </button>
                    <button
                      type="button"
                      disabled={isDriveBusy}
                      onClick={async () => {
                        await disconnectGoogleDrive();
                        setDriveStatus(getDriveStatus());
                        showToast('Google Drive disconnected.');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isDriveBusy}
                    onClick={handleConnectDrive}
                    className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isDriveBusy ? 'Authorizing...' : 'Connect Personal Google Drive'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer min-h-[44px]"
          >
            {t.save}
          </button>
        </div>
      </form>
    </div>
  );
};
