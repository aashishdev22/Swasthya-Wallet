/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { PatientProfile, VaccineItem } from '../types/health.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface LogVaccineModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  onAddVaccine?: (vaccine: VaccineItem) => void;
  onSuccess?: (vaccineName: string) => void;
  currentLang?: SupportedLanguage;
}

const VACCINE_LABELS: Record<string, { name: string; fullName: string; cvx: string }> = {
  tdap: { name: 'Tdap / Tetanus Booster', fullName: 'Tetanus, Diphtheria, Acellular Pertussis', cvx: 'CVX 115' },
  covid: { name: 'COVID-19 Vaccine', fullName: 'SARS-CoV-2 Spike Protein Vaccine', cvx: 'CVX 313' },
  flu: { name: 'Influenza Seasonal', fullName: 'Influenza, Seasonal Quadrivalent', cvx: 'CVX 158' },
  hepa: { name: 'Hepatitis A', fullName: 'Hepatitis A, Adult Formulation', cvx: 'CVX 83' },
  hepb: { name: 'Hepatitis B', fullName: 'Hepatitis B, Recombinant Vaccine', cvx: 'CVX 189' },
  mmr: { name: 'MMR Vaccine', fullName: 'Measles, Mumps, Rubella', cvx: 'CVX 03' },
  hpv: { name: 'HPV 9-Valent', fullName: 'Human Papillomavirus 9-Valent', cvx: 'CVX 165' },
  typhoid: { name: 'Typhoid Conjugate', fullName: 'Typhoid Conjugate Vaccine (TCV)', cvx: 'CVX 190' },
};

