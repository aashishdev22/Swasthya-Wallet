/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { generateReferenceCode, evaluateVerificationState } from '../utils/crypto.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface DocumentVerificationViewProps {
  currentLang?: SupportedLanguage;
}

export const DocumentVerificationView: React.FC<DocumentVerificationViewProps> = ({
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<number>(5);
  const [sourceTab, setSourceTab] = useState<'wallet' | 'upload' | 'scan'>('wallet');
  const [refCode, setRefCode] = useState<string>('UHW-VRF-2024-8842-99C0');
  const [digestHash, setDigestHash] = useState<string>(
    '8F4E6B2A99C048DF72E3108B3492C91A04EF52A807BC4D9284D76E2A1019CFB5'
  );
  const [simState, setSimState] = useState<'verified' | 'invalid' | 'expired' | 'timeout'>('verified');
  const [showFhirJsonModal, setShowFhirJsonModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const stateDetails = evaluateVerificationState(simState);

  const handleRegenerateRef = () => {
    const newRef = generateReferenceCode();
    setRefCode(newRef);
    showToast(`New reference identifier generated: ${newRef}`);
  };

  const handleCopyDigest = () => {
    navigator.clipboard?.writeText(digestHash);
    showToast('SHA-256 Digest hash copied to clipboard');
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(refCode);
    showToast(`Reference ${refCode} copied to clipboard`);
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-8">
      {/* Top Banner & Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/20">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-code-sm text-[10px] uppercase tracking-wider font-bold">
              CRYPTOGRAPHIC HASH & PKI INTEGRITY ENGINE
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-code-sm text-[10px] uppercase font-semibold">
              SPEC: W3C VC • HL7 FHIR R4
            </span>
            <span className="px-2 py-0.5 rounded bg-tertiary-container text-tertiary-fixed font-code-sm text-[10px] font-semibold">
              FIPS 140-3 SIMULATED
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight mt-1">
            Medical Document & Certificate Verification
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Validate the authenticity, digital signature, and tamper-resistance of FHIR payloads, lab PDFs, and SMART Health Cards across public-key registries.
          </p>
        </div>

        {/* Telemetry Box */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="font-code-sm text-[10px] text-outline uppercase font-semibold">PKI DIRECTORY</span>
            <span className="font-code-sm text-secondary font-bold">IL-HEALTH-DIR#904</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-code-sm text-[10px] text-outline uppercase font-semibold">DIGEST ENGINE</span>
            <span className="font-code-sm text-on-surface font-semibold">WebCrypto SHA-256</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-code-sm text-[10px] text-outline uppercase font-semibold">REVOCATION</span>
            <span className="font-code-sm text-on-tertiary-container font-semibold">OCSP-STAPLE READY</span>
          </div>
        </div>
      </div>

      {/* Strict Clinical Disclaimer Banner */}
      <div className="flex items-start gap-3 p-4 bg-surface-container rounded-xl shadow-xs border border-outline-variant/20">
        <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">verified</span>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary uppercase font-bold tracking-tight">
              Important Demo Notice
            </span>
            <span className="font-code-sm text-[9px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-semibold">
              SANDBOX CONTEXT
            </span>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            This verification engine demonstrates cryptographic hashing and public-key registry matching in a simulated sandbox. A generated reference or QR code alone does not prove document authenticity in a non-authenticated environment; validation requires authoritative public key federation and trust root attestation.
          </p>
        </div>
      </div>

      {/* 5-Stage Verification Workflow Stepper */}
      <div className="w-full bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/20">
        <div className="flex items-center justify-between mb-3">
          <span className="font-code-sm text-[10px] uppercase tracking-wider text-outline font-bold">
            ATTESTATION WORKFLOW LIFECYCLE • STAGE {activeWorkflowStage} OF 5
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
            <span className="font-code-sm text-[11px] text-on-tertiary-container font-bold">
              PIPELINE SYNCHRONIZED
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {[
            { num: '01', title: 'Select Document', desc: 'PDF Payload loaded' },
            { num: '02', title: 'Generate Reference', desc: 'UHW-VRF-2024-8842' },
            { num: '03', title: 'Scan or Ingest', desc: 'W3C Credential Pointer' },
            { num: '04', title: 'Validate Digest', desc: 'SHA-256 + RSA-2048' },
            { num: '05', title: 'Display Result', desc: 'Attestation Ready' },
          ].map((st, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === activeWorkflowStage;
            return (
              <div
                key={st.num}
                onClick={() => setActiveWorkflowStage(stepNum)}
                className={`flex flex-col p-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-code-sm text-[10px] ${isActive ? 'text-primary-fixed' : 'text-outline'}`}>
                    {st.num} {isActive ? 'ACTIVE' : ''}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isActive ? 'text-tertiary-fixed' : 'text-on-tertiary-container'
                    }`}
                  >
                    {isActive ? 'verified_user' : 'check_circle'}
                  </span>
                </div>
                <div className="font-semibold text-xs mt-1">{st.title}</div>
                <div className={`font-code-sm text-[10px] truncate ${isActive ? 'text-primary-fixed-dim' : 'text-outline'}`}>
                  {st.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Ingestion & Attestation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 cols): Document Selection, Reference Generator & QR Pass */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
                <h2 className="text-sm font-bold text-primary">Document Selection & Reference</h2>
              </div>
              <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                INSPECTION TIER 1
              </span>
            </div>

            {/* Source selector buttons */}
            <div className="flex items-center p-1 rounded-xl bg-surface-container-low gap-1">
              <button
                type="button"
                onClick={() => setSourceTab('wallet')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                  sourceTab === 'wallet'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Health Wallet
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceTab('upload');
                  showToast('Ready for local PDF or FHIR JSON file ingestion');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                  sourceTab === 'upload'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceTab('scan');
                  showToast('Camera scanner initialized for physical clinical passes');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                  sourceTab === 'scan'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Scan QR
              </button>
            </div>

            {/* Document Metadata Card */}
            <div className="flex flex-col p-3.5 rounded-xl bg-surface-container-low gap-3 border border-outline-variant/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-primary truncate block">
                      Northwestern_Pathology_Lipid_Panel_2024.pdf
                    </span>
                    <span className="font-code-sm text-[10px] text-outline block">
                      1.84 MB • application/pdf • Base64 Signed
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-code-sm text-[10px] font-bold shrink-0">
                  LOINC 24323-8
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-on-surface-variant border-t border-surface-container/60">
                <div>
                  <span className="text-outline block font-code-sm text-[9px] uppercase font-bold">Patient</span>
                  <span className="font-semibold text-primary">Eleanor Vance</span>
                </div>
                <div>
                  <span className="text-outline block font-code-sm text-[9px] uppercase font-bold">Issued Date</span>
                  <span className="font-semibold text-primary">Oct 28, 2024 • 08:30 CDT</span>
                </div>
                <div>
                  <span className="text-outline block font-code-sm text-[9px] uppercase font-bold">Hospital ID</span>
                  <span className="font-code-sm text-[11px] text-secondary font-bold">#NM-84920-PATH</span>
                </div>
                <div>
                  <span className="text-outline block font-code-sm text-[9px] uppercase font-bold">DiagnosticReport</span>
                  <span className="font-code-sm text-[11px] text-on-surface font-semibold">DR-992-8021</span>
                </div>
              </div>

              {/* Calculated SHA-256 Digest */}
              <div className="p-2.5 rounded-lg bg-surface-container-lowest flex flex-col gap-1 border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-[10px] uppercase tracking-wider text-outline flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[13px] text-secondary">fingerprint</span>
                    Calculated SHA-256 Digest
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDigest}
                    className="font-code-sm text-[10px] text-secondary hover:text-primary transition-all flex items-center gap-0.5 font-bold"
                  >
                    <span className="material-symbols-outlined text-[12px]">content_copy</span>
                    <span>Copy</span>
                  </button>
                </div>
                <div className="font-code-sm text-[10px] text-primary break-all bg-surface-container-low p-2 rounded font-mono leading-relaxed select-all">
                  {digestHash}
                </div>
              </div>
            </div>

            {/* Live Verification Reference Code */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-code-sm text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                  Live Verification Reference Identifier
                </label>
                <span className="font-code-sm text-[10px] text-outline">TTL: 23h 59m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-container-low p-2.5 rounded-xl flex items-center justify-between border border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-[18px]">key</span>
                    <span className="font-code-sm text-xs font-bold text-primary tracking-wider font-mono">
                      {refCode}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed font-code-sm text-[9px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateRef}
                  className="h-10 px-3 rounded-xl bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all flex items-center justify-center border border-outline-variant/30"
                  title="Regenerate Reference Code"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="h-10 px-3 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center gap-1 text-xs font-bold shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">copy_all</span>
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Decentralized Verifiable Credential QR Card */}
            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2.5 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">qr_code_2</span>
                  <span className="text-xs font-bold text-primary">Decentralized Verifiable Credential QR</span>
                </div>
                <span className="font-code-sm text-[9px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface font-semibold">
                  ISO/IEC 18004
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20">
                <div className="relative w-32 h-32 p-2 bg-surface-container-lowest rounded-lg shrink-0 flex items-center justify-center shadow-xs border border-outline-variant/30">
                  <svg className="w-full h-full text-primary" fill="currentColor" viewBox="0 0 100 100">
                    <rect fill="none" height="26" rx="2" stroke="currentColor" strokeWidth="4" width="26" x="5" y="5"></rect>
                    <rect height="14" rx="1" width="14" x="11" y="11"></rect>
                    <rect fill="none" height="26" rx="2" stroke="currentColor" strokeWidth="4" width="26" x="69" y="5"></rect>
                    <rect height="14" rx="1" width="14" x="75" y="11"></rect>
                    <rect fill="none" height="26" rx="2" stroke="currentColor" strokeWidth="4" width="26" x="5" y="69"></rect>
                    <rect height="14" rx="1" width="14" x="11" y="75"></rect>
                    <rect height="5" width="5" x="36" y="7"></rect>
                    <rect height="5" width="5" x="45" y="7"></rect>
                    <rect height="5" width="5" x="54" y="7"></rect>
                    <rect fill="#006398" height="6" width="6" x="36" y="36"></rect>
                    <rect fill="#0f294a" height="12" width="12" x="44" y="44"></rect>
                    <rect height="6" width="6" x="58" y="36"></rect>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded bg-surface-container-lowest flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-secondary text-[14px]">health_and_safety</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant">
                  <p className="leading-relaxed">
                    Scan on external clinical validator. Encodes signed W3C Verifiable Credential digest & public key pointer.
                  </p>
                  <div className="flex items-center gap-1.5 font-code-sm text-[10px] text-outline">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <span>SMART HEALTH CARD v1.3</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => showToast('Credential verification pass downloaded (.json-ld)')}
                      className="py-1.5 px-3 rounded-lg bg-surface-container text-primary font-semibold text-xs hover:bg-surface-container-high transition-colors"
                    >
                      Download Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Full optical brightness verification pass engaged')}
                      className="py-1.5 px-3 rounded-lg bg-surface-container-low text-on-surface font-semibold text-xs hover:bg-surface-container transition-colors"
                    >
                      Present
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Federated Trust Hierarchy */}
            <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-outline-variant/20 text-xs">
              <span className="font-code-sm text-[10px] uppercase tracking-wider text-outline font-bold">
                Federated Trust Hierarchy
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Northwestern Medicine Root CA</span>
                  <span className="font-code-sm text-[10px] text-on-tertiary-container font-mono bg-surface-container-lowest px-1.5 py-0.5 rounded font-bold">
                    VALID (SHA-256)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Illinois HIE Trust Mesh</span>
                  <span className="font-code-sm text-[10px] text-on-tertiary-container font-mono bg-surface-container-lowest px-1.5 py-0.5 rounded font-bold">
                    AUTHORIZED
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Federal Bridge Certification Auth (FBCA)</span>
                  <span className="font-code-sm text-[10px] text-secondary font-mono bg-surface-container-lowest px-1.5 py-0.5 rounded font-bold">
                    CROSS-CERTIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Interactive Simulation Matrix */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-4">
            {/* Header & State Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container-low">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[22px]">fact_check</span>
                  <h2 className="text-sm font-bold text-primary">Verification Engine Simulation Matrix</h2>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Select any clinical verification state to inspect validation payloads & error recovery routines:
                </p>
              </div>
              <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-primary-container text-on-primary font-bold self-start sm:self-auto">
                SIMULATED HSM
              </span>
            </div>

            {/* 4 State Switching Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
              {[
                { id: 'verified', label: 'Verified', color: 'bg-tertiary-fixed-dim' },
                { id: 'invalid', label: 'Tampered', color: 'bg-error' },
                { id: 'expired', label: 'Expired', color: 'bg-secondary-container' },
                { id: 'timeout', label: 'Unreachable', color: 'bg-outline' },
              ].map((tab) => {
                const isActive = simState === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSimState(tab.id as any)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* State Display Card: Verified */}
            {simState === 'verified' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-container text-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[28px]">verified</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-primary">{stateDetails.title}</span>
                        <span className="px-2 py-0.5 rounded font-code-sm text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase">
                          {stateDetails.badge}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{stateDetails.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-code-sm text-[10px] text-outline uppercase block">Latency</span>
                    <span className="font-code-sm text-sm text-primary font-bold">{stateDetails.latency}</span>
                  </div>
                </div>

                {/* Validation Checklist Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-surface-container-lowest flex items-start gap-2.5 border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Issuer Authority</span>
                      <span className="text-on-surface-variant">Northwestern Memorial Hospital PKI</span>
                      <span className="font-code-sm text-[10px] text-outline">Key ID: #NW-RSA-2048-B4 • Verified</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-lowest flex items-start gap-2.5 border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0 mt-0.5">
                      lock
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Digest Integrity</span>
                      <span className="text-on-surface-variant">Matched anchor ledger exactly</span>
                      <span className="font-code-sm text-[10px] text-outline">0 bytes modified post-signature</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-lowest flex items-start gap-2.5 border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0 mt-0.5">
                      schema
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Schema Conformance</span>
                      <span className="text-on-surface-variant">HL7 FHIR R4 DiagnosticReport Profile</span>
                      <span className="font-code-sm text-[10px] text-outline">0 syntax or structural errors</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-lowest flex items-start gap-2.5 border border-outline-variant/20">
                    <span className="material-symbols-outlined text-on-tertiary-container text-[20px] shrink-0 mt-0.5">
                      history_toggle_off
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">Revocation Check</span>
                      <span className="text-on-surface-variant">OCSP / CRL check returned GOOD</span>
                      <span className="font-code-sm text-[10px] text-outline">Status: Not revoked or voided</span>
                    </div>
                  </div>
                </div>

                {/* ISO Audit Trail Table */}
                <div className="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-1.5 border border-outline-variant/20 text-xs">
                  <span className="font-code-sm text-[10px] uppercase tracking-wider text-outline font-bold">
                    Attestation Audit Trail • ISO 27001
                  </span>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between py-1 border-b border-surface-container-high/60">
                      <span className="text-on-surface-variant">Document Class</span>
                      <span className="font-code-sm text-primary font-medium">Clinical Pathology (LOINC: 24323-8)</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-surface-container-high/60">
                      <span className="text-on-surface-variant">Digital Signature Algorithm</span>
                      <span className="font-code-sm text-primary font-medium">SHA256withRSA (2048-bit PKCS#1 v1.5)</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-surface-container-high/60">
                      <span className="text-on-surface-variant">Confirmed Timestamp</span>
                      <span className="font-code-sm text-primary font-medium">Nov 03, 2024 at 14:28:11 UTC</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-on-surface-variant">Trust Hierarchy Path</span>
                      <span className="font-code-sm text-secondary truncate max-w-xs font-semibold">
                        Northwestern CA → IL State Health → FBCA Root
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => showToast('Exported Verification Attestation PDF signed by hospital root')}
                    className="w-full sm:w-auto h-11 px-4 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-primary-container transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                    <span>Export Verification Attestation (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFhirJsonModal(true)}
                    className="w-full sm:w-auto h-11 px-4 rounded-xl bg-surface-container text-primary font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[18px]">data_object</span>
                    <span>Inspect FHIR Canonical JSON</span>
                  </button>
                </div>
              </div>
            )}

            {/* State Display Card: Tampered */}
            {simState === 'invalid' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-error-container text-on-error-container flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-error text-on-error flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[28px]">gpp_bad</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-error">{stateDetails.title}</span>
                        <span className="px-2 py-0.5 rounded font-code-sm text-[10px] bg-error text-on-error font-bold uppercase">
                          {stateDetails.badge}
                        </span>
                      </div>
                      <p className="text-xs text-on-error-container mt-0.5">{stateDetails.description}</p>
                    </div>
                  </div>
                  <span className="font-code-sm text-[11px] px-2 py-1 rounded bg-error text-on-error font-mono font-bold">
                    ERROR_CODE_0x99A
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col gap-2 text-on-surface border border-outline-variant/20 text-xs">
                  <span className="font-bold text-error">Cryptographic Inconsistency Details</span>
                  <p className="text-on-surface-variant leading-relaxed">
                    The computed SHA-256 payload checksum does not match the decrypted RSA signature published by Northwestern Memorial Hospital. The file content or associated clinical values have been modified, corrupted, or altered post-issuance.
                  </p>
                  <div className="mt-2 p-3 rounded-lg bg-surface-container-low font-code-sm text-[11px] flex flex-col gap-1.5 font-mono">
                    <div className="text-on-surface-variant">Expected Issuer Digest: <span className="text-on-tertiary-container font-bold">8F4E6B2A99C048DF72E3108B3492C9...</span></div>
                    <div className="text-error font-bold">Actual File Digest: <span>0x3AF7819BCC410080B810034AA89211... (MISMATCH)</span></div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-on-error-container">
                    Document quarantined from patient health timeline.
                  </span>
                  <button
                    type="button"
                    onClick={() => showToast('Incident reported to security compliance officer')}
                    className="h-10 px-4 rounded-lg bg-error text-on-error font-bold text-xs hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">report</span>
                    <span>File Integrity Incident Report</span>
                  </button>
                </div>
              </div>
            )}

            {/* State Display Card: Expired */}
            {simState === 'expired' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container text-on-surface flex flex-col gap-4 border border-outline-variant/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[28px]">timer_off</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-primary">{stateDetails.title}</span>
                        <span className="px-2 py-0.5 rounded font-code-sm text-[10px] bg-secondary text-on-secondary font-bold uppercase">
                          {stateDetails.badge}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{stateDetails.description}</p>
                    </div>
                  </div>
                  <span className="font-code-sm text-[11px] px-2 py-1 rounded bg-surface-container-high text-on-surface font-mono font-bold">
                    EXP_ERR_410
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col gap-2 text-on-surface border border-outline-variant/20 text-xs">
                  <span className="font-bold text-primary">Validity Window Exceeded</span>
                  <p className="text-on-surface-variant leading-relaxed">
                    While the digital signature is authentic and unaltered, the issuing medical authority applied a strict 30-day clinical validation window which lapsed 19 days ago. Medical findings must be re-attested by an authorized practitioner before clinical cross-referencing.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-low font-code-sm text-[11px]">
                    <div>
                      <span className="text-outline block">Attestation Validity End:</span>
                      <span className="font-bold text-primary">October 15, 2024 • 23:59:59 UTC</span>
                    </div>
                    <div>
                      <span className="text-outline block">Re-Attestation Portal:</span>
                      <span className="font-bold text-secondary">Northwestern Health Portal API</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => showToast('Re-attestation request submitted to Northwestern Health Portal')}
                  className="h-10 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 self-start shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">autorenew</span>
                  <span>Request Updated Attestation</span>
                </button>
              </div>
            )}

            {/* State Display Card: Timeout */}
            {simState === 'timeout' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-high text-on-surface flex flex-col gap-4 border border-outline-variant/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-dim text-on-surface-variant flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[28px]">cloud_off</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-primary">{stateDetails.title}</span>
                        <span className="px-2 py-0.5 rounded font-code-sm text-[10px] bg-surface-variant text-on-surface font-bold uppercase">
                          {stateDetails.badge}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{stateDetails.description}</p>
                    </div>
                  </div>
                  <span className="font-code-sm text-[11px] px-2 py-1 rounded bg-surface-container text-on-surface font-mono font-bold">
                    NET_ERR_REGISTRY
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl flex flex-col gap-2 text-on-surface border border-outline-variant/20 text-xs">
                  <span className="font-bold text-primary">Federated Node Communication Failure</span>
                  <p className="text-on-surface-variant leading-relaxed">
                    The local SHA-256 hash was generated successfully, but the issuing authority’s public key endpoint (<code className="font-code-sm bg-surface-container-low px-1 py-0.5 rounded">pki.nm.org/fhir/.well-known/jwks.json</code>) did not respond within the 5000ms threshold.
                  </p>
                  <div className="flex items-center gap-2 pt-1 font-code-sm text-[11px] text-error font-bold">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    <span>ATTEMPT 3/3 FAILED • GATEWAY TIMEOUT (504)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Re-initiating TLS 1.3 handshake with hospital PKI directory...');
                      setTimeout(() => setSimState('verified'), 1200);
                    }}
                    className="h-10 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">sync</span>
                    <span>Retry Trust Verification</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Health check: PKI gateway latency 5004ms')}
                    className="h-10 px-4 rounded-xl bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-all flex items-center gap-1.5 border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[16px]">dns</span>
                    <span>Check Node Health</span>
                  </button>
                </div>
              </div>
            )}

            {/* Educational State Machine Comparison Cards */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-code-sm text-[10px] uppercase tracking-wider text-outline font-bold">
                  Clinical State Machine Reference Guide
                </span>
                <span className="font-code-sm text-[10px] text-on-surface-variant font-semibold">4 Handled Conditions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div
                  onClick={() => setSimState('invalid')}
                  className="cursor-pointer p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col gap-1 border border-outline-variant/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-code-sm text-[10px] text-error font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                      INVALID / TAMPERED
                    </span>
                    <span className="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
                  </div>
                  <p className="text-on-surface-variant line-clamp-2 text-[11px]">
                    Hash diverges from authority anchor. Payload was modified post-signature.
                  </p>
                </div>

                <div
                  onClick={() => setSimState('expired')}
                  className="cursor-pointer p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col gap-1 border border-outline-variant/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-code-sm text-[10px] text-secondary font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      EXPIRED ATTESTATION
                    </span>
                    <span className="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
                  </div>
                  <p className="text-on-surface-variant line-clamp-2 text-[11px]">
                    Validity window lapsed. Clinical integrity requires provider re-attestation.
                  </p>
                </div>

                <div
                  onClick={() => setSimState('timeout')}
                  className="cursor-pointer p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col gap-1 border border-outline-variant/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-code-sm text-[10px] text-outline font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                      AUTHORITY OFFLINE
                    </span>
                    <span className="material-symbols-outlined text-outline text-[16px]">arrow_forward</span>
                  </div>
                  <p className="text-on-surface-variant line-clamp-2 text-[11px]">
                    Hospital PKI endpoint timed out (504). Public key could not be verified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Zero-Knowledge Architecture & Security Assurance Infographic */}
      <div className="w-full bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/20 mt-2 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">enhanced_encryption</span>
              <h3 className="text-base sm:text-lg font-bold text-primary">Zero-Knowledge Architecture & Security Assurance</h3>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              The verification protocol validates authenticity without leaking protected health information (PHI) to third-party validators. Documents remain on your client device or secure enclave.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-code-sm text-xs font-bold flex items-center gap-1.5 border border-outline-variant/30">
              <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">verified</span>
              HIPAA § 164.312(e)(1) COMPLIANT
            </span>
          </div>
        </div>

        {/* 3-Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="flex flex-col p-4 rounded-xl bg-surface-container-low gap-2 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-code-sm text-[10px] text-outline uppercase font-bold">STAGE 01</span>
              <span className="material-symbols-outlined text-primary text-[20px]">laptop_chromebook</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-primary">Client-Side SHA-256 Hashing</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              The document raw byte stream is digested locally using standard WebCrypto APIs. No sensitive medical imagery or lab numbers leave browser memory.
            </p>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-surface-container-low gap-2 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-code-sm text-[10px] text-outline uppercase font-bold">STAGE 02</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">key_visualizer</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-primary">Zero-Knowledge Attestation Query</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Only the 32-byte cryptographic digest and issuer credential pointer are submitted across TLS 1.3 to the state healthcare PKI directory.
            </p>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-surface-container-low gap-2 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-code-sm text-[10px] text-outline uppercase font-bold">STAGE 03</span>
              <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">account_balance</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-primary">Trust Anchor Reconciliation</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Issuing hospital public keys match against the Federal Bridge Directory. OCSP checks ensure the authorizing physician’s license is currently active.
            </p>
          </div>
        </div>
      </div>

      {/* FHIR Canonical JSON Modal */}
      {showFhirJsonModal && (
        <div className="fixed inset-0 z-50 bg-primary/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl p-6 flex flex-col gap-4 shadow-2xl relative border border-outline-variant/30 max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">data_object</span>
                <h3 className="font-bold text-sm text-primary">HL7 FHIR R4 Canonical DiagnosticReport JSON</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFhirJsonModal(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-highest font-code-sm text-xs text-primary overflow-y-auto flex-1 font-mono leading-relaxed border border-outline-variant/30">
              <pre>{JSON.stringify(
                {
                  resourceType: 'DiagnosticReport',
                  id: 'DR-992-8021',
                  status: 'final',
                  category: [
                    {
                      coding: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB', display: 'Laboratory' }
                      ]
                    }
                  ],
                  code: {
                    coding: [{ system: 'http://loinc.org', code: '24323-8', display: 'Comprehensive metabolic 1998 panel' }]
                  },
                  subject: { reference: 'Patient/802-9914-EV', display: 'Eleanor Vance' },
                  effectiveDateTime: '2024-10-28T08:30:00-05:00',
                  issued: '2024-10-28T14:28:11Z',
                  performer: [
                    { reference: 'Organization/NM-84920', display: 'Northwestern Memorial Hospital Pathology Lab' }
                  ],
                  presentedForm: [
                    {
                      contentType: 'application/pdf',
                      title: 'Northwestern_Pathology_Lipid_Panel_2024.pdf',
                      size: 1929384,
                      hash: digestHash
                    }
                  ],
                  extension: [
                    {
                      url: 'http://hl7.org/fhir/StructureDefinition/attestation-pki',
                      valueSignature: {
                        type: [{ code: 'urn:iso-astm:E1762-95:2013:1.2.840.10065.1.12.1.1' }],
                        when: '2024-10-28T14:28:11Z',
                        who: { display: 'Northwestern Memorial Authority' },
                        targetFormat: 'application/pdf',
                        sigFormat: 'application/pkcs7-signature',
                        data: 'MIIEvQYJKoZIhvcNAQcCoIIErjCCBKow...'
                      }
                    }
                  ]
                },
                null,
                2
              )}</pre>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(digestHash);
                  showToast('Canonical FHIR payload copied to clipboard');
                }}
                className="px-4 py-2 rounded-lg bg-surface-container text-primary font-semibold text-xs hover:bg-surface-container-high transition-colors"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={() => setShowFhirJsonModal(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-colors"
              >
                Close
              </button>
            </div>
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
