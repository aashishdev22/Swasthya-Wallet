/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ActiveDelegation,
  AuditEvent,
  MedicalRecord,
  PatientProfile,
  initialMedicalRecords,
  initialPatient,
} from '../data/mockData.ts';
import {
  calculateShareScopeSummary,
  generateEncryptedQrPayload,
  verifyDoctorQrPayload,
  EncryptedQrRecordPayload,
} from '../utils/crypto.ts';
import { SupportedLanguage, getTranslation, formatIndianDate, formatIndianTime } from '../utils/i18n.ts';

interface SecureSharingViewProps {
  delegations: ActiveDelegation[];
  auditLogs: AuditEvent[];
  onRevokeDelegation: (id: string) => void;
  onAddDelegation: (delegation: ActiveDelegation) => void;
  currentLang?: SupportedLanguage;
  records?: MedicalRecord[];
  patient?: PatientProfile;
  onAddAuditLog?: (log: AuditEvent) => void;
  initialRecordId?: string;
}

export const SecureSharingView: React.FC<SecureSharingViewProps> = ({
  delegations,
  auditLogs,
  onRevokeDelegation,
  onAddDelegation,
  currentLang = 'en',
  records = initialMedicalRecords,
  patient = initialPatient,
  onAddAuditLog,
  initialRecordId,
}) => {
  const t = getTranslation(currentLang);

  // Top Mode: 'qr' (Share specific record via temporary encrypted QR) vs 'token' (FHIR token delegation)
  const [sharingMode, setSharingMode] = useState<'qr' | 'token'>('qr');

  // --- SHARE VIA QR STATE ---
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialRecordId || records[0]?.id || 'rec-1'
  );
  const [qrTtlMinutes, setQrTtlMinutes] = useState<number>(15);
  const [qrPin, setQrPin] = useState<string>('584920');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<EncryptedQrRecordPayload | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isQrActive, setIsQrActive] = useState<boolean>(false);
  const [isQrGenerating, setIsQrGenerating] = useState<boolean>(false);

  // Doctor Verification Simulator State
  const [isDoctorSimulatorOpen, setIsDoctorSimulatorOpen] = useState<boolean>(false);
  const [doctorSimStep, setDoctorSimStep] = useState<'scan' | 'verifying' | 'result'>('scan');
  const [doctorEnteredPin, setDoctorEnteredPin] = useState<string>('');
  const [doctorVerificationResult, setDoctorVerificationResult] = useState<{
    valid: boolean;
    error?: string;
    status: string;
    recordDetails?: EncryptedQrRecordPayload;
  } | null>(null);

  // --- EXISTING MULTI-RECORD DELEGATION WIZARD STATE ---
  const [recipient, setRecipient] = useState<string>('rajesh-sharma');
  const [purpose, setPurpose] = useState<string>('Doctor Consultation & Second Opinion');
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>(['rec-1', 'rec-2']);
  const [duration, setDuration] = useState<string>('1h');
  const [webAuthnRequired, setWebAuthnRequired] = useState<boolean>(true);
  const [oneTimeRead, setOneTimeRead] = useState<boolean>(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTokenModal, setGeneratedTokenModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  // Auto-generate initial QR code on mount for immediate out-of-the-box readiness
  useEffect(() => {
    if (!qrDataUrl && selectedRecord) {
      handleGenerateQr(initialRecordId || selectedRecord.id);
    }
  }, []);

  useEffect(() => {
    if (initialRecordId && initialRecordId !== selectedRecordId) {
      setSelectedRecordId(initialRecordId);
      handleGenerateQr(initialRecordId);
    }
  }, [initialRecordId]);

  // Live countdown timer for temporary QR
  useEffect(() => {
    if (!isQrActive || !qrExpiresAt) return;

    const tick = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((qrExpiresAt.getTime() - now) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) {
        setIsQrActive(false);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isQrActive, qrExpiresAt]);

  // Format countdown mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate Encrypted QR code for specific record
  const handleGenerateQr = async (targetRecId?: string, overrideTtl?: number) => {
    const recId = targetRecId || selectedRecordId;
    const rec = records.find((r) => r.id === recId) || records[0];
    if (!rec) return;

    setSelectedRecordId(rec.id);
    setIsQrGenerating(true);

    const ttl = overrideTtl || qrTtlMinutes;
    // Generate fresh 6-digit verification PIN
    const generatedPin = String(Math.floor(100000 + Math.random() * 900000));
    setQrPin(generatedPin);
    setDoctorEnteredPin(generatedPin); // pre-populate simulator for convenience

    const { payload, qrPayloadString, expiresAt, ttlSeconds } = generateEncryptedQrPayload({
      record: rec,
      patientName: patient?.name || 'Aarav Sharma',
      abhaId: patient?.synthMrn || '14-8842-9914-2024',
      ttlMinutes: ttl,
      pin: generatedPin,
      oneTimeRead: true,
    });

    try {
      const dataUrl = await QRCode.toDataURL(qrPayloadString, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      setQrDataUrl(dataUrl);
      setQrPayload(payload);
      setQrExpiresAt(new Date(expiresAt));
      setSecondsRemaining(ttlSeconds);
      setIsQrActive(true);
      showToast(`Temporary encrypted QR generated for ${rec.title}. Valid for ${ttl} mins.`);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      showToast('Error generating QR code representation.');
    } finally {
      setIsQrGenerating(false);
    }
  };

  // Immediate Revoke of Active QR
  const handleRevokeQr = () => {
    setIsQrActive(false);
    setSecondsRemaining(0);
    setQrExpiresAt(null);
    showToast('Temporary QR code revoked immediately. Token invalidated.');
  };

  // Open Doctor Simulator
  const handleOpenDoctorSimulator = () => {
    if (!qrPayload) return;
    setDoctorSimStep('scan');
    setDoctorEnteredPin(qrPin);
    setDoctorVerificationResult(null);
    setIsDoctorSimulatorOpen(true);
  };

  // Execute Doctor Simulator Verification
  const handleExecuteDoctorVerification = () => {
    if (!qrPayload) return;
    setDoctorSimStep('verifying');

    setTimeout(() => {
      const result = verifyDoctorQrPayload(qrPayload, doctorEnteredPin);
      setDoctorVerificationResult(result);
      setDoctorSimStep('result');

      if (result.valid) {
        // Record audit event in ledger
        const newLog: AuditEvent = {
          id: `audit-qr-${Date.now()}`,
          title: `Temporary QR Verified: ${qrPayload.recordTitle}`,
          timestamp: new Date().toISOString(),
          actor: 'Dr. Rajesh Sharma, MD (Apollo Hospital)',
          clientIp: '198.51.100.24 (Apollo Clinical Gateway)',
          statusCode: 'SUCCESS_200',
          details: `Doctor scanned encrypted QR code #${qrPayload.sessionToken}. PIN verified. AES-256 payload decrypted.`,
          sigVerified: true,
          nonce: qrPayload.encryption.nonce,
        };
        if (onAddAuditLog) {
          onAddAuditLog(newLog);
        }
      }
    }, 900);
  };

  // Download QR code image as PNG pass
  const handleDownloadQrImage = () => {
    if (!qrDataUrl || !selectedRecord) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Swasthya_QR_${selectedRecord.code.replace(/\s+/g, '_')}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR Code pass image saved to downloads.');
  };

  // Copy Verification URL
  const handleCopyVerificationUrl = () => {
    if (!qrPayload) return;
    navigator.clipboard?.writeText(qrPayload.verificationUrl);
    showToast('Verification endpoint copied to clipboard.');
  };

  // Multi-record delegation wizard helpers
  const handleToggleRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const recipientNames: Record<string, string> = {
    'rajesh-sharma': 'Dr. Rajesh Sharma, MD (Apollo Hospital)',
    'ananya-iyer': 'Dr. Ananya Iyer, MD (Max Healthcare)',
    'lal-pathlabs': 'Dr. Lal PathLabs Diagnostic Intake',
    'family-member': 'Priya Sharma (Family Caregiver)',
  };

  const durationLabels: Record<string, string> = {
    '1h': t.oneHour,
    '24h': t.twentyFourHours,
    '7d': t.sevenDays,
    '30d': t.thirtyDays,
    custom: 'Custom Window',
  };

  const handleIssueToken = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedTokenModal(true);

      const targetName = recipientNames[recipient] || 'Dr. Rajesh Sharma, MD';
      const newDel: ActiveDelegation = {
        id: `del-${Date.now()}`,
        recipientName: targetName,
        facility: 'Apollo Hospitals New Delhi • Outpatient Session',
        initials: targetName.slice(0, 2).toUpperCase(),
        expiresIn: duration === '1h' ? '59m' : duration === '24h' ? '23h' : '6d',
        expiresDate: duration === '1h' ? 'Today in 1 Hour' : 'Scheduled Window',
        scopesSummary: `${selectedRecordIds.length} SCOPED RECORDS`,
        tokenCode: `TK-${Math.floor(1000 + Math.random() * 9000)}-AUTH`,
        tokenHash:
          '0x' +
          Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('') +
          '-SMART-R4',
        purpose,
      };
      onAddDelegation(newDel);
    }, 800);
  };

  const handleRevoke = (id: string, name: string) => {
    if (
      confirm(
        `Revoke access immediately for ${name}? The cryptographic token will be invalidated across all FHIR endpoints.`
      )
    ) {
      onRevokeDelegation(id);
      showToast(`Access permanently revoked for ${name}.`);
    }
  };

  const selectedRecordNames = records
    .filter((r) => selectedRecordIds.includes(r.id))
    .map((r) => r.title);

  const consentSummary = calculateShareScopeSummary(
    selectedRecordNames,
    recipientNames[recipient] || 'Authorized Clinician',
    durationLabels[duration] || '1 Hour'
  );

  return (
    <div className="flex flex-col w-full gap-5 pb-8">
      {/* Top Protocol Header */}
      <div className="rounded-xl bg-slate-900 text-white p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[20px]">qr_code_2</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-wider">
                ABHA DIGITAL TRUST ENCLAVE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                AES-256-GCM + ED25519
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Generate temporary, encrypted QR passes for in-clinic doctor verification. Auto-expires with PIN protection.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSharingMode('qr')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              sharingMode === 'qr'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            <span>Share via QR</span>
          </button>
          <button
            type="button"
            onClick={() => setSharingMode('token')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              sharingMode === 'token'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>FHIR Consent Token</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Share via Temporary Encrypted QR */}
      {sharingMode === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Record Selection & Security Options (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Step 1: Select Specific Record */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Select Specific Medical Record to Share</h2>
                    <p className="text-xs text-slate-500">
                      Choose exactly one diagnostic test, scan, or prescription for doctor verification.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                  SINGLE-RECORD LEAST PRIVILEGE
                </span>
              </div>

              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                {records.map((rec) => {
                  const isSelected = rec.id === selectedRecordId;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecordId(rec.id);
                        handleGenerateQr(rec.id);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition-all border flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                          : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="pt-0.5">
                        <input
                          type="radio"
                          name="specific-record"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedRecordId(rec.id);
                            handleGenerateQr(rec.id);
                          }}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {rec.title}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {rec.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                          <span className="font-medium text-slate-800">{rec.hospital}</span>
                          <span>•</span>
                          <span>{rec.clinician}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">{formatIndianDate(rec.date)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            <span>Tamper-Proof & Genuine</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-400 truncate">
                            SHA: {rec.sha256 ? rec.sha256.slice(0, 10) + '...' : 'Verified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Time-To-Live (TTL) & Security Safeguards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Temporary Validity Window & Security PIN</h2>
                    <p className="text-xs text-slate-500">The QR code automatically becomes unreadable when this time expires.</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                  AUTO-EXPIRING
                </span>
              </div>

              {/* TTL Options */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Choose Temporary Validity Duration:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { mins: 15, label: '15 Minutes', sub: 'In-Clinic Consult' },
                    { mins: 30, label: '30 Minutes', sub: 'Doctor Review' },
                    { mins: 60, label: '1 Hour', sub: 'Hospital Visit' },
                    { mins: 1440, label: '24 Hours', sub: 'Full Day Care' },
                  ].map((option) => (
                    <button
                      key={option.mins}
                      type="button"
                      onClick={() => {
                        setQrTtlMinutes(option.mins);
                        handleGenerateQr(selectedRecordId, option.mins);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        qrTtlMinutes === option.mins
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-xs">{option.label}</div>
                      <div
                        className={`text-[10px] ${
                          qrTtlMinutes === option.mins ? 'text-emerald-100' : 'text-slate-500'
                        }`}
                      >
                        {option.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2-Factor Doctor Verification PIN */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">pin</span>
                    <span>Two-Factor Doctor Verification PIN:</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Your doctor must enter or confirm this PIN to decrypt and verify the record.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-base tracking-widest text-emerald-700 shadow-xs">
                    {qrPin.slice(0, 3)} {qrPin.slice(3, 6)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateQr(selectedRecordId)}
                    title="Generate New PIN"
                    className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                  </button>
                </div>
              </div>

              {/* Regenerate Button */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleGenerateQr(selectedRecordId)}
                  disabled={isQrGenerating}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isQrGenerating ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      <span>Minting Encrypted QR...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">sync</span>
                      <span>Regenerate Fresh Encrypted QR</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeQr}
                  disabled={!isQrActive}
                  className="px-4 h-11 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  <span>Revoke QR Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Encrypted QR Code Card & Live Verification Terminal (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col items-center">
              {/* Header Badge & Timer */}
              <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">lock</span>
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Encrypted QR Pass
                  </span>
                </div>
                {isQrActive ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>VALID: {formatCountdown(secondsRemaining)}</span>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-mono font-bold">
                    EXPIRED / REVOKED
                  </span>
                )}
              </div>

              {/* Progress bar for time remaining */}
              {isQrActive && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(100, Math.max(0, (secondsRemaining / (qrTtlMinutes * 60)) * 100))}%`,
                    }}
                  ></div>
                </div>
              )}

              {/* Target Record Info Strip */}
              <div className="w-full p-2.5 mb-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                  RECORD AUTHORIZED FOR VERIFICATION
                </div>
                <div className="font-bold text-xs text-slate-900 truncate mt-0.5">
                  {selectedRecord?.title}
                </div>
                <div className="text-[11px] text-slate-600 truncate">
                  {selectedRecord?.hospital} • {selectedRecord?.clinician}
                </div>
              </div>

              {/* The QR Code Graphic Presentation */}
              <div className="relative p-4 rounded-2xl bg-white border-2 border-slate-800 shadow-md flex items-center justify-center">
                {qrDataUrl ? (
                  <div className="relative">
                    <img
                      src={qrDataUrl}
                      alt="Encrypted Medical Record QR Code"
                      className={`w-64 h-64 object-contain rounded-lg transition-all ${
                        !isQrActive ? 'blur-xs grayscale opacity-40' : ''
                      }`}
                    />
                    {/* Centered ABHA Trust Shield Emblem */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-full bg-white border-2 border-slate-900 shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                          health_and_safety
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <span className="material-symbols-outlined text-[36px] animate-spin">refresh</span>
                    <span className="text-xs">Generating encrypted QR pass...</span>
                  </div>
                )}

                {/* Overlay if expired */}
                {!isQrActive && (
                  <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white gap-2">
                    <span className="material-symbols-outlined text-red-400 text-[32px]">timer_off</span>
                    <span className="font-bold text-sm">QR Code Expired</span>
                    <p className="text-[11px] text-slate-300 max-w-xs">
                      This temporary pass is no longer valid. The cryptographic keys have been purged.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleGenerateQr(selectedRecordId)}
                      className="mt-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Generate Fresh QR
                    </button>
                  </div>
                )}
              </div>

              {/* Large 6-digit Doctor PIN */}
              <div className="mt-4 flex flex-col items-center text-center">
                <span className="text-xs text-slate-600 font-medium">Doctor Verification PIN</span>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-xl font-bold tracking-widest text-slate-900">
                  <span className="w-8 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center">
                    {qrPin[0]}
                  </span>
                  <span className="w-8 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center">
                    {qrPin[1]}
                  </span>
                  <span className="w-8 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center">
                    {qrPin[2]}
                  </span>
                  <span className="text-slate-400">-</span>
                  <span className="w-8 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center">
                    {qrPin[3]}
                  </span>
                  <span className="w-8 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center">
                    {qrPin[4]}
                  </span>
                  <span className="w-8 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center">
                    {qrPin[5]}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1">
                  Tell this code to the doctor when they scan the QR
                </span>
              </div>

              {/* Action Buttons */}
              <div className="w-full mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleOpenDoctorSimulator}
                  disabled={!isQrActive}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">
                    medical_services
                  </span>
                  <span>Simulate Doctor Scan & Verify</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrImage}
                    disabled={!isQrActive}
                    className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Download Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyVerificationUrl}
                    disabled={!isQrActive}
                    className="h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    <span>Copy Link</span>
                  </button>
                </div>
              </div>

              {/* Enclave specs footer */}
              <div className="w-full mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>SESSION: {qrPayload?.sessionToken || 'ABHA-EPH-8842-DEMO'}</span>
                <span>ED25519 VERIFIED</span>
              </div>
            </div>

            {/* How QR Verification Works in India Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">info</span>
                <span>How Doctor Verification Works</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When you visit an OPD clinic or hospital, your doctor scans this QR code using their camera or hospital terminal. Because the record payload is encrypted with an ephemeral key and secured with your 6-digit PIN, no third party or camera can intercept your private health data.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-emerald-700">
                <span>✓ Zero-Knowledge</span>
                <span>•</span>
                <span>✓ Auto-Purged on Expiry</span>
                <span>•</span>
                <span>✓ CoWIN & ABHA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Multi-Record Consent Delegation (Existing SMART-on-FHIR Flow) */}
      {sharingMode === 'token' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Interactive Wizard */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
              {/* Step 1: Target Recipient */}
              <div className="flex items-start justify-between pb-2 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">Choose Authorized Recipient / Hospital</h2>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase font-medium">STEP 1 OF 4</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mb-5">
                {[
                  {
                    id: 'rajesh-sharma',
                    name: 'Dr. Rajesh Sharma, MD (Apollo Hospital)',
                    badge: 'VERIFIED CLINICIAN',
                    detail: 'Apollo Diagnostic & Cardiology Center, New Delhi • MCI #19827',
                  },
                  {
                    id: 'ananya-iyer',
                    name: 'Dr. Ananya Iyer, MD (Max Healthcare)',
                    badge: 'PRIMARY ATTENDING',
                    detail: 'Max Super Speciality Hospital, Saket • Internal Medicine',
                  },
                  {
                    id: 'lal-pathlabs',
                    name: 'Dr. Lal PathLabs Diagnostic Intake Hub',
                    badge: 'DIRECT LAB EHR',
                    detail: 'National Pathology Network Integration Portal',
                  },
                  {
                    id: 'family-member',
                    name: 'Priya Sharma (Family Caregiver)',
                    badge: 'FAMILY ACCESS',
                    detail: 'Designated emergency contact & health proxy',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      recipient === item.id
                        ? 'bg-slate-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipient"
                      value={item.id}
                      checked={recipient === item.id}
                      onChange={() => setRecipient(item.id)}
                      className="mt-1 accent-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900">{item.name}</span>
                        <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase">
                          {item.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.detail}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Step 2: Purpose */}
              <div className="flex items-start justify-between pb-2 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">Define Authorized Clinical Purpose</h2>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase font-medium">STEP 2 OF 4</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  'Doctor Consultation & Second Opinion',
                  'Diagnostic Procedure & Lab Intake',
                  'Insurance Claim Assessment',
                  'Care Coordination & Referral',
                  'Emergency Hospital Admission',
                ].map((p) => {
                  const isSelected = purpose === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurpose(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Step 3: Granular Records Checklist */}
              <div className="flex items-start justify-between pb-2 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Granular Records Checklist</h2>
                    <p className="text-xs text-slate-500">Only selected items are accessible in the FHIR bundle.</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase font-medium">STEP 3 OF 4</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg mb-3 flex items-center justify-between text-xs border border-slate-200">
                <span className="text-slate-600">Unselected records remain encrypted in your local vault.</span>
                <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {selectedRecordIds.length} of {records.length} records selected
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                {records.map((rec) => {
                  const isChecked = selectedRecordIds.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      className={`flex items-start justify-between gap-3 p-3 rounded-xl transition-all border ${
                        isChecked
                          ? 'bg-slate-50 border-emerald-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 opacity-75'
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRecord(rec.id)}
                          className="mt-1 accent-emerald-600 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900 truncate">
                              {rec.title}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {rec.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{rec.hospital}</span>
                            <span>•</span>
                            <span>{formatIndianDate(rec.date)}</span>
                          </div>
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSharingMode('qr');
                          setSelectedRecordId(rec.id);
                          handleGenerateQr(rec.id);
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                        <span>Share via QR</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Step 4: Duration & Security Safeguards */}
              <div className="flex items-start justify-between pb-2 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">Lease Duration & Security Safeguards</h2>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase font-medium">STEP 4 OF 4</span>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: '1h', label: '1 Hour (Visit)' },
                    { id: '24h', label: '24 Hours' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                    { id: 'custom', label: 'Custom Window' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDuration(d.id)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        duration === d.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Toggles */}
              <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-slate-50 mb-5 border border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webAuthnRequired}
                    onChange={(e) => setWebAuthnRequired(e.target.checked)}
                    className="mt-0.5 accent-emerald-600 shrink-0"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">
                      Require Biometric / Passkey Verification by Recipient
                    </div>
                    <div className="text-slate-500">
                      Attending doctor must confirm identity on their registered hospital hardware.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oneTimeRead}
                    onChange={(e) => setOneTimeRead(e.target.checked)}
                    className="mt-0.5 accent-emerald-600 shrink-0"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-slate-900">
                      Auto-Revoke Session Immediately on Single Read
                    </div>
                    <div className="text-slate-500">
                      Token invalidates automatically after the initial EHR query.
                    </div>
                  </div>
                </label>
              </div>

              {/* Consent Summary */}
              <div className="rounded-xl bg-slate-100 p-4 mb-4 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1 text-slate-900">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">
                    assignment_turned_in
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider">Consent Grant Summary</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{consentSummary}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleIssueToken}
                  disabled={isGenerating || selectedRecordIds.length === 0}
                  className="w-full sm:flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      <span>Minting FHIR Token...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">key</span>
                      <span>Issue Encrypted SMART-on-FHIR Token</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Active Delegations & Sharing History */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Active Delegations */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h2 className="text-sm font-bold text-slate-900">Active Shared Sessions</h2>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {delegations.filter((d) => !d.revoked).length} ACTIVE
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {delegations.map((del) => {
                  if (del.revoked) return null;

                  return (
                    <div
                      key={del.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {del.initials}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">
                              {del.recipientName}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate block">{del.facility}</span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">timer</span>
                          {del.expiresIn}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-white text-[11px] font-mono border border-slate-200">
                        <div>
                          <span className="text-slate-400 uppercase block text-[9px]">PURPOSE</span>
                          <span className="text-slate-800 truncate block">{del.purpose}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase block text-[9px]">SCOPES</span>
                          <span className="text-slate-800 truncate block">{del.scopesSummary}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRevoke(del.id, del.recipientName)}
                          className="flex-1 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">block</span>
                          <span>Revoke Access</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sharing History & Audit Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Sharing History & Audit Log</h2>
                  <span className="font-mono text-[10px] text-slate-500">
                    Real-time verification events
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  APPEND-ONLY
                </span>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-50 text-xs border border-slate-200 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-slate-500">{formatIndianTime(log.timestamp)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                        {log.statusCode}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{log.actor}</div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                    <span className="font-mono text-[9px] text-slate-400">IP: {log.clientIp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DOCTOR SCAN & VERIFICATION SIMULATOR MODAL --- */}
      {isDoctorSimulatorOpen && qrPayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header: Clinic Terminal */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">
                    medical_information
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Doctor Clinic Terminal Simulator</h3>
                  <span className="font-mono text-[10px] text-emerald-400">
                    Dr. Rajesh Sharma, MD • Apollo Diagnostic Intake
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDoctorSimulatorOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              {doctorSimStep === 'scan' && (
                <div className="flex flex-col gap-4">
                  {/* Viewfinder simulation */}
                  <div className="relative h-44 rounded-xl bg-slate-950 flex flex-col items-center justify-center overflow-hidden border-2 border-emerald-500/50">
                    {/* Scan line animation */}
                    <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce"></div>
                    <span className="material-symbols-outlined text-emerald-400 text-[42px] mb-2 opacity-80">
                      qr_code_scanner
                    </span>
                    <span className="font-mono text-xs text-emerald-300 font-bold">
                      QR SCANNED: {qrPayload.sessionToken}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Payload: {qrPayload.recordTitle} (LOINC: {qrPayload.code})
                    </span>
                  </div>

                  {/* Doctor PIN Confirmation */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">key</span>
                      <span>Enter Patient's 6-Digit Doctor Verification PIN:</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      The patient provides this verbal PIN from their screen to confirm consent.
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={doctorEnteredPin}
                        onChange={(e) => setDoctorEnteredPin(e.target.value)}
                        placeholder="e.g. 584920"
                        className="h-11 px-3 rounded-lg border-2 border-slate-300 font-mono text-lg font-bold tracking-widest text-center text-slate-900 focus:border-emerald-600 focus:outline-none w-44"
                      />
                      <button
                        type="button"
                        onClick={handleExecuteDoctorVerification}
                        className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        <span>Decrypt & Verify Record</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {doctorSimStep === 'verifying' && (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                  <div className="font-bold text-slate-900 text-sm">
                    Attesting ABHA Cryptographic Trust Anchor...
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    Checking ED25519 signature & decrypting AES-256 payload in memory
                  </div>
                </div>
              )}

              {doctorSimStep === 'result' && doctorVerificationResult && (
                <div className="flex flex-col gap-4">
                  {doctorVerificationResult.valid ? (
                    <div className="flex flex-col gap-3">
                      {/* Success Banner */}
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
                        <span className="material-symbols-outlined text-emerald-600 text-[24px] shrink-0">
                          verified
                        </span>
                        <div>
                          <div className="font-bold text-sm text-emerald-900">
                            Cryptographically Verified & Decrypted
                          </div>
                          <p className="text-xs text-emerald-700">
                            Digital signature matches issuing hospital PKI registry. 0 bytes tampered.
                          </p>
                        </div>
                      </div>

                      {/* Verified Clinical Finding Card */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div>
                            <span className="font-mono text-[10px] text-slate-500 uppercase">
                              PATIENT IDENTITY
                            </span>
                            <div className="font-bold text-sm text-slate-900">
                              {doctorVerificationResult.recordDetails?.patient.name}
                            </div>
                            <span className="font-mono text-xs text-emerald-700 font-semibold">
                              ABHA: {doctorVerificationResult.recordDetails?.patient.abhaId}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] text-slate-500 uppercase">
                              ISSUING AUTHORITY
                            </span>
                            <div className="font-bold text-xs text-slate-900">
                              {doctorVerificationResult.recordDetails?.issuer.hospital}
                            </div>
                            <span className="text-xs text-slate-600">
                              {doctorVerificationResult.recordDetails?.issuer.clinician}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="font-mono text-[10px] text-slate-500 uppercase">
                            DIAGNOSTIC FINDINGS / STUDY
                          </span>
                          <div className="font-bold text-xs text-slate-900 mt-0.5">
                            {doctorVerificationResult.recordDetails?.clinicalSummary.title}
                          </div>
                          <p className="text-xs text-slate-700 mt-1 bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                            {doctorVerificationResult.recordDetails?.clinicalSummary.findingsOrDosage}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1">
                          <div>
                            <span className="text-slate-400">CIPHER:</span>{' '}
                            {doctorVerificationResult.recordDetails?.encryption.cipher}
                          </div>
                          <div>
                            <span className="text-slate-400">ISSUED:</span>{' '}
                            {formatIndianTime(
                              doctorVerificationResult.recordDetails?.accessControl.issuedAt
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-300 flex items-start gap-3">
                      <span className="material-symbols-outlined text-red-600 text-[24px] shrink-0">
                        error
                      </span>
                      <div>
                        <div className="font-bold text-sm text-red-900">
                          Verification Failed: {doctorVerificationResult.status}
                        </div>
                        <p className="text-xs text-red-700 mt-0.5">
                          {doctorVerificationResult.error || 'Failed to authenticate QR pass.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDoctorSimStep('scan')}
                          className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Retry with Correct PIN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500">
                AUDIT LOG RECORDED • HIPAA & ABHA COMPLIANT
              </span>
              <button
                type="button"
                onClick={() => setIsDoctorSimulatorOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Generated Token Modal */}
      {generatedTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 shadow-2xl relative border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="font-bold text-base text-slate-900">FHIR Delegation Created</h3>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedTokenModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <div className="font-bold text-slate-900 mb-1">Delegation Active</div>
              <p>
                Authorized clinic can now query selected records directly through the FHIR endpoint.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setGeneratedTokenModal(false)}
              className="w-full h-11 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Done & Return to Shares
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