export const LogVaccineModal: React.FC<LogVaccineModalProps> = ({
  isOpen,
  onClose,
  patient,
  onAddVaccine,
  onSuccess,
  currentLang = 'en',
}) => {
  const _t = getTranslation(currentLang);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [intakeMode, setIntakeMode] = useState<'manual' | 'ocr' | 'qr'>('manual');
  const [antigen, setAntigen] = useState('tdap');
  const [doseSeries, setDoseSeries] = useState('booster');
  const [adminDate, setAdminDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [brandNdc, setBrandNdc] = useState('');
  const [lotNum, setLotNum] = useState('');
  const [lotExp, setLotExp] = useState('');
  const [facility, setFacility] = useState('');
  const [clinician, setClinician] = useState('');
  const [adminSite, setAdminSite] = useState('left_deltoid');
  const [adminRoute, setAdminRoute] = useState('im');
  const [stagedFile, setStagedFile] = useState<{ name: string; sizeLabel: string; previewUrl?: string } | null>(null);
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
      showToast('Select your vaccine certificate photo or PDF below to attach proof.');
    } else if (mode === 'qr') {
      showToast('Enter CoWIN / ABDM certificate details manually or attach file.');
    }
  };

  const handleCertificateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('Certificate file must be 15 MB or smaller.');
      return;
    }
    const sizeLabel =
      file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setStagedFile({
          name: file.name,
          sizeLabel,
          previewUrl: typeof reader.result === 'string' ? reader.result : undefined,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setStagedFile({ name: file.name, sizeLabel });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotNum.trim() || !facility.trim()) {
      showToast('Please enter Lot Number and Healthcare Facility.');
      return;
    }
    setIsSubmitting(true);

    const meta = VACCINE_LABELS[antigen] || {
      name: 'Immunization Dose',
      fullName: 'Preventive Vaccine',
      cvx: 'CVX',
    };

    const doseLabel =
      doseSeries === 'dose1'
        ? 'Dose 1'
        : doseSeries === 'dose2'
        ? 'Dose 2'
        : doseSeries === 'annual'
        ? 'Annual Seasonal'
        : 'Booster';
    const statusLabel = doseSeries === 'booster' ? 'Booster Logged' : 'Series Complete';

    const newVaccine: VaccineItem = {
      id: `vax-${Date.now()}`,
      title: meta.name,
      subtitle: `${meta.fullName} • ${doseLabel}`,
      type: 'administered',
      priority: 'normal',
      status: statusLabel,
      code: meta.cvx,
      lastDose: adminDate,
      lot: lotNum.trim().toUpperCase(),
      facility: facility.trim(),
      registryState: stagedFile ? 'CoWIN Certificate Attached' : 'Citizen Self-Attested',
      ndcCode: brandNdc.trim() || undefined,
      clinicianSig: clinician.trim() || `${adminRoute.toUpperCase()} • ${adminSite.replace('_', ' ')}`,
      dosesHistory: [{ dose: doseLabel, date: adminDate }],
      updatedAt: new Date().toISOString(),
    };

    if (onAddVaccine) {
      onAddVaccine(newVaccine);
    }
    if (onSuccess) {
      onSuccess(meta.name);
    }
    setIsSubmitting(false);
    onClose();
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
          <div className="bg-surface-container-high px-3 py-1.5 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
              <span className="font-code-sm text-[11px] text-primary uppercase tracking-wider truncate font-semibold">
                ABDM / COWIN IMMUNIZATION INGESTION
              </span>
            </div>
            <span className="font-code-sm text-[10px] text-on-surface-variant shrink-0 bg-surface px-1.5 py-0.5 rounded font-mono">
              MRN {patient.mrn || 'UNASSIGNED'}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[20px]">vital_signs</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm text-primary truncate leading-tight">
                  {patient.name}{patient.age ? `, ${patient.age}Y` : ''}
                </h3>
                <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                  DOB: {patient.dob || 'Not provided'} • Citizen Locker
                </p>
              </div>
            </div>
            <span className="font-code-sm text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-semibold px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span> ACTIVE
            </span>
          </div>

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
              <span>Attach Certificate</span>
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
              <span>CoWIN QR</span>
            </button>
          </div>

          <form id="vax-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">vaccines</span>
                  <span className="font-semibold text-xs text-primary">Immunization Target</span>
                </div>
                <span className="font-code-sm text-[10px] text-secondary bg-surface-container-low px-2 py-0.5 rounded font-medium">
                  {(VACCINE_LABELS[antigen]?.cvx) || 'HL7 CVX'}
                </span>
              </div>

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
                    <option value="covid">COVID-19 Vaccine — CVX 313</option>
                    <option value="flu">Influenza, Seasonal Quadrivalent — CVX 158</option>
                    <option value="hepa">Hepatitis A — CVX 83</option>
                    <option value="hepb">Hepatitis B — CVX 189</option>
                    <option value="mmr">MMR (Measles, Mumps, Rubella) — CVX 03</option>
                    <option value="hpv">HPV 9-Valent — CVX 165</option>
                    <option value="typhoid">Typhoid Conjugate (TCV) — CVX 190</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary" htmlFor="admin-date">
                  Administration Date <span className="text-error">*</span>
                </label>
                <input
                  id="admin-date"
                  type="date"
                  value={adminDate}
                  onChange={(e) => setAdminDate(e.target.value)}
                  required
                  className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">science</span>
                  <span className="font-semibold text-xs text-primary">Manufacturing & Batch Detail</span>
                </div>
                <span className="font-code-sm text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded font-medium">
                  CDSCO / Batch
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-primary" htmlFor="brand-ndc">
                  Manufacturer / Commercial Brand
                </label>
                <input
                  id="brand-ndc"
                  type="text"
                  value={brandNdc}
                  onChange={(e) => setBrandNdc(e.target.value)}
                  placeholder="e.g., Serum Institute of India / Bharat Biotech"
                  className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-primary" htmlFor="lot-num">
                    Batch / Lot Number <span className="text-error">*</span>
                  </label>
                  <input
                    id="lot-num"
                    type="text"
                    value={lotNum}
                    onChange={(e) => setLotNum(e.target.value)}
                    placeholder="e.g., BATCH-042"
                    required
                    className="w-full h-10 bg-surface-container-low text-primary font-code-sm text-xs uppercase rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                  />
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
                  Vaccination Center / Hospital <span className="text-error">*</span>
                </label>
                <input
                  id="provider-loc"
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="Hospital, PHC, or CVC name"
                  required
                  className="w-full h-10 bg-surface-container-low text-primary text-xs rounded-lg px-3 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                />
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
                  placeholder="Doctor or vaccinator name"
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

            {/* Supporting Certificate Proof */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">badge</span>
                  <span className="font-semibold text-xs text-primary">Supporting Certificate Proof</span>
                </div>
                <span className="font-code-sm text-[10px] text-secondary bg-surface-container-low px-2 py-0.5 rounded font-medium">
                  OPTIONAL
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleCertificateSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-surface-container-low flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:bg-surface-container transition-all border border-dashed border-outline-variant/50"
              >
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary">Attach CoWIN Certificate or Clinic Slip</p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">PDF, JPEG, or PNG up to 15MB</p>
                </div>
              </div>

              {stagedFile && (
                <div className="bg-surface-container p-2.5 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 overflow-hidden relative border border-outline-variant/30">
                      {stagedFile.previewUrl ? (
                        <img className="w-full h-full object-cover" alt="Certificate preview" src={stagedFile.previewUrl} />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-[20px]">picture_as_pdf</span>
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="text-xs font-semibold text-primary truncate">{stagedFile.name}</span>
                      <span className="font-code-sm text-[10px] text-on-surface-variant">{stagedFile.sizeLabel}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove uploaded proof"
                    onClick={() => setStagedFile(null)}
                    className="w-7 h-7 rounded-lg bg-surface hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-2">
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
                Citizen Attestation
              </span>
              <label className="flex items-start gap-2 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  required
                  defaultChecked
                  className="mt-0.5 w-4 h-4 rounded accent-primary shrink-0 cursor-pointer"
                />
                <span className="font-body-sm text-[11px] text-on-surface leading-snug">
                  I attest that this immunization was administered by an authorized healthcare provider as described above.
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-2 pt-1 pb-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all disabled:opacity-75 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    <span>Saving Immunization Record...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>Save Immunization Record</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1 text-center text-xs text-on-surface-variant hover:text-error transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {toastMessage && (
          <div className="absolute bottom-4 left-4 right-4 bg-primary text-on-primary px-3 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50">
            <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">info</span>
            <span className="text-xs flex-1">{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
