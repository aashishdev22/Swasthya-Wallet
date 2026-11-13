/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MedicalRecord } from '../data/mockData.ts';

interface DicomViewerModalProps {
  record: MedicalRecord | null;
  onClose: () => void;
}

export const DicomViewerModal: React.FC<DicomViewerModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const [activeSeries, setActiveSeries] = useState<'PA' | 'LAT'>('PA');
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [inverted, setInverted] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setInverted(false);
    setZoom(1);
    showToast('Viewer filters reset to DICOM baseline');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-primary w-full max-w-4xl h-[92vh] rounded-2xl flex flex-col overflow-hidden border border-outline-variant/30 text-on-primary">
        {/* Top Header Bar */}
        <div className="h-14 px-4 bg-primary-container border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary-fixed text-[22px]">radiology</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-white">
                  DICOM Medical Viewer • {record.title}
                </span>
                <span className="font-code-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.2 rounded font-bold">
                  PACS-VALID
                </span>
              </div>
              <span className="font-code-sm text-[10px] text-primary-fixed-dim">
                PATIENT: AARAV SHARMA (DEL-8842-AS) • ABHA: 14-8842-9914-2024 • STUDY ID: RAD-XR-0442
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container/20 flex items-center justify-center text-white hover:bg-surface-container/40"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Viewer Toolbar */}
        <div className="bg-primary/95 px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs font-code-sm flex-wrap gap-2">
          {/* Series Switcher */}
          <div className="flex items-center gap-1.5 bg-primary-container p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSeries('PA')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                activeSeries === 'PA' ? 'bg-secondary text-white' : 'text-primary-fixed hover:text-white'
              }`}
            >
              Series 01: PA View
            </button>
            <button
              type="button"
              onClick={() => setActiveSeries('LAT')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                activeSeries === 'LAT' ? 'bg-secondary text-white' : 'text-primary-fixed hover:text-white'
              }`}
            >
              Series 02: Lateral View
            </button>
          </div>

          {/* Adjustments */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInverted(!inverted)}
              className={`px-2.5 py-1 rounded flex items-center gap-1 text-xs border ${
                inverted ? 'bg-white text-primary font-bold' : 'bg-primary-container text-white border-white/20'
              }`}
              title="Invert Monochromatic Grayscale"
            >
              <span className="material-symbols-outlined text-[15px]">invert_colors</span>
              <span>{inverted ? 'Inverted' : 'Invert'}</span>
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
              className="p-1 rounded bg-primary-container hover:bg-white/10"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-1 rounded bg-primary-container hover:bg-white/10"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_out</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded bg-primary-container text-xs hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden select-none p-4">
          <div
            className="transition-transform duration-150 origin-center max-w-full max-h-full flex items-center justify-center"
            style={{
              transform: `scale(${zoom})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) ${inverted ? 'invert(1)' : ''}`,
            }}
          >
            <img
              src={record.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDxDdcrfqVQXufhxt2kO3aEQK9PIIXh3vEKGR_y0TffPpERmaiVXGp-3qeTitmsBEOY3uy4zVjqkGuX1YpwG6__FIUHwKWLcTpDTX65QJLQsOrF_-56mG2-xXiCk9qTiqbpbkNekPdYQVgGm-apf0p13hfWWLLq5DfI6_cqv-yEzxFUB6J6alSW6aiG7nnIgzG-O6Uo6woLM2I7PeB-KiSRF2SPin7nS3tNz5kNZNQqH8b6f2fjzhyZw'}
              alt="Chest X-Ray DICOM View"
              className="max-h-[60vh] object-contain rounded shadow-2xl"
            />
          </div>

          {/* Clinical Telemetry Grid Overlay */}
          <div className="absolute top-4 left-4 font-code-sm text-[11px] text-green-400/90 pointer-events-none space-y-0.5 bg-black/60 p-2 rounded backdrop-blur-xs">
            <div>MODALITY: CR (Digital Radiography)</div>
            <div>SERIES: {activeSeries === 'PA' ? 'PA POSTEROANTERIOR' : 'LAT LEFT LATERAL'}</div>
            <div>KVp: 120 • mA: 320 • Exp: 12ms</div>
            <div>MATRIX: 2048 x 2048 x 16-bit</div>
          </div>

          <div className="absolute top-4 right-4 font-code-sm text-[11px] text-green-400/90 pointer-events-none space-y-0.5 bg-black/60 p-2 rounded backdrop-blur-xs text-right">
            <div>W: 400 • L: 40</div>
            <div>ZOOM: {Math.round(zoom * 100)}%</div>
            <div>NORTHWESTERN MEMORIAL RADIOLOGY</div>
            <div>DR. KEVIN VANCE, MD</div>
          </div>
        </div>

        {/* Bottom Diagnostics Strip */}
        <div className="p-4 bg-primary-container border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="max-w-xl">
            <span className="font-bold text-white block">Radiology Impression:</span>
            <p className="text-primary-fixed-dim mt-0.5 leading-snug">
              {record.impression || 'Clear lung fields bilaterally. Cardiothoracic silhouette within normal physiological dimensions.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => showToast('DICOM ISO byte package download initiated (14.2 MB)')}
              className="px-3.5 py-2 rounded-lg bg-secondary text-white font-semibold text-xs hover:bg-secondary/90 transition-colors"
            >
              Download DICOM ISO
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-surface/10 text-white font-semibold text-xs hover:bg-surface/20 transition-colors"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-secondary-fixed text-on-secondary-fixed px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
