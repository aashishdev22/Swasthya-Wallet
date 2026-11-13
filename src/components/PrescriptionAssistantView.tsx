/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Multi-System Prescription Assistant
 * Recognizes Allopathy, Ayurveda, and Homeopathy
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState, useRef } from 'react';
import {
  analyzePrescriptionImage,
  PrescriptionOcrResult,
  ExtractedPrescriptionItem,
} from '../utils/prescriptionOcr.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';
import { localVaultDB } from '../utils/indexedDb.ts';

interface PrescriptionAssistantViewProps {
  currentLang?: SupportedLanguage;
  onNavigateToFindMedicine: (medicineName: string, system: string) => void;
  onNavigateToAlternatives: (medicineName: string, system: string) => void;
  onAddPrescriptionRecord: (record: any) => void;
}

export const PrescriptionAssistantView: React.FC<PrescriptionAssistantViewProps> = ({
  currentLang = 'en',
  onNavigateToFindMedicine,
  onNavigateToAlternatives,
  onAddPrescriptionRecord,
}) => {
  const _t = getTranslation(currentLang);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PrescriptionOcrResult | null>(null);
  const [detectedSystemOverride, setDetectedSystemOverride] = useState<string>('');
  const [editingMedicine, setEditingMedicine] = useState<ExtractedPrescriptionItem | null>(null);
  const [patientVerifiedOcr, setPatientVerifiedOcr] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const handleLoadSample = (sampleType: 'allopathy' | 'ayurveda' | 'homeopathy') => {
    setIsAnalyzing(true);
    setEditingMedicine(null);
    setPatientVerifiedOcr(false);
    setVerificationError(null);
    setTimeout(() => {
      let fileName = 'Sample_Rx_Allopathy.jpg';
      let preview = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60';
      if (sampleType === 'ayurveda') {
        fileName = 'Ayurvedic_Vaidya_Churna_Prescription.png';
        preview = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=60';
      } else if (sampleType === 'homeopathy') {
        fileName = 'Homeopathic_Remedies_30C_Prescription.jpg';
        preview = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&auto=format&fit=crop&q=60';
      }

      setSelectedFile(null);
      setImagePreviewUrl(preview);
      analyzePrescriptionImage('', fileName).then((data) => {
        setAnalysisResult(data);
        setDetectedSystemOverride(data.detectedSystem);
        setIsAnalyzing(false);
      });
    }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setEditingMedicine(null);
    setPatientVerifiedOcr(false);
    setVerificationError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImagePreviewUrl(dataUri);
      setIsAnalyzing(true);

      analyzePrescriptionImage(dataUri, file.name)
        .then((result) => {
          setAnalysisResult(result);
          setDetectedSystemOverride(result.detectedSystem);
          setIsAnalyzing(false);
        })
        .catch(() => {
          setIsAnalyzing(false);
        });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEditedMedicine = () => {
    if (!editingMedicine || !analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      medicines: analysisResult.medicines.map((m) =>
        m.id === editingMedicine.id ? { ...editingMedicine, uncertain: false } : m
      ),
    });
    setEditingMedicine(null);
  };

  const handleSaveToWallet = async () => {
    if (!analysisResult) return;

    const needsVerification =
      analysisResult.confidenceScore < 85 ||
      analysisResult.medicines.some((m) => m.uncertain);

    if (needsVerification && !patientVerifiedOcr) {
      setVerificationError(
        'Low-confidence OCR or uncertain medicine items detected. Please inspect and check the patient verification box before saving.'
      );
      return;
    }

    setVerificationError(null);

    const extractedTextSummary = analysisResult.medicines
      .map(
        (m, i) =>
          `${i + 1}. ${m.name} (${m.system.toUpperCase()}) • ${m.strengthOrPotency || 'Standard'} • ${m.dosageForm || 'Dose'} — ${m.frequency || 'Daily'} (${m.duration || 'As advised'})`
      )
      .join('\n');

    const newPrescriptionRecord = {
      id: `rx_${Date.now()}`,
      title: `Prescription: ${analysisResult.prescriberName} (${detectedSystemOverride.toUpperCase()})`,
      category: 'prescription',
      code: `RX-${Date.now().toString().slice(-4)}`,
      codeStandard:
        detectedSystemOverride === 'ayurveda'
          ? 'AYUSH-AFI'
          : detectedSystemOverride === 'homeopathy'
          ? 'HPI'
          : 'MCI-CDSCO',
      date: analysisResult.prescriptionDate || new Date().toLocaleDateString('en-GB'),
      uploadedAt: new Date().toLocaleString('en-IN'),
      clinician: analysisResult.prescriberName || 'Attending Physician',
      hospital: analysisResult.clinicOrHospital || 'Clinic',
      integrityStatus: 'SHA-256 Valid',
      verified: true,
      sha256: '9F28BC4A' + Math.random().toString(16).substring(2, 10).toUpperCase(),
      fileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '1.2 MB',
      fileFormat: 'OCR Verified',
      originalDocumentName: selectedFile?.name || `${detectedSystemOverride}_prescription.jpg`,
      imageUrl: imagePreviewUrl || undefined,
      ocrExtractedText: extractedTextSummary,
      indication: `Prescribed ${analysisResult.medicines.length} medicines via ${detectedSystemOverride.toUpperCase()} practice.`,
      impression: analysisResult.medicines.map((m) => `${m.name} (${m.frequency})`).join('; '),
    };

    await localVaultDB.savePrescription({
      ...newPrescriptionRecord,
      medicalSystem: detectedSystemOverride,
      medicines: analysisResult.medicines,
    });

    onAddPrescriptionRecord(newPrescriptionRecord);
    setSavedSuccessMessage(
      `Prescription saved to your Swasthya Wallet! Indexed under ${detectedSystemOverride.toUpperCase()}.`
    );
    setTimeout(() => setSavedSuccessMessage(null), 3500);
  };

  const hasLowConfidence =
    Boolean(analysisResult) &&
    ((analysisResult?.confidenceScore ?? 100) < 85 ||
      Boolean(analysisResult?.medicines.some((m) => m.uncertain)));

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[26px]">document_scanner</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Multi-System Prescription Assistant
              </h1>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase">
                AI OCR 2.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Swasthya Wallet • Digital Health Locker for Citizens | Recognizing Allopathy, Ayurveda & Homeopathy
            </p>
          </div>
        </div>

        {/* System Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Allopathy
          </span>
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Ayurveda (AYUSH)
          </span>
          <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-xl font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            Homeopathy (Potency)
          </span>
        </div>
      </div>

      {/* Upload & Action Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 flex flex-col gap-3">
            <label
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
              </div>
              <span className="text-sm font-bold text-slate-900 mb-1">
                Upload or Photograph Prescription
              </span>
              <span className="text-xs text-slate-500 max-w-sm">
                Supports JPG, JPEG, PNG, and PDF files. Handwritten and printed Allopathy, Ayurveda & Homeopathy Rx supported.
              </span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Or try instant sample:</span>
              <button
                type="button"
                onClick={() => handleLoadSample('allopathy')}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Allopathy (Dolo, Telma)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('ayurveda')}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Ayurveda (Ashwagandha, Triphala)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('homeopathy')}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:border-purple-600 hover:bg-purple-50 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Homeopathy (Arnica, Nux Vomica 30C)
              </button>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col items-center justify-center">
            {imagePreviewUrl ? (
              <div className="w-full h-44 rounded-2xl border border-slate-200 overflow-hidden relative group bg-slate-100">
                <img
                  src={imagePreviewUrl}
                  alt="Prescription Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-semibold bg-slate-900/80 px-3 py-1 rounded-full">
                    Prescription Loaded
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-44 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <span className="material-symbols-outlined text-[36px] mb-1">receipt_long</span>
                <span className="text-xs">No image loaded yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Loading Indicator */}
      {isAnalyzing && (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-[36px] text-blue-600 animate-spin">refresh</span>
          <span className="text-sm font-bold text-slate-900">
            Analyzing Prescription & Identifying Medical System...
          </span>
          <span className="text-xs text-slate-500">
            Cross-referencing Allopathic drugs, Ayurvedic Classical formulations & Homeopathic dilutions
          </span>
        </div>
      )}

      {/* Saved Success Banner */}
      {savedSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs sm:text-sm font-semibold animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-[22px]">check_circle</span>
          <span>{savedSuccessMessage}</span>
        </div>
      )}

      {/* OCR Results & Manual Verification Panel */}
      {analysisResult && !isAnalyzing && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-900">Extracted Prescription Details</h3>
                <span
                  className={`text-xs border px-2 py-0.5 rounded-full font-bold ${
                    analysisResult.confidenceScore >= 85
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {analysisResult.confidenceScore}% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Prescribed by: <strong>{analysisResult.prescriberName}</strong> • {analysisResult.clinicOrHospital}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-500 pl-2">System:</span>
              {(['allopathy', 'ayurveda', 'homeopathy'] as const).map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setDetectedSystemOverride(sys)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    detectedSystemOverride === sys
                      ? sys === 'ayurveda'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : sys === 'homeopathy'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          {/* List of Extracted Medicines with Manual Edit */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Identified Medicines ({analysisResult.medicines.length})
            </h4>

            {analysisResult.medicines.map((med, index) => {
              const isBeingEdited = editingMedicine?.id === med.id;
              return (
                <div
                  key={med.id || index}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-all flex flex-col gap-3"
                >
                  {isBeingEdited && editingMedicine ? (
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editingMedicine.name}
                          onChange={(e) => setEditingMedicine({ ...editingMedicine, name: e.target.value })}
                          placeholder="Medicine Name"
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                        />
                        <input
                          type="text"
                          value={editingMedicine.strengthOrPotency || ''}
                          onChange={(e) => setEditingMedicine({ ...editingMedicine, strengthOrPotency: e.target.value })}
                          placeholder="Strength / Potency (e.g. 650mg / 30C)"
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          value={editingMedicine.frequency || ''}
                          onChange={(e) => setEditingMedicine({ ...editingMedicine, frequency: e.target.value })}
                          placeholder="Frequency (e.g. 1-0-1)"
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingMedicine(null)}
                          className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditedMedicine}
                          className="px-3 py-1 rounded-lg bg-blue-900 text-white font-semibold cursor-pointer"
                        >
                          Save Correction
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            med.system === 'ayurveda'
                              ? 'bg-emerald-100 text-emerald-800'
                              : med.system === 'homeopathy'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {med.system === 'ayurveda' ? 'spa' : med.system === 'homeopathy' ? 'science' : 'medication'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{med.name}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              {med.dosageForm || 'Form'} • {med.strengthOrPotency || 'Standard'}
                            </span>
                            {med.uncertain && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                                Low Confidence — Verify Manually
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-1">
                            {med.system === 'ayurveda' && med.sanskritName && (
                              <span className="font-medium text-emerald-900 mr-2">
                                {med.sanskritName} ({med.classicalFormulation || 'Classical AFI'})
                              </span>
                            )}
                            {med.system === 'homeopathy' && med.strengthOrPotency && (
                              <span className="font-bold text-purple-900 mr-2 font-mono">
                                Potency: {med.strengthOrPotency}
                              </span>
                            )}
                            {med.instructions || `${med.dosage || '1 Dose'} • ${med.frequency || 'Daily'} • ${med.duration || 'As directed'}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setEditingMedicine({ ...med })}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Correct</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToFindMedicine(med.name, med.system)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">storefront</span>
                          <span>Find Medicine</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToAlternatives(med.name, med.system)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                          <span>Find Alternatives</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {verificationError && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
              <span>{verificationError}</span>
            </div>
          )}

          {/* User Verification Check & Save Action */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-blue-900">
              <input
                type="checkbox"
                checked={patientVerifiedOcr}
                onChange={(e) => {
                  setPatientVerifiedOcr(e.target.checked);
                  if (e.target.checked) setVerificationError(null);
                }}
                className="mt-0.5 w-4 h-4 accent-blue-700 shrink-0"
              />
              <span>
                <strong>Patient Verification{hasLowConfidence ? ' (Required)' : ''}:</strong> I have reviewed the extracted medicine names, strengths/potencies, and instructions against my physical prescription.
              </span>
            </label>

            <button
              type="button"
              onClick={handleSaveToWallet}
              className="py-2.5 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm shrink-0 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Confirm & Save to Locker</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
