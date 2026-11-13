/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditEvent } from '../data/mockData.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface SecurityAuditViewProps {
  auditLogs: AuditEvent[];
  currentLang?: SupportedLanguage;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ auditLogs, currentLang = 'en' }) => {
  const t = getTranslation(currentLang);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(true);
  const [emergencyBreakGlass, setEmergencyBreakGlass] = useState<boolean>(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditEvent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyKey = () => {
    navigator.clipboard?.writeText('04e3b149b08f82194c7980e121fa98c081f4a9b9');
    showToast('Master public key 04e3b1...81f4a9b9 copied to clipboard');
  };

  const handleDownloadArchive = () => {
    showToast('Compiling HL7 FHIR archive. Export package queued (ZIP)...');
  };

  const handlePurgeCache = () => {
    if (confirm('Are you sure you want to purge local cryptographic session tokens? You will need to re-authenticate with MFA.')) {
      showToast('Local credentials purged. Secure vault locked.');
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-8">
      {/* Screen Header Banner */}
      <div className="bg-surface-container-low rounded-2xl p-5 sm:p-6 flex flex-col gap-2 shadow-sm border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container animate-ping"></span>
            <span className="font-code-sm text-xs text-on-secondary-fixed-variant uppercase tracking-wider font-bold">
              Ledger In Sync
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-highest px-2.5 py-1 rounded-lg text-primary border border-outline-variant/30">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            <span className="font-code-sm text-xs font-semibold">KMS Vault Active</span>
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary mt-1">
          Security & Audit Ledger
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Immutable patient privacy telemetry & access authorization feed.
        </p>
      </div>

      {/* Cryptographic Safeguards: Metric Cards */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-code-sm text-xs uppercase tracking-wider text-primary font-bold">
            Cryptographic Safeguards
          </span>
          <span className="font-code-sm text-xs text-outline font-semibold">ZERO-KNOWLEDGE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-xs border border-outline-variant/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[22px]">enhanced_encryption</span>
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-primary block truncate">Data Encryption</span>
                <span className="font-code-sm text-[10px] text-on-surface-variant block truncate">
                  AES-256 at Rest • TLS 1.3
                </span>
              </div>
            </div>
            <span className="font-code-sm text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold px-2 py-0.5 rounded shrink-0">
              ACTIVE
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-xs border border-outline-variant/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[22px]">dataset</span>
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-primary block truncate">Interoperability Standard</span>
                <span className="font-code-sm text-[10px] text-on-surface-variant block truncate">
                  HL7 FHIR R4 Profiles
                </span>
              </div>
            </div>
            <span className="font-code-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed-variant font-bold px-2 py-0.5 rounded shrink-0">
              VERIFIED
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-xs border border-outline-variant/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[22px]">token</span>
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-primary block truncate">Auth Architecture</span>
                <span className="font-code-sm text-[10px] text-on-surface-variant block truncate">
                  OAuth 2.0 / OpenID OIDC
                </span>
              </div>
            </div>
            <span className="font-code-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed-variant font-bold px-2 py-0.5 rounded shrink-0">
              SECURE
            </span>
          </div>
        </div>
      </div>

      {/* Key Custody Visual Accent Card */}
      <div className="bg-primary rounded-2xl p-5 sm:p-6 text-on-primary shadow-sm relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[150px]">shield</span>
        </div>
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">verified</span>
              <span className="font-code-sm text-xs text-tertiary-fixed-dim uppercase tracking-wider font-bold">
                Self-Sovereign Identity Key
              </span>
            </div>
            <span className="font-code-sm text-[10px] bg-primary-container text-primary-fixed-dim px-2 py-0.5 rounded border border-white/10 font-bold">
              Enclave 0x88F
            </span>
          </div>
          <div>
            <p className="text-base sm:text-lg text-on-primary font-bold">Master Key Pair (Patient Held)</p>
            <p className="text-xs text-primary-fixed-dim mt-0.5">
              Hardware secure enclave binding with remote zero-proof attestations.
            </p>
          </div>
          <div className="bg-primary-container/80 rounded-xl p-2.5 mt-1 flex items-center justify-between border border-white/10">
            <span className="font-code-sm text-xs text-primary-fixed-dim font-mono truncate">
              PUBKEY: 04e3b1...81f4a9b9
            </span>
            <button
              type="button"
              onClick={handleCopyKey}
              className="flex items-center gap-1 text-on-tertiary-container hover:text-white transition-colors pl-2 font-code-sm text-xs font-bold"
              aria-label="Copy public cryptographic key"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>COPY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Access Controls & Consent Matrix */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-code-sm text-xs uppercase tracking-wider text-primary font-bold">
            Access Controls & Consent
          </span>
          <span className="font-code-sm text-xs text-outline font-semibold">POLICY V2.4</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm border border-outline-variant/20">
          {/* Biometric App Lock */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">fingerprint</span>
              </div>
              <div>
                <span className="font-semibold text-xs sm:text-sm text-primary block">Biometric App Lock</span>
                <span className="text-xs text-on-surface-variant block">FaceID / TouchID session challenge on open</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setBiometricEnabled(!biometricEnabled);
                showToast(`Biometric app lock ${!biometricEnabled ? 'enabled' : 'disabled'}`);
              }}
              className={`w-12 h-6 rounded-full relative transition-colors p-0.5 shrink-0 ${
                biometricEnabled ? 'bg-on-tertiary-container' : 'bg-surface-variant'
              }`}
              role="switch"
              aria-checked={biometricEnabled}
            >
              <span
                className={`block w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                  biometricEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          <div className="h-px bg-surface-container w-full"></div>

          {/* MFA */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">phonelink_lock</span>
              </div>
              <div>
                <span className="font-semibold text-xs sm:text-sm text-primary block">Multi-Factor Authentication (MFA)</span>
                <span className="text-xs text-on-surface-variant block">SMS fallback + Authenticator app hardware tokens</span>
              </div>
            </div>
            <span className="font-code-sm text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold px-2 py-0.5 rounded shrink-0">
              ACTIVE
            </span>
          </div>

          <div className="h-px bg-surface-container w-full"></div>

          {/* Granular FHIR Consent */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">policy</span>
              </div>
              <div>
                <span className="font-semibold text-xs sm:text-sm text-primary block">Granular FHIR Consent</span>
                <span className="text-xs text-on-surface-variant block">Patient retains master encryption key</span>
              </div>
            </div>
            <span className="font-code-sm text-[10px] bg-surface-container text-primary font-bold px-2 py-0.5 rounded shrink-0">
              ENFORCED
            </span>
          </div>

          <div className="h-px bg-surface-container w-full"></div>

          {/* Emergency Break-Glass */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">local_hospital</span>
              </div>
              <div>
                <span className="font-semibold text-xs sm:text-sm text-primary block">Emergency Break-Glass Access</span>
                <span className="text-xs text-on-surface-variant block">Provider emergency bypass locked • Requires manual release</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmergencyBreakGlass(!emergencyBreakGlass);
                showToast(`Emergency Break-Glass ${!emergencyBreakGlass ? 'authorized' : 'locked'}`);
              }}
              className={`font-code-sm text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                emergencyBreakGlass
                  ? 'bg-error text-on-error'
                  : 'bg-surface-container-highest text-on-surface-variant hover:text-primary'
              }`}
            >
              {emergencyBreakGlass ? 'UNLOCKED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Access & Ingestion Log */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="font-code-sm text-xs uppercase tracking-wider text-primary font-bold">
              Access & Ingestion Log
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
          </div>
          <span className="font-code-sm text-xs text-secondary font-semibold">FILTER: ALL ({auditLogs.length})</span>
        </div>

        <div className="flex flex-col gap-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-outline-variant/20 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[18px]">history_edu</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-primary">{log.title}</h3>
                    <span className="font-code-sm text-[10px] text-outline">ID: {log.id}</span>
                  </div>
                </div>
                <span className="font-code-sm text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold px-2 py-0.5 rounded">
                  {log.statusCode}
                </span>
              </div>

              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-1.5 font-code-sm text-xs border border-outline-variant/20">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>ACTOR:</span>
                  <span className="text-primary font-semibold truncate max-w-xs">{log.actor}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>CLIENT / IP:</span>
                  <span className="text-secondary truncate max-w-xs">{log.clientIp}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>TIMESTAMP:</span>
                  <span className="text-primary font-medium">{log.timestamp}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-on-tertiary-container font-semibold">
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                  <span>Cryptographically Signed Record</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAuditLog(log)}
                  className="font-code-sm text-xs text-secondary font-bold hover:underline"
                >
                  DETAILS
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Rights & Custody Actions */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-code-sm text-xs uppercase tracking-wider text-primary font-bold">
            Data Rights & Custody
          </span>
          <span className="font-code-sm text-xs text-outline font-semibold">HIPAA § 164.524</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 flex flex-col gap-3 shadow-xs border border-outline-variant/20">
          <button
            type="button"
            onClick={handleDownloadArchive}
            className="w-full h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary-fixed">archive</span>
            <span>Download Full HIPAA Archive (JSON/ZIP)</span>
          </button>

          <button
            type="button"
            onClick={handlePurgeCache}
            className="w-full h-12 bg-error-container text-on-error-container rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm hover:bg-error-container/80 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-error">delete_forever</span>
            <span>Purge Local Cached Credentials</span>
          </button>

          <p className="text-xs text-on-surface-variant text-center px-4 leading-relaxed">
            Export generates an authenticated, password-protected encrypted archive containing all HL7 FHIR bundles, diagnostic results, and immunization signatures.
          </p>
        </div>
      </div>

      {/* Selected Audit Log Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-primary/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 shadow-2xl relative border border-outline-variant/30">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">security</span>
                <h3 className="font-bold text-base text-primary">{selectedAuditLog.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs font-code-sm">
              <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1.5">
                <div><span className="text-outline uppercase">Audit ID:</span> <span className="font-bold text-primary">{selectedAuditLog.id}</span></div>
                <div><span className="text-outline uppercase">Timestamp:</span> <span className="font-bold text-primary">{selectedAuditLog.timestamp}</span></div>
                <div><span className="text-outline uppercase">Actor:</span> <span className="font-bold text-primary">{selectedAuditLog.actor}</span></div>
                <div><span className="text-outline uppercase">Client / IP:</span> <span className="text-secondary">{selectedAuditLog.clientIp}</span></div>
                <div><span className="text-outline uppercase">Status:</span> <span className="text-on-tertiary-container font-bold">{selectedAuditLog.statusCode}</span></div>
              </div>
              <p className="text-on-surface-variant font-sans text-xs">{selectedAuditLog.details}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAuditLog(null)}
              className="w-full h-11 bg-primary text-on-primary rounded-xl font-semibold text-xs hover:bg-primary-container transition-colors"
            >
              Close Ledger Entry
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
