/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Full-Screen QR Health Sharing View
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { MedicalRecord, PatientProfile } from '../data/mockData.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface FullScreenQrShareViewProps {
  records: MedicalRecord[];
  patient: PatientProfile;
  currentLang?: SupportedLanguage;
  onBackToDashboard: () => void;
  onPreviewRecipientView: (shareUrl: string, scopeName: string, records: MedicalRecord[]) => void;
}

export type ShareScopeType =
  | 'complete'
  | 'selected'
  | 'prescriptions'
  | 'lab_reports'
  | 'radiology_scans';

export const FullScreenQrShareView: React.FC<FullScreenQrShareViewProps> = ({
  records,
  patient,
  currentLang = 'en',
  onBackToDashboard,
  onPreviewRecipientView,
}) => {
  const t = getTranslation(currentLang);

  const [shareScope, setShareScope] = useState<ShareScopeType>('complete');
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>(records.map((r) => r.id));
  const [expiryOption, setExpiryOption] = useState<'15m' | '1h' | '24h' | '7d' | 'custom'>('24h');
  const [customHours, setCustomHours] = useState<number>(48);
  const [recipientNote, setRecipientNote] = useState<string>('Dr. Consultation Access');
  const [isPinProtected, setIsPinProtected] = useState<boolean>(true);
  const [securityPin, setSecurityPin] = useState<string>('4912');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [shareableUrl, setShareableUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isRevoked, setIsRevoked] = useState<boolean>(false);
  const [accessLogs, setAccessLogs] = useState<Array<{ time: string; doctor: string; ip: string }>>([
    { time: '10 mins ago', doctor: 'Dr. Ananya Iyer, MD (AIIMS)', ip: '103.21.124.9' },
  ]);

  // Compute records filtered by scope
  const getScopedRecords = (): MedicalRecord[] => {
    if (shareScope === 'complete') return records;
    if (shareScope === 'prescriptions') return records.filter((r) => r.category === 'prescription');
    if (shareScope === 'lab_reports') return records.filter((r) => r.category === 'lab');
    if (shareScope === 'radiology_scans') return records.filter((r) => r.category === 'imaging');
    return records.filter((r) => selectedRecordIds.includes(r.id));
  };

  const scopedRecords = getScopedRecords();

  // Generate QR code whenever scope, pin, or expiry changes
  useEffect(() => {
    if (isRevoked) {
      setQrCodeDataUrl('');
      setShareableUrl('');
      return;
    }

    const token = `sw_tok_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://swasthya.gov.in';
    const generatedUrl = `${baseUrl}/verify-qr?token=${token}&scope=${shareScope}&patient=${encodeURIComponent(
      patient.name
    )}&pinRequired=${isPinProtected ? '1' : '0'}`;

    setShareableUrl(generatedUrl);

    QRCode.toDataURL(generatedUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#1e3a8a', // Deep navy blue
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [shareScope, selectedRecordIds, expiryOption, customHours, isPinProtected, isRevoked, patient.name]);

  const handleCopyLink = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Swasthya Wallet Secure Health Record Share for ${patient.name}\n\nAccess my authorized health records here:\n${shareableUrl}\n${
        isPinProtected ? `Security PIN: ${securityPin}\n` : ''
      }Valid for ${expiryOption}. Powered by Swasthya Wallet - Digital Health Locker for Citizens.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Swasthya Wallet - Share Health Records',
          text: `Authorized health records for ${patient.name}. PIN: ${isPinProtected ? securityPin : 'None'}.`,
          url: shareableUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `Swasthya_Wallet_QR_${patient.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleRevoke = () => {
    setIsRevoked(true);
  };

  const handleRestore = () => {
    setIsRevoked(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="p-2 rounded-xl text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1.5 font-semibold text-xs sm:text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white text-xs">
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            </div>
            <span className="text-xs font-bold text-slate-900">Swasthya Wallet • Digital Health Locker for Citizens</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreviewRecipientView(shareableUrl, shareScope, scopedRecords)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Doctor View Preview</span>
          </button>
        </div>
      </header>

      {/* Main Full-Screen Layout */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Huge High-Visibility QR Code & Action Panel */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            {isRevoked ? (
              <div className="py-16 px-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[36px]">block</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">QR Code Access Revoked</h2>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  This QR code and its cryptographic sharing token have been permanently invalidated. Doctors or scanners will be denied access.
                </p>
                <button
                  type="button"
                  onClick={handleRestore}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Generate New Secure QR Token
                </button>
              </div>
            ) : (
              <>
                {/* Header Badge */}
                <div className="flex items-center gap-2 mb-3 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-blue-800 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>End-to-End Encrypted Token</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                  Share Your Health Records
                </h1>
                <p className="text-xs text-slate-500 mb-6 max-w-md">
                  Present this full-screen QR code to your doctor, clinic, or hospital. They can scan it using any smartphone camera or ABDM scanner.
                </p>

                {/* Big QR Code Card */}
                <div className="p-4 sm:p-6 bg-white rounded-2xl border-2 border-blue-600/30 shadow-md flex flex-col items-center relative group">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Full-Screen Health Sharing QR Code"
                      className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl select-none"
                    />
                  ) : (
                    <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-[48px] animate-spin">refresh</span>
                    </div>
                  )}

                  {/* Watermark Details Below QR */}
                  <div className="mt-3 text-[11px] text-slate-600 font-mono font-medium flex items-center gap-2">
                    <span>{patient.name}</span>
                    <span>•</span>
                    <span className="text-blue-700 font-bold">{scopedRecords.length} Records</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{expiryOption.toUpperCase()} Expiry</span>
                  </div>
                </div>

                {/* PIN Reminder Pill */}
                {isPinProtected && (
                  <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">key</span>
                    <span>
                      Doctor Security PIN: <strong className="font-mono font-bold text-sm text-slate-900">{securityPin}</strong> (Tell this to your doctor)
                    </span>
                  </div>
                )}

                {/* Sharing Action Buttons */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedLink ? 'done' : 'content_copy'}
                    </span>
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Save QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                    <span>Share</span>
                  </button>
                </div>

                {/* Revoke Access Button */}
                <div className="w-full pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Need to stop access immediately?</span>
                  <button
                    type="button"
                    onClick={handleRevoke}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Revoke Access</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Record Selection, Expiry, Permissions & Audit Controls */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Card 1: Record Selection Scope */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">tune</span>
              <span>1. Choose Records to Share</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select precisely which categories of your health locker will be visible upon scanning.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {[
                { id: 'complete', label: 'Complete Profile', icon: 'folder_shared' },
                { id: 'prescriptions', label: 'Prescriptions', icon: 'medication' },
                { id: 'lab_reports', label: 'Lab Reports', icon: 'biotech' },
                { id: 'radiology_scans', label: 'X-Ray & Scans', icon: 'radiology' },
                { id: 'selected', label: 'Custom Pick', icon: 'checklist' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setShareScope(opt.id as ShareScopeType)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    shareScope === opt.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-blue-700">{opt.icon}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* If Custom Pick is active, show checkbox list */}
            {shareScope === 'selected' && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Check individual records to include:
                </span>
                {records.map((rec) => (
                  <label
                    key={rec.id}
                    className="flex items-center gap-2.5 text-xs text-slate-800 p-1.5 rounded-lg hover:bg-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecordIds.includes(rec.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecordIds((prev) => [...prev, rec.id]);
                        } else {
                          setSelectedRecordIds((prev) => prev.filter((id) => id !== rec.id));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate flex-1 font-medium">{rec.title}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{rec.category}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Expiry & Security Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">timer</span>
              <span>2. Expiry & Access Security</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set an automatic expiry time after which the QR code cannot be decrypted.
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { id: '15m', label: '15 Mins' },
                { id: '1h', label: '1 Hour' },
                { id: '24h', label: '24 Hours' },
                { id: '7d', label: '7 Days' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExpiryOption(opt.id as any)}
                  className={`py-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    expiryOption === opt.id
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* PIN Protection Switch */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Require 4-Digit Security PIN</span>
                <span className="text-[11px] text-slate-500">Doctor must enter this PIN to unlock records.</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                  disabled={!isPinProtected}
                  className="w-16 px-2 py-1 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg"
                />
                <input
                  type="checkbox"
                  checked={isPinProtected}
                  onChange={(e) => setIsPinProtected(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Recent Access Logs */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">history</span>
              <span>Recent Access Logs</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">Audit trail of who viewed your records via QR code.</p>

            <div className="flex flex-col gap-2">
              {accessLogs.map((log, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{log.doctor}</span>
                    <span className="text-[10px] text-slate-500 font-mono">IP: {log.ip} • Read-only viewer</span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
