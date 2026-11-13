/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Dedicated Record Details Page
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState, useEffect } from 'react';
import { MedicalRecord, PatientProfile } from '../data/mockData.ts';
import { SupportedLanguage, getTranslation, formatIndianDate } from '../utils/i18n.ts';
import { RecordCategoryIcon } from './CategoryIcon.tsx';
import { syncEngine, SyncStatusInfo } from '../utils/syncEngine.ts';
import { getDriveFileId } from '../utils/googleDrive.ts';

interface RecordDetailsViewProps {
  record: MedicalRecord;
  patient: PatientProfile;
  currentLang?: SupportedLanguage;
  onBack: () => void;
  onShare: (record: MedicalRecord) => void;
  onDelete: (id: string, policy: 'delete_everywhere' | 'local_only' | 'archive') => void;
  onUpdateMetadata?: (id: string, title: string, category: string) => void;
}

export const RecordDetailsView: React.FC<RecordDetailsViewProps> = ({
  record,
  patient,
  currentLang = 'en',
  onBack,
  onShare,
  onDelete,
  onUpdateMetadata,
}) => {
  const _t = getTranslation(currentLang);

  // Document Viewer Zoom controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>(record.title);
  const [editedCategory, setEditedCategory] = useState<string>(record.category);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletePolicy, setDeletePolicy] = useState<'delete_everywhere' | 'local_only' | 'archive'>('delete_everywhere');
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(() => syncEngine.getStatus());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setEditedTitle(record.title);
    setEditedCategory(record.category);
  }, [record.id, record.title, record.category]);

  useEffect(() => {
    return syncEngine.subscribe(setSyncStatus);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoomLevel(100);

  const handleDownload = () => {
    const biomarkersHtml =
      record.biomarkers && record.biomarkers.length > 0
        ? `<table style="width:100%; border-collapse:collapse; margin-top:14px; font-size:13px;">
            <thead><tr style="background:#f1f5f9; text-align:left;">
              <th style="padding:8px; border:1px solid #cbd5e1;">Parameter</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">Value</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">Reference</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">Status</th>
            </tr></thead>
            <tbody>${record.biomarkers
              .map(
                (b) => `<tr>
                  <td style="padding:8px; border:1px solid #cbd5e1; font-weight:600;">${b.name}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1;">${b.value} ${b.unit}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1;">${b.ref}</td>
                  <td style="padding:8px; border:1px solid #cbd5e1; font-weight:bold;">${b.status}</td>
                </tr>`
              )
              .join('')}</tbody></table>`
        : '';

    const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${record.title} - Swasthya Wallet</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; max-width: 800px; margin: 0 auto; }
    .hdr { border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .val { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="hdr">
    <div>
      <div style="font-size:12px; font-weight:700; color:#1e3a8a;">SWASTHYA WALLET • DIGITAL HEALTH LOCKER FOR CITIZENS</div>
      <h1 style="margin:4px 0; font-size:20px;">${record.title}</h1>
      <div style="font-size:12px; color:#475569;">${record.hospital} • ${record.clinician}</div>
    </div>
    <div style="text-align:right; font-size:12px;">
      <div><strong>Date:</strong> ${formatIndianDate(record.date)}</div>
      <div><strong>Code:</strong> ${record.code} (${record.codeStandard})</div>
    </div>
  </div>
  <div class="box">
    <div class="lbl">Citizen / Patient</div>
    <div class="val">${patient.name} • ABHA: ${patient.synthMrn}</div>
  </div>
  ${record.indication ? `<div class="box"><div class="lbl">Clinical Indication</div><div class="val">${record.indication}</div></div>` : ''}
  ${record.impression ? `<div class="box"><div class="lbl">Observations & Impression</div><div class="val">${record.impression}</div></div>` : ''}
  ${record.dosageSig ? `<div class="box"><div class="lbl">Prescription Dosage</div><div class="val">${record.dosageSig}</div></div>` : ''}
  ${record.ocrExtractedText ? `<div class="box"><div class="lbl">OCR Extracted Text</div><pre style="white-space:pre-wrap;font-size:12px;">${record.ocrExtractedText}</pre></div>` : ''}
  ${biomarkersHtml}
  <div style="margin-top:20px; font-family:monospace; font-size:11px; color:#64748b;">
    SHA-256 Digest: ${record.sha256}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Swasthya_${record.id}_${record.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(`Exported printable report for "${record.title}".`);
  };

  const handleSaveEdit = () => {
    if (onUpdateMetadata) {
      onUpdateMetadata(record.id, editedTitle, editedCategory);
    }
    setIsEditing(false);
    showToast('Record metadata updated and synced.');
  };

  const handleConfirmDelete = () => {
    onDelete(record.id, deletePolicy);
    setShowDeleteConfirm(false);
  };

  const driveFileId = record.driveFileId || getDriveFileId(record.id);
  const storageStatusLabel =
    syncStatus.driveConnected && driveFileId
      ? 'Saved on Device (IndexedDB) & Synced to Google Drive'
      : syncStatus.pendingCount > 0
      ? 'Saved on Device (IndexedDB) • Cloud Sync Pending'
      : 'Saved on Device (Encrypted IndexedDB)';

  return (
    <div className="w-full flex flex-col gap-6 font-sans pb-16 animate-fadeIn">
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Top Navigation & Action Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer self-start"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Records</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onShare(record)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            <span>Share Record</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Download / Print</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Record Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* Record Header with Category-Specific Icon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <RecordCategoryIcon record={record} size={28} />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                  {record.category.toUpperCase()}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>{record.integrityStatus || 'ABHA Verified'}</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {record.code} ({record.codeStandard})
                </span>
              </div>

              {isEditing ? (
                <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 w-full sm:w-80"
                  />
                  <select
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="lab">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="imaging">Diagnostic / Imaging</option>
                    <option value="notes">Medical History / Doctor Notes</option>
                    <option value="discharge">Discharge Summary</option>
                    <option value="other">Other Medical Document</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 leading-tight">
                  {record.title}
                </h1>
              )}

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Record ID: <span className="font-mono text-slate-700">{record.id}</span>
                {record.version ? ` • v${record.version}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metadata & Clinical Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">1. Record Date</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {formatIndianDate(record.date)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">2. Upload / Sealed Date</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {record.uploadedAt || `${formatIndianDate(record.date)} (Indexed in Locker)`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">3. Prescribing Doctor</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
              {record.clinician}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">4. Hospital / Lab Facility</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
              {record.hospital}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">5. Citizen / Patient</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {patient.name} ({patient.age} yrs • {patient.bloodType})
            </span>
            <span className="text-[11px] text-slate-500">ABHA: {patient.synthMrn}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium block">6. Storage & Sync State</span>
            <div
              className={`flex items-center gap-1.5 mt-1 text-xs font-semibold ${
                syncStatus.driveConnected && driveFileId
                  ? 'text-emerald-800'
                  : syncStatus.pendingCount > 0
                  ? 'text-amber-800'
                  : 'text-blue-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus.driveConnected && driveFileId
                    ? 'bg-emerald-500'
                    : syncStatus.pendingCount > 0
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
              ></span>
              <span>{storageStatusLabel}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Size: {record.fileSize} • {record.fileFormat}
              {record.originalDocumentName ? ` • ${record.originalDocumentName}` : ''}
            </span>
          </div>
        </div>

        {/* Medical Findings, Biomarkers & Test Results */}
        {record.biomarkers && record.biomarkers.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-800">analytics</span>
                <span>Medical Findings & Blood Biomarkers ({record.biomarkers.length} Parameters)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Standard Reference Range Included</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-semibold">Test Parameter</th>
                    <th className="pb-2 font-semibold">Result Value</th>
                    <th className="pb-2 font-semibold">Reference Range</th>
                    <th className="pb-2 font-semibold">Clinical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {record.biomarkers.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/50">
                      <td className="py-2.5 font-bold text-slate-800">{b.name}</td>
                      <td className="py-2.5 font-mono font-bold text-slate-900">
                        {b.value} <span className="text-[11px] font-normal text-slate-500">{b.unit}</span>
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono">{b.ref}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'OPTIMAL' || b.status === 'NORMAL'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clinical Observations, Dosage & OCR-Extracted Information */}
        {(record.indication || record.impression || record.dosageSig || record.ocrExtractedText) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {record.indication && (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  Clinical Indication / Reason for Visit
                </span>
                <p className="text-xs sm:text-sm text-slate-800 mt-1.5 leading-relaxed font-medium">
                  {record.indication}
                </p>
              </div>
            )}

            {record.impression && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Doctor's Observations & Impression
                </span>
                <p className="text-xs sm:text-sm text-slate-800 mt-1.5 leading-relaxed font-medium">
                  {record.impression}
                </p>
              </div>
            )}

            {record.dosageSig && (
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 md:col-span-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Prescription Dosage & Directions
                </span>
                <p className="text-xs sm:text-sm text-amber-950 mt-1.5 font-medium">
                  {record.dosageSig}
                </p>
                {record.refillsLeft !== undefined && (
                  <div className="mt-2 text-[11px] text-amber-800">
                    Refills Available: {record.refillsLeft} of {record.totalRefills}
                  </div>
                )}
              </div>
            )}

            {record.ocrExtractedText && (
              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/70 md:col-span-2">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  OCR-Extracted Information
                </span>
                <pre className="text-xs text-slate-800 mt-1.5 whitespace-pre-wrap font-sans leading-relaxed">
                  {record.ocrExtractedText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Document Previewer with Zoom Controls */}
        <div className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-900 text-white flex flex-col">
          <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-400">preview</span>
              <span className="text-xs font-bold">
                Document Previewer ({record.fileFormat})
                {record.originalDocumentName ? ` — ${record.originalDocumentName}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-slate-200 cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <span className="px-2 py-0.5 font-mono text-[11px] text-slate-300">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center font-bold text-slate-200 cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-medium text-slate-300 ml-1 cursor-pointer"
              >
                Fit
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-950 flex items-center justify-center min-h-[280px] sm:min-h-[380px] overflow-auto">
            {record.imageUrl ? (
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                className="transition-transform duration-150 max-w-full"
              >
                <img
                  src={record.imageUrl}
                  alt={record.title}
                  className="rounded-xl max-h-[380px] object-contain shadow-2xl border border-slate-800"
                />
              </div>
            ) : (
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                className="w-full max-w-md bg-white text-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 transition-transform duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <span className="font-bold text-blue-900">ABDM Digital Health Record</span>
                  <span className="text-emerald-700 font-semibold">● Sealed</span>
                </div>
                <div className="py-4 space-y-2 text-xs">
                  <div className="font-bold text-sm text-slate-900">{record.title}</div>
                  <div className="text-slate-600">Patient: {patient.name} (ABHA: {patient.synthMrn})</div>
                  <div className="text-slate-600">Prescribing Doctor: {record.clinician}</div>
                  <div className="text-slate-600">Laboratory / Clinic: {record.hospital}</div>
                  <div className="text-slate-600">Date: {formatIndianDate(record.date)}</div>
                  {record.indication && (
                    <div className="p-2 bg-slate-50 rounded text-slate-700 italic border border-slate-100">
                      "{record.indication}"
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400 font-mono truncate">
                  SHA-256: {record.sha256}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cryptographic Seal & Security Audit */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cryptographic Integrity Digest
            </span>
            <span className="font-mono text-slate-700 text-[11px] break-all block mt-0.5">
              {record.sha256}
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold whitespace-nowrap self-start sm:self-auto">
            ABDM Sealed & Verified
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-700">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="font-bold text-base text-slate-900">Delete Medical Record?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{record.title}"</span>?
              Please choose how you would like this deletion to apply across your storage locations.
            </p>

            <div className="flex flex-col gap-2 text-xs">
              <label className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="policy"
                  checked={deletePolicy === 'delete_everywhere'}
                  onChange={() => setDeletePolicy('delete_everywhere')}
                  className="mt-0.5 text-blue-900"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Delete Everywhere (Recommended)</span>
                  <span className="text-slate-500 text-[11px]">
                    Removes from local mobile device, Google Drive backup, and Supabase metadata.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="policy"
                  checked={deletePolicy === 'archive'}
                  onChange={() => setDeletePolicy('archive')}
                  className="mt-0.5 text-blue-900"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Archive Record</span>
                  <span className="text-slate-500 text-[11px]">
                    Hides from active list while preserving encrypted historical copy in Google Drive.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
