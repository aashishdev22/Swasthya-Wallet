/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MedicalRecord } from '../data/mockData.ts';
import { SupportedLanguage, getTranslation, formatIndianDate } from '../utils/i18n.ts';

interface RecordDetailModalProps {
  record: MedicalRecord | null;
  onClose: () => void;
  onDeleteRecord: (id: string) => void;
  onUpdateMetadata: (id: string, newTitle: string, newCategory: string) => void;
  onShareRecord: (record: MedicalRecord) => void;
  currentLang?: SupportedLanguage;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onDeleteRecord,
  onUpdateMetadata,
  onShareRecord,
  currentLang = 'en',
}) => {
  if (!record) return null;
  const t = getTranslation(currentLang);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteInputText, setDeleteInputText] = useState<string>('');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit metadata form state
  const [editTitle, setEditTitle] = useState<string>(record.title);
  const [editCategory, setEditCategory] = useState<string>(record.category);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 1.4) setZoomLevel((z) => Math.min(1.4, z + 0.1));
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.8) setZoomLevel((z) => Math.max(0.8, z - 0.1));
  };

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(record.sha256);
    showToast('SHA-256 Checksum copied to clipboard');
  };

  const handlePrint = () => {
    handleDownloadPdf();
  };

  const handleDownloadPdf = () => {
    const biomarkersHtml = record.biomarkers && record.biomarkers.length > 0
      ? `
        <table style="width:100%; border-collapse: collapse; margin-top: 14px; font-size: 13px;">
          <thead>
            <tr style="background:#f1f5f9; text-align:left;">
              <th style="padding:8px 10px; border:1px solid #cbd5e1;">Test Parameter</th>
              <th style="padding:8px 10px; border:1px solid #cbd5e1;">Value</th>
              <th style="padding:8px 10px; border:1px solid #cbd5e1;">Reference Range</th>
              <th style="padding:8px 10px; border:1px solid #cbd5e1;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${record.biomarkers.map(b => `
              <tr>
                <td style="padding:8px 10px; border:1px solid #cbd5e1; font-weight:600;">${b.name}</td>
                <td style="padding:8px 10px; border:1px solid #cbd5e1;">${b.value} ${b.unit}</td>
                <td style="padding:8px 10px; border:1px solid #cbd5e1; color:#64748b;">${b.ref}</td>
                <td style="padding:8px 10px; border:1px solid #cbd5e1; font-weight:bold; color:${b.status === 'NORMAL' || b.status === 'OPTIMAL' ? '#059669' : '#d97706'};">${b.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '';

    const contentHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${record.title} - Swasthya Health Record</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 32px; color: #0f172a; line-height: 1.5; background: #fff; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
    .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; display: inline-block; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
    .val { font-size: 13px; font-weight: 600; color: #0f172a; }
    .section { margin-bottom: 14px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 11px; color: #64748b; font-family: monospace; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:15px; font-weight:bold; color:#0369a1;">${record.hospital}</div>
      <div class="title">${record.title}</div>
      <div style="font-size:12px; color:#475569; margin-top:2px;">Attending Clinician: ${record.clinician}</div>
    </div>
    <div style="text-align:right;">
      <span class="badge">OFFICIAL & TAMPER-PROOF</span>
      <div style="font-size:12px; margin-top:6px; color:#475569;">Date: ${formatIndianDate(record.date)}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="label">Patient Full Name</div>
      <div class="val">Aarav Sharma</div>
      <div class="label" style="margin-top:8px;">ABHA Health ID</div>
      <div class="val">14-8842-9914-2024</div>
    </div>
    <div>
      <div class="label">Clinical Standard & Code</div>
      <div class="val">${record.code} (${record.category.toUpperCase()})</div>
      <div class="label" style="margin-top:8px;">Verification Digest</div>
      <div class="val" style="font-family: monospace; font-size:11px;">SHA-256 Validated</div>
    </div>
  </div>

  ${record.indication ? `<div class="section"><div class="label">Clinical Indication</div><div class="val" style="font-style:italic;">"${record.indication}"</div></div>` : ''}
  ${record.impression ? `<div class="section"><div class="label">Physician Impression / Findings</div><div class="val">${record.impression}</div></div>` : ''}
  ${record.dosageSig ? `<div class="section"><div class="label">Prescribed Dosage & Regimen</div><div class="val">${record.dosageSig}</div></div>` : ''}
  ${biomarkersHtml}

  <div class="footer">
    <div>SHA-256 INTEGRITY DIGEST: ${record.sha256}</div>
    <div>STANDARDS: HL7 FHIR R4 • Ayushman Bharat Digital Mission (ABDM)</div>
    <div>Exported from Swasthya Health Wallet for offline storage, emergency access, and clinical printing.</div>
  </div>
</body>
</html>`;

    const blob = new Blob([contentHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Swasthya_${record.title.replace(/[^a-zA-Z0-9]/g, '_')}_Record.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    showToast('Download as PDF generated. Ready for offline printing and storage.');
  };

  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMetadata(record.id, editTitle, editCategory);
    setIsEditModalOpen(false);
    showToast('Permitted metadata updated in patient vault');
  };

  const handleConfirmDelete = () => {
    if (deleteInputText.trim().toUpperCase() === 'DELETE') {
      onDeleteRecord(record.id);
      setIsDeleteModalOpen(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-primary/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn overflow-y-auto">
      <div className="bg-surface w-full max-w-3xl rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="h-16 px-5 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-primary hover:bg-surface-container transition-colors"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-bold text-primary truncate">Record Detail View</h2>
              <span className="font-code-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                FHIR R4 SECURED • {record.code}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="h-9 px-3 rounded-lg bg-primary-container text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary transition-colors cursor-pointer"
              title="Download as PDF for offline printing or storage"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="hidden sm:inline">Download as PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onShareRecord(record)}
              className="h-9 px-3 rounded-lg bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-secondary-fixed-dim transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              <span className="hidden sm:inline">Share SMART Link</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          {/* Status & FHIR Telemetry Ribbon */}
          <div className="bg-surface-container-high rounded-xl p-3 shadow-xs border border-outline-variant/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse shrink-0"></span>
                <span className="font-code-sm text-xs text-primary font-bold tracking-tight truncate">
                  REC-{record.id.toUpperCase()} • FHIR R4 OBSERVATION
                </span>
              </div>
              <span className="font-code-sm text-[10px] bg-surface-container-lowest text-primary px-2 py-0.5 rounded font-bold shadow-xs">
                SHA-256 VALID
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-1 text-on-tertiary-container font-semibold">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Cryptographically Verified & Anchored
              </span>
              <span className="font-code-sm text-[10px] uppercase bg-surface-container text-on-surface px-2 py-0.5 rounded">
                Category: {record.category.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Embedded Medical PDF Reader Simulation */}
          <div className="bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="bg-surface-container-high px-4 py-2 flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">picture_as_pdf</span>
                <span className="font-code-sm text-xs text-primary font-semibold truncate max-w-[200px] sm:max-w-md">
                  {record.title.replace(/\s+/g, '_')}_REV3.pdf
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                  title="Zoom in"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <span className="font-code-sm text-xs text-on-surface-variant px-2 py-0.5 rounded bg-surface-container font-mono">
                  {currentPage} / 3
                </span>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                  title="Zoom out"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                  title="Print document"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                </button>
              </div>
            </div>

            {/* Document Canvas Content */}
            <div
              className="p-5 sm:p-6 bg-surface-container-lowest transition-transform duration-200 origin-top flex flex-col gap-4"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Clinic Letterhead */}
              <div className="flex items-start justify-between pb-3 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-[22px] text-secondary">local_hospital</span>
                    <p className="font-bold text-sm uppercase tracking-tight text-primary leading-tight">
                      {record.hospital}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Clinical Pathology & Diagnostic Laboratory</p>
                  <p className="font-code-sm text-[10px] text-on-surface-variant">CLIA ID: #14D0645932 • CAP Accredited</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-code-sm text-[10px] bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded font-bold tracking-wider">
                    OFFICIAL
                  </span>
                  <p className="font-code-sm text-xs text-on-surface-variant mt-1">{formatIndianDate(record.date)}</p>
                </div>
              </div>

              {/* Specimen & Patient Demographics */}
              <div className="grid grid-cols-2 gap-3 bg-surface-container-high/40 p-3 rounded-xl text-xs border border-outline-variant/20">
                <div>
                  <p className="font-code-sm text-[10px] text-on-surface-variant uppercase font-bold">Patient Name</p>
                  <p className="font-bold text-sm text-primary">Aarav Sharma</p>
                  <p className="font-code-sm text-[10px] text-on-surface-variant mt-0.5">ABHA: 14-8842-9914-2024</p>
                </div>
                <div>
                  <p className="font-code-sm text-[10px] text-on-surface-variant uppercase font-bold">Collection Info</p>
                  <p className="text-on-surface font-medium">{formatIndianDate(record.date)} • 07:30 AM IST</p>
                  <p className="font-code-sm text-[10px] text-on-surface-variant mt-0.5">Specimen: Venous Blood Serum</p>
                </div>
              </div>

              {/* Title Header */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-primary">{record.title}</h3>
                <p className="font-code-sm text-xs text-secondary font-semibold uppercase">{record.code} Synthesis</p>
              </div>

              {/* Biomarkers Table / Details */}
              {record.biomarkers && (
                <div className="space-y-1.5">
                  {record.biomarkers.map((b) => (
                    <div
                      key={b.name}
                      className="bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between gap-2 border border-outline-variant/10 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                          <span className="font-semibold text-on-surface truncate">{b.name}</span>
                        </div>
                        <span className="font-code-sm text-[10px] text-on-surface-variant">Ref: {b.ref}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-bold text-primary">{b.value}</span>
                        <span className="font-code-sm text-[10px] text-on-surface-variant block font-semibold">
                          {b.unit} • {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Electronic Signature Metadata */}
              <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between border border-outline-variant/20">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[24px]">draw</span>
                  <div>
                    <p className="text-xs font-bold text-primary leading-tight">{record.clinician}</p>
                    <p className="font-code-sm text-[10px] text-on-surface-variant">Attending Clinician • Lic #IL-4921008</p>
                  </div>
                </div>
                <span className="font-code-sm text-[10px] text-on-tertiary-container bg-surface-container-lowest px-2 py-1 rounded shadow-xs font-bold">
                  ESIGN AUTH
                </span>
              </div>
            </div>

            {/* Quick Actions Inside Reader */}
            <div className="p-3 bg-surface-container-high/60 flex items-center justify-between gap-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(true)}
                className="flex-1 py-2 px-3 rounded-lg bg-surface-container-lowest text-primary font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                <span>Expand Full View</span>
              </button>
              <button
                type="button"
                onClick={() => showToast('PDF Export generated')}
                className="py-2 px-4 rounded-lg bg-primary-container text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Permitted Metadata & FHIR Index Card (Editable) */}
          <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-low mb-3">
              <div>
                <h3 className="text-sm font-bold text-primary">Metadata & FHIR Index</h3>
                <p className="text-xs text-on-surface-variant">Validated against synthetic hospital PKI key registry</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                title="Edit permitted metadata"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant uppercase block">Record Title</span>
                  <span className="font-semibold text-primary">{record.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-secondary font-code-sm text-[10px] font-bold uppercase hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant uppercase block">Clinical Category</span>
                  <span className="text-primary font-medium">{record.category.toUpperCase()} ({record.code})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-secondary font-code-sm text-[10px] font-bold uppercase hover:underline"
                >
                  Change
                </button>
              </div>

              {/* SHA-256 Checksum Inset */}
              <div className="bg-secondary-fixed/30 p-3 rounded-lg border border-secondary/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-primary">{record.fileFormat} Document • {record.fileSize}</span>
                  <span className="font-code-sm text-[10px] bg-surface-container-lowest px-1.5 py-0.5 rounded text-secondary font-bold">
                    HL7 FHIR v4.0.1
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">
                  <div className="min-w-0">
                    <span className="font-code-sm text-[9px] text-outline uppercase block font-bold">SHA-256 Checksum</span>
                    <span className="font-code-sm text-[10px] text-primary font-mono truncate block">{record.sha256}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="p-1.5 rounded bg-surface-container text-primary hover:bg-surface-container-high transition-colors shrink-0"
                    title="Copy Checksum"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone: Delete Record Card */}
          <div className="bg-error-container/30 rounded-xl p-4 sm:p-5 border border-error/20 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[22px]">warning</span>
              <h3 className="text-sm font-bold text-error">Delete or Archive Record</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Deleting will remove this record from your active wallet index and immediately revoke active SMART-on-FHIR sharing endpoints. A 30-day compliance recovery archive is retained per federal data custody protocols.
            </p>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full h-11 rounded-lg bg-error text-on-error font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              <span>Delete Record with Confirmation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 shadow-2xl border border-outline-variant/30">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">edit_note</span>
                <h3 className="font-bold text-sm text-primary">Edit Permitted Metadata</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-primary mb-1">Record Title Display</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary border border-outline-variant/30"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-primary mb-1">Clinical Taxonomy Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary border border-outline-variant/30"
                >
                  <option value="lab">Laboratory Reports</option>
                  <option value="imaging">Diagnostic Imaging</option>
                  <option value="prescription">Prescriptions</option>
                  <option value="notes">Doctor Notes</option>
                  <option value="discharge">Discharge Summaries</option>
                </select>
              </div>

              <div className="p-2.5 bg-surface-container-low rounded-lg text-on-surface-variant text-[11px]">
                Note: Changing metadata does not modify clinical observations or cryptographic payload signatures generated by the issuer.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-10 rounded-lg bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Requires typing 'DELETE') */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 flex flex-col gap-3 shadow-2xl border border-outline-variant/30 text-center">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto mb-1">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <h3 className="font-bold text-base text-error">Confirm Record Deletion</h3>
            <p className="text-xs text-on-surface leading-relaxed">
              Are you sure you want to delete <strong className="text-primary font-semibold">"{record.title}"</strong>?
            </p>
            <div className="bg-error-container/40 p-2.5 rounded-lg text-[11px] text-error font-medium">
              Type <strong className="underline">DELETE</strong> below to authorize removal.
            </div>
            <input
              type="text"
              placeholder="Type DELETE"
              value={deleteInputText}
              onChange={(e) => setDeleteInputText(e.target.value)}
              className="w-full h-11 px-3 bg-surface-container-low text-center font-code-sm text-xs uppercase tracking-widest text-primary rounded-lg border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest"
            />
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 h-10 rounded-lg bg-surface-container text-on-surface font-semibold text-xs hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteInputText.trim().toUpperCase() !== 'DELETE'}
                onClick={handleConfirmDelete}
                className="flex-1 h-10 rounded-lg bg-error text-on-error font-semibold text-xs hover:bg-error/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen PDF Modal */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface flex flex-col p-4 animate-fadeIn">
          <div className="h-14 px-4 bg-primary text-on-primary rounded-t-xl flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm">{record.title} (Fullscreen Review)</span>
            <button
              type="button"
              onClick={() => setIsFullscreenOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex-1 bg-surface-container-lowest p-6 overflow-y-auto rounded-b-xl flex flex-col items-center justify-center">
            <div className="max-w-xl w-full text-center space-y-4">
              <span className="material-symbols-outlined text-[64px] text-primary">picture_as_pdf</span>
              <h4 className="text-base font-bold text-primary">{record.title}</h4>
              <p className="text-xs text-on-surface-variant font-code-sm">Checksum: {record.sha256}</p>
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
              >
                Exit Fullscreen
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
