/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PatientProfile } from '../data/mockData.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface LogVaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onSuccess?: (vaccineName: string) => void;
  currentLang?: SupportedLanguage;
}

export const LogVaccineModal: React.FC<LogVaccineModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSuccess,
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const [intakeMode, setIntakeMode] = useState<'manual' | 'ocr' | 'qr'>('manual');
  const [antigen, setAntigen] = useState('tdap');
  const [doseSeries, setDoseSeries] = useState('booster');
  const [adminDate, setAdminDate] = useState('2024-11-03');
  const [brandNdc, setBrandNdc] = useState('Tetanus Toxoid / Td Booster • Serum Institute of India');
  const [lotNum, setLotNum] = useState('TT-9924B');
  const [lotExp, setLotExp] = useState('10/2026');
  const [facility, setFacility] = useState('Safdarjung Hospital CVC, New Delhi');
  const [clinician, setClinician] = useState('Dr. K. Verma, Medical Officer');
  const [adminSite, setAdminSite] = useState('left_deltoid');
  const [adminRoute, setAdminRoute] = useState('im');
  const [showStagedFile, setShowStagedFile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleModeChange = (mode: 'manual' | 'ocr' | 'qr') => {
    setIntakeMode(mode);
    if (mode === 'ocr') {
      showToast('Camera optical recognition opened. Scanning CDC card...');
    } else if (mode === 'qr') {
      showToast('SMART® Health QR scanner activated.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast('Immunization verified & synced to WA DOH-IIS registry.');
      if (onSuccess) {
        onSuccess(antigen.toUpperCase());
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <header className="px-4 py-3 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-on-surface hover:text-primary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-primary leading-tight">
                Log Vaccine Dose & Certificate
              </h2>
              <span className="font-code-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                FHIR R4 Immunization Ingestion
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Demo Clinical Banner */}
          <div className="bg-surface-container-high px-3 py-1.5 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
              <span className="font-code-sm text-[11px] text-primary uppercase tracking-wider truncate font-semibold">
                DEMO PATIENT DATA • FHIR R4 INGESTION
              </span>
            </div>
            <span className="font-code-sm text-[10px] text-on-surface-variant shrink-0 bg-surface px-1.5 py-0.5 rounded font-mono">
              MRN {patient.mrn}
            </span>
          </div>

          {/* Patient Context Micro-Card */}
          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[20px]">vital_signs</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm text-primary truncate leading-tight">
                  {patient.name}, {patient.age}Y
                </h3>
                <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                  DOB: {patient.dob} • Primary Profile
                </p>
              </div>
            </div>
            <span className="font-code-sm text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span> STAGED
            </span>
          </div>

          {/* Intake Selector Segmented Bar */}
          <div className="bg-surface-container p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleModeChange('manual')}
              className={`flex-1 py-1.5 px-2 text-center rounded-lg font-label-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                intakeMode === 'manual'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">edit_note</span>
              <span>Manual Entry</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('ocr')}
              className={`flex-1 py-1.5 px-2 text-center rounded-lg font-label-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                intakeMode === 'ocr'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">document_scanner</span>
              <span>Scan CDC Card</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('qr')}
              className={`flex-1 py-1.5 px-2 text-center rounded-lg font-label-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                intakeMode === 'qr'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
              <span>SMART® QR</span>
            </button>
          </div>

          {/* Form */}
          <form id="vax-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Section 1: Vaccine & Series */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">vaccines</span>
                  <span className="font-semibold text-xs text-primary">Immunization Target</span>
                </div>
                <span className="font-code-sm text-[10px] text-secondary bg-surface-container-low px-2 py-0.5 rounded font-medium">
                  HL7 CVX 115
                </span>
              </div>

              {/* Vaccine Antigen Select */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary flex items-center justify-between" htmlFor="antigen-select">
                  <span>Target Vaccine / Antigen <span className="text-error">*</span></span>
                  <span className="font-code-sm text-[10px] text-on-surface-variant font-normal">LOINC 30952-6</span>
                </label>
                <div className="relative">
                  <select
                    id="antigen-select"
                    value={antigen}
                    onChange={(e) => setAntigen(e.target.value)}
                    className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 pr-8 appearance-none outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                  >
                    <option value="tdap">Tdap (Tetanus, Diphtheria, Pertussis) — CVX 115</option>
                    <option value="covid">COVID-19, mRNA Spike Protein (Updated 2024-2025) — CVX 313</option>
                    <option value="flu">Influenza, Seasonal Quadrivalent — CVX 158</option>
                    <option value="hepa">Hepatitis A, Pediatric/Adult Formulation — CVX 83</option>
                    <option value="hepb">Hepatitis B, Recombinant (Heplisav-B) — CVX 189</option>
                    <option value="mmr">MMR (Measles, Mumps, Rubella) — CVX 03</option>
                    <option value="hpv">HPV 9-Valent (Gardasil 9) — CVX 165</option>
                    <option value="shingrix">Zoster Recombinant (Shingrix) — CVX 187</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Dose Sequence Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary">
                  Dose Number / Series Stage <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dose1', label: 'Dose 1', icon: 'counter_1' },
                    { id: 'dose2', label: 'Dose 2', icon: 'counter_2' },
                    { id: 'booster', label: 'Booster / Decennial', icon: 'upgrade' },
                    { id: 'annual', label: 'Annual Seasonal', icon: 'calendar_today' },
                  ].map((d) => (
                    <label key={d.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="dose_series"
                        value={d.id}
                        checked={doseSeries === d.id}
                        onChange={() => setDoseSeries(d.id)}
                        className="peer sr-only"
                      />
                      <div className="h-9 rounded-lg bg-surface-container-low peer-checked:bg-primary peer-checked:text-on-primary text-on-surface-variant text-xs font-medium flex items-center justify-center gap-1 px-2 transition-all">
                        <span className="material-symbols-outlined text-[15px]">{d.icon}</span>
                        <span>{d.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date of Administration */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary" htmlFor="admin-date">
                  Administration Date <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-date"
                    type="date"
                    value={adminDate}
                    onChange={(e) => setAdminDate(e.target.value)}
                    className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                  />
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline pointer-events-none text-[18px]">
                    event
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Product & Lot Telemetry */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">science</span>
                  <span className="font-semibold text-xs text-primary">Manufacturing & Batch Detail</span>
                </div>
                <span className="font-code-sm text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded font-medium">
                  FDA NDC
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary" htmlFor="brand-ndc">
                  Commercial Brand & NDC
                </label>
                <input
                  id="brand-ndc"
                  type="text"
                  value={brandNdc}
                  onChange={(e) => setBrandNdc(e.target.value)}
                  className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary" htmlFor="lot-num">
                    Lot Number <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="lot-num"
                      type="text"
                      value={lotNum}
                      onChange={(e) => setLotNum(e.target.value)}
                      className="w-full h-10 bg-surface-container-low text-primary font-code-sm text-xs uppercase rounded-lg px-3 pr-7 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                    />
                    <span className="material-symbols-outlined absolute right-2 top-2.5 text-secondary text-[16px]">
                      verified
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary" htmlFor="lot-exp">
                    Expiration Date
                  </label>
                  <input
                    id="lot-exp"
                    type="text"
                    value={lotExp}
                    onChange={(e) => setLotExp(e.target.value)}
                    placeholder="MM/YYYY"
                    className="w-full h-10 bg-surface-container-low text-primary font-code-sm text-xs rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Clinical Administration Site & Route */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">medical_services</span>
                  <span className="font-semibold text-xs text-primary">Clinical Administration Site</span>
                </div>
                <span className="font-code-sm text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded font-medium">
                  HL7 Table 0163
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary" htmlFor="provider-loc">
                  Healthcare Facility / Clinic <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    id="provider-loc"
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 pr-8 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                  />
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline pointer-events-none text-[18px]">
                    storefront
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary" htmlFor="clinician-name">
                  Administering Clinician (Optional)
                </label>
                <input
                  id="clinician-name"
                  type="text"
                  value={clinician}
                  onChange={(e) => setClinician(e.target.value)}
                  className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary" htmlFor="admin-site">
                    Anatomical Site
                  </label>
                  <select
                    id="admin-site"
                    value={adminSite}
                    onChange={(e) => setAdminSite(e.target.value)}
                    className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-2 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                  >
                    <option value="left_deltoid">Left Deltoid</option>
                    <option value="right_deltoid">Right Deltoid</option>
                    <option value="left_thigh">Left Vastus Lateralis (Thigh)</option>
                    <option value="right_thigh">Right Vastus Lateralis (Thigh)</option>
                    <option value="nasal">Intranasal Mucosa</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary" htmlFor="admin-route">
                    Route
                  </label>
                  <select
                    id="admin-route"
                    value={adminRoute}
                    onChange={(e) => setAdminRoute(e.target.value)}
                    className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-2 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                  >
                    <option value="im">Intramuscular (IM)</option>
                    <option value="sc">Subcutaneous (SC)</option>
                    <option value="id">Intradermal (ID)</option>
                    <option value="po">Oral (PO)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Document Verification Staging */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">badge</span>
                  <span className="font-semibold text-xs text-primary">Supporting Certificate Proof</span>
                </div>
                <span className="font-code-sm text-[10px] text-secondary bg-surface-container-low px-2 py-0.5 rounded font-medium">
                  OCR ACTIVE
                </span>
              </div>

              {/* Dropzone Trigger */}
              <div
                onClick={() => showToast('File selector active (JPEG/PNG/PDF)')}
                className="p-3 rounded-xl bg-surface-container-low flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:bg-surface-container transition-all border border-dashed border-outline-variant/50"
              >
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary">Attach CDC Card, Summary, or Pharmacy Slip</p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">PDF, JPEG, or PNG up to 15MB</p>
                </div>
              </div>

              {/* Staged Preview Card */}
              {showStagedFile && (
                <div className="bg-surface-container p-2.5 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 overflow-hidden relative border border-outline-variant/30">
                      <img
                        className="w-full h-full object-cover"
                        alt="CDC Card Preview"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8SC56wEytSjeHYIBX63hm2ZIUJMrW29kteesUb6iRoJD8j4XJpUt-CAO_vvQBeuyOTZHz9TOpF_W1viVx3gU6W8zSGoyaVfT_qz0xVNo9jwTQ7e6Wc77HaXOOqaDabQ3RidwPYXsz0wZXcnDu4kBoo3sgfa2RdZfYOPzK0vxxGDqYDpKN_EF7ZB4kwBKAPaOxLhvwl4S9Kl4gr5zmdZd8s3kwvvaFxY_qoC-EBYamGw-ikrCe4JE-7A"
                      />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="text-xs font-semibold text-primary truncate">CDC_Card_Proof_Nov2024.jpg</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-code-sm text-[10px] text-on-surface-variant">340 KB</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <span className="font-code-sm text-[9px] bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">done</span> Lot Matched
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove uploaded proof"
                    onClick={() => setShowStagedFile(false)}
                    className="w-7 h-7 rounded-lg bg-surface hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 5: Intelligent Next-Dose Schedule Projection Engine */}
            <div className="bg-secondary-fixed/20 p-3 rounded-xl shadow-xs border border-secondary/20 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <h4 className="font-semibold text-xs">CDC ACIP Schedule Engine</h4>
              </div>
              <p className="text-xs text-on-surface leading-tight">
                Next decennial dose projected for <strong className="text-primary font-semibold">November 2034</strong> (10-Year Interval).
              </p>
              <div className="bg-surface-container-lowest/80 p-1.5 px-2 rounded-lg flex items-center gap-1.5 text-on-surface-variant font-code-sm text-[10px]">
                <span className="material-symbols-outlined text-secondary text-[14px]">rule</span>
                <span>Algorithm: CDC_ACIP_TDAP_2024_V3. Reminders sync upon save.</span>
              </div>
            </div>

            {/* Section 6: Attestation & Registry Cross-Check */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-2">
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
                Legal Attestation & Registry Synchronization
              </span>
              <label className="flex items-start gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  required
                  defaultChecked
                  className="mt-0.5 w-4 h-4 rounded accent-primary shrink-0 cursor-pointer"
                />
                <span className="font-body-sm text-[11px] text-on-surface leading-snug">
                  I attest under penalty of misrepresentation that this immunization was administered by a licensed healthcare clinician as described above.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 w-4 h-4 rounded accent-primary shrink-0 cursor-pointer"
                />
                <span className="font-body-sm text-[11px] text-on-surface leading-snug">
                  Submit cryptographic SHA-256 bundle to state registry (<strong className="text-primary">WA DOH-IIS</strong>) for cross-verification.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1 pb-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    <span>Ingesting FHIR R4 Bundle...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>Save & Index Immunization Record</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => showToast('Draft bundle saved to secure enclave sandbox.')}
                className="w-full h-10 bg-surface-container-high hover:bg-surface-variant text-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">bookmark</span>
                <span>Save Staged Draft</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1 text-center text-xs text-on-surface-variant hover:text-error transition-colors font-medium"
              >
                Cancel & Discard Entry
              </button>
            </div>
          </form>
        </div>

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="absolute bottom-4 left-4 right-4 bg-primary text-on-primary px-3 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom duration-200">
            <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">verified</span>
            <span className="text-xs flex-1">{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
