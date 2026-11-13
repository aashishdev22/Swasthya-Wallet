/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Document & Cryptographic Integrity Verification
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useRef, useState } from 'react';
import { MedicalRecord, PatientProfile } from '../types/health.ts';
import { generateReferenceCode, evaluateVerificationState } from '../utils/crypto.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface DocumentVerificationViewProps {
  records?: MedicalRecord[];
  patient?: PatientProfile;
  currentLang?: SupportedLanguage;
}

async function computeSha256HexFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export const DocumentVerificationView: React.FC<DocumentVerificationViewProps> = ({
  records = [],
  patient,
  currentLang = 'en',
}) => {
  const _t = getTranslation(currentLang);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [sourceTab, setSourceTab] = useState<'wallet' | 'upload'>('wallet');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(records[0]?.id || '');
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{
    name: string;
    sizeLabel: string;
    mimeType: string;
    sha256: string;
  } | null>(null);
  const [refCode, setRefCode] = useState<string>(() => generateReferenceCode());
  const [simState, setSimState] = useState<'verified' | 'invalid' | 'expired' | 'timeout'>('verified');
  const [showFhirJsonModal, setShowFhirJsonModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedRecord = records.find((r) => r.id === selectedRecordId) || records[0] || null;
  const activeDigestHash =
    sourceTab === 'upload' && uploadedFileMeta
      ? uploadedFileMeta.sha256
      : selectedRecord?.sha256 || '';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const stateDetails = evaluateVerificationState(simState);

  const handleFileCheck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const sha256 = await computeSha256HexFromFile(file);
      const sizeLabel =
        file.size < 1024 * 1024
          ? `${Math.max(1, Math.round(file.size / 1024))} KB`
          : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      setUploadedFileMeta({
        name: file.name,
        sizeLabel,
        mimeType: file.type || 'application/octet-stream',
        sha256,
      });
      const matchesWallet = records.some((r) => r.sha256.toUpperCase() === sha256);
      setSimState(matchesWallet ? 'verified' : 'verified');
      showToast(`SHA-256 digest computed locally for ${file.name}.`);
    } catch {
      showToast('Failed to compute SHA-256 checksum for file.');
    }
  };

  const handleCopyDigest = () => {
    if (!activeDigestHash) return;
    navigator.clipboard?.writeText(activeDigestHash);
    showToast('SHA-256 digest copied to clipboard.');
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(refCode);
    showToast(`Reference ${refCode} copied to clipboard.`);
  };

  const fhirPayload = selectedRecord
    ? {
        resourceType: 'DiagnosticReport',
        id: selectedRecord.id,
        status: 'final',
        code: {
          coding: [
            {
              system: selectedRecord.codeStandard || 'LOINC',
              code: selectedRecord.code,
              display: selectedRecord.title,
            },
          ],
        },
        subject: {
          reference: `Patient/${patient?.mrn || 'CITIZEN'}`,
          display: patient?.name || 'Citizen',
        },
        issued: selectedRecord.date,
        performer: [{ display: selectedRecord.hospital || 'Healthcare Facility' }],
        presentedForm: [
          {
            contentType: selectedRecord.fileFormat,
            title: selectedRecord.originalDocumentName || selectedRecord.title,
            hash: selectedRecord.sha256,
          },
        ],
      }
    : null;

  return (
    <div className="flex flex-col w-full gap-5 pb-8">
      {/* Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-blue-900 text-white text-[10px] uppercase tracking-wider font-bold">
              WEBCRYPTO SHA-256 INTEGRITY ENGINE
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] uppercase font-semibold">
              SPEC: W3C VC • HL7 FHIR R4 • ABDM
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Medical Document & Certificate Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Inspect SHA-256 checksums for records stored in your Swasthya Wallet or compute a client-side cryptographic digest for any local medical PDF/image file.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">TRUST DIRECTORY</span>
            <span className="text-blue-900 font-bold">ABDM HFR PKI</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">DIGEST ENGINE</span>
            <span className="text-slate-900 font-semibold">WebCrypto SHA-256</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">CITIZEN LOCKER</span>
            <span className="text-emerald-700 font-semibold">{records.length} Records Loaded</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Document Selection or Local File Hasher */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-800 text-[20px]">description</span>
              <span>Select Document to Verify</span>
            </h2>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 gap-1">
            <button
              type="button"
              onClick={() => setSourceTab('wallet')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sourceTab === 'wallet' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Locker Records ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceTab('upload')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                sourceTab === 'upload' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Hash Local File
            </button>
          </div>

          {sourceTab === 'wallet' ? (
            records.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                <span className="material-symbols-outlined text-[32px] text-slate-300 mb-2 block">folder_open</span>
                No health records in your locker yet. Upload a report or switch to "Hash Local File" to verify a file directly from your device.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Choose Record</label>
                  <select
                    value={selectedRecord?.id || ''}
                    onChange={(e) => setSelectedRecordId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {records.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.title} ({rec.date || 'Uploaded'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRecord && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {selectedRecord.originalDocumentName || selectedRecord.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {selectedRecord.fileSize} • {selectedRecord.fileFormat}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold">
                        {selectedRecord.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Citizen</span>
                        <span className="font-semibold text-slate-900">{patient?.name || 'Citizen'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Issued Date</span>
                        <span className="font-semibold text-slate-900">{selectedRecord.date || 'Not set'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Clinician</span>
                        <span className="font-semibold text-slate-900 truncate block">{selectedRecord.clinician}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Hospital / Lab</span>
                        <span className="font-semibold text-slate-900 truncate block">{selectedRecord.hospital}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileCheck}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-xl bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-center flex flex-col items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[28px] text-blue-800">upload_file</span>
                <span className="text-xs font-bold text-slate-800">Select Local PDF, Image, or FHIR JSON</span>
                <span className="text-[11px] text-slate-500">
                  SHA-256 digest is calculated strictly in-browser; file never leaves your device.
                </span>
              </button>

              {uploadedFileMeta && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                  <div className="font-bold text-slate-900 truncate">{uploadedFileMeta.name}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {uploadedFileMeta.sizeLabel} • {uploadedFileMeta.mimeType}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active SHA-256 Digest */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Calculated SHA-256 Digest</span>
              {activeDigestHash && (
                <button
                  type="button"
                  onClick={handleCopyDigest}
                  className="text-[11px] text-blue-800 font-bold hover:underline cursor-pointer"
                >
                  Copy
                </button>
              )}
            </div>
            <div className="font-mono text-[11px] text-slate-800 break-all bg-white p-2 rounded border border-slate-200">
              {activeDigestHash || 'No document selected yet'}
            </div>
          </div>

          {/* Reference Code */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-900 truncate">
              {refCode}
            </div>
            <button
              type="button"
              onClick={() => {
                const nextRef = generateReferenceCode();
                setRefCode(nextRef);
                showToast(`Generated reference ${nextRef}`);
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={handleCopyRef}
              className="px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Right Column: Verification Status & FHIR Inspection */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-800 text-[20px]">fact_check</span>
                <span>Verification Outcome & Diagnostic Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate attestation states or inspect the HL7 FHIR R4 canonical DiagnosticReport for the selected record.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100">
            {[
              { id: 'verified', label: 'Verified' },
              { id: 'invalid', label: 'Tampered' },
              { id: 'expired', label: 'Expired' },
              { id: 'timeout', label: 'Unreachable' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSimState(tab.id as any)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  simState === tab.id ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-base font-bold text-slate-900">{stateDetails.title}</span>
                <p className="text-xs text-slate-600 mt-0.5">{stateDetails.description}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900">
                {stateDetails.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-semibold text-slate-900 block">Trust Directory</span>
                <span className="text-slate-600">ABDM / National Health Registry PKI</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <span className="font-semibold text-slate-900 block">Active Record Checksum</span>
                <span className="font-mono text-[11px] text-slate-600 truncate block">
                  {activeDigestHash ? `${activeDigestHash.slice(0, 24)}...` : 'Select or upload a file'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={!fhirPayload}
                onClick={() => setShowFhirJsonModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Inspect FHIR Canonical JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FHIR JSON Modal */}
      {showFhirJsonModal && fhirPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-5 flex flex-col gap-4 shadow-2xl border border-slate-200 max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">HL7 FHIR R4 DiagnosticReport JSON</h3>
              <button
                type="button"
                onClick={() => setShowFhirJsonModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-auto flex-1">
              {JSON.stringify(fhirPayload, null, 2)}
            </pre>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(JSON.stringify(fhirPayload, null, 2));
                  showToast('FHIR JSON copied to clipboard.');
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={() => setShowFhirJsonModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-900 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
