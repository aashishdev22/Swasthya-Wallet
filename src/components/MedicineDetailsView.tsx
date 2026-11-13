/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Dedicated Medicine Details Page
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import { MedicineItem } from '../data/medicineDatabase.ts';
import { UserMedicine } from '../types/health.ts';
import { SupportedLanguage, formatIndianCurrency } from '../utils/i18n.ts';
import { MedicineCategoryIcon } from './CategoryIcon.tsx';

interface MedicineDetailsViewProps {
  medicine: MedicineItem;
  userMedicine?: UserMedicine | null;
  currentLang?: SupportedLanguage;
  onBack: () => void;
  onViewOriginalPrescription?: (recordId?: string) => void;
  onFindAlternatives?: (med: MedicineItem) => void;
  onSaveToMyMedicines?: (med: MedicineItem) => void;
  onViewPharmacyAvailability?: (med: MedicineItem) => void;
}

export const MedicineDetailsView: React.FC<MedicineDetailsViewProps> = ({
  medicine,
  userMedicine,
  currentLang: _currentLang = 'en',
  onBack,
  onViewOriginalPrescription,
  onFindAlternatives,
  onSaveToMyMedicines,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
          <span>Back to Medicines</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {userMedicine?.linkedRecordId && onViewOriginalPrescription && (
            <button
              type="button"
              onClick={() => onViewOriginalPrescription(userMedicine.linkedRecordId)}
              className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>View Original Prescription</span>
            </button>
          )}

          {!userMedicine && onSaveToMyMedicines && (
            <button
              type="button"
              onClick={() => {
                onSaveToMyMedicines(medicine);
                showToast(`"${medicine.name}" added to My Medicines Locker.`);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
              <span>Add to My Medicines</span>
            </button>
          )}

          {onFindAlternatives && (
            <button
              type="button"
              onClick={() => onFindAlternatives(medicine)}
              className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              <span>Find Alternatives</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('availability-section');
              el?.scrollIntoView({ behavior: 'smooth' });
              showToast('Scrolled to Indian pharmacy availability & Jan Aushadhi pricing.');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            <span>View Availability</span>
          </button>
        </div>
      </div>

      {/* Main Medicine Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* Header Row with Category-Specific Medicine Icon */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <MedicineCategoryIcon medicine={medicine} size={28} />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    medicine.system === 'ayurveda'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : medicine.system === 'homeopathy'
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : 'bg-blue-50 text-blue-900 border border-blue-200'
                  }`}
                >
                  {medicine.system.toUpperCase()} • {medicine.dosageForm}
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  ID: {medicine.id}
                </span>

                {userMedicine?.prescriptionDate && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Prescribed: {userMedicine.prescriptionDate}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 leading-tight">
                {medicine.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {medicine.genericOrActiveSalt}
                {medicine.strengthOrPotency && (
                  <span className="text-blue-700 font-bold ml-1 font-mono">
                    ({medicine.strengthOrPotency})
                  </span>
                )}
              </p>

              {medicine.sanskritName && (
                <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                  {medicine.sanskritName}
                </p>
              )}
            </div>
          </div>

          <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-2xl border md:border-none border-slate-200">
            <span className="text-xs text-slate-400 font-medium block">Approximate MRP (India)</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {medicine.approxMrp > 0 ? formatIndianCurrency(medicine.approxMrp) : 'As Billed'}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Maker: {medicine.manufacturer}
            </span>
          </div>
        </div>

        {/* User-Specific Prescription Instructions Banner (Only when present in citizen locker) */}
        {userMedicine && (userMedicine.instructions || userMedicine.frequency || userMedicine.duration) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <span className="material-symbols-outlined text-[20px]">prescriptions</span>
                <span>Your Prescription Instructions</span>
              </div>
              <span className="text-[10px] bg-amber-200/70 text-amber-950 font-bold px-2 py-0.5 rounded uppercase">
                From Your Locker
              </span>
            </div>

            {userMedicine.instructions && (
              <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                "{userMedicine.instructions}"
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/70 text-xs text-amber-900">
              {userMedicine.frequency && (
                <div>
                  <span className="text-[10px] text-amber-700 block">Frequency:</span>
                  <span className="font-bold">{userMedicine.frequency}</span>
                </div>
              )}
              {userMedicine.duration && (
                <div>
                  <span className="text-[10px] text-amber-700 block">Duration:</span>
                  <span className="font-bold">{userMedicine.duration}</span>
                </div>
              )}
              {userMedicine.prescriberName && (
                <div className="col-span-2 sm:col-span-1 truncate">
                  <span className="text-[10px] text-amber-700 block">Prescriber:</span>
                  <span className="font-semibold truncate">{userMedicine.prescriberName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Specific Details Section */}
        {medicine.system === 'allopathy' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-900 text-[20px]">medical_information</span>
              <span>Allopathic Pharmaceutical Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Brand Name</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.brandName || medicine.name}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Generic Name</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.genericName || medicine.genericOrActiveSalt}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Active Ingredient / Salt</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.activeSalt || medicine.genericOrActiveSalt}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Strength</span>
                <span className="text-xs sm:text-sm font-bold text-blue-900 font-mono mt-0.5 block">
                  {medicine.strength || medicine.strengthOrPotency}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Dosage Form</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.dosageForm}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Manufacturer</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {medicine.manufacturer}
                </span>
              </div>
            </div>

            {/* Safety & Drug Interactions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Known Safety Information (Verified)
                </span>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                  {medicine.knownSafetyInfo || medicine.safetyWarning || 'Take only as directed by a registered medical practitioner.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Interaction Information
                </span>
                {medicine.drugInteractions && medicine.drugInteractions.length > 0 ? (
                  <ul className="mt-1.5 list-disc list-inside text-xs text-slate-700 space-y-0.5 font-medium">
                    {medicine.drugInteractions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-600 mt-1.5">
                    No major clinical interactions recorded for standard therapeutic dosages.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {medicine.system === 'ayurveda' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-800 text-[20px]">spa</span>
              <span>Ayurvedic Classical Formulation & Botanical Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                <span className="text-[11px] text-emerald-800 font-semibold block">Sanskrit Name</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-950 mt-0.5 block">
                  {medicine.sanskritName || medicine.name}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Common Name / English Name</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.commonName || medicine.englishName || medicine.name}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Botanical Name</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 italic mt-0.5 block">
                  {medicine.botanicalName || medicine.botanicalOrLatinName || 'Classical Herbal Composition'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Classical / Proprietary</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.classicalOrProprietary || medicine.classicalFormulation || 'Classical Ayurvedic Formulary'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Dosage Form & Directions</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.dosageForm} • {medicine.directions}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">AYUSH Licence / Standard</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-800 font-mono mt-0.5 block truncate">
                  {medicine.ayushLicenceInfo || medicine.ayushLicenseNo || 'Govt of India AYUSH Standard'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Ingredients List (Active Herbs & Formulations)
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {medicine.ingredientsList.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/70">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                Safety Information & Anupana Guidance
              </span>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                {medicine.knownSafetyInfo || medicine.safetyWarning || 'Consult a qualified BAMS Vaidya before combining with concurrent allopathic medication or during pregnancy.'}
              </p>
            </div>
          </div>
        )}

        {medicine.system === 'homeopathy' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-900 text-[20px]">science</span>
              <span>Homeopathic Potency & Dilution Attributes</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70">
                <span className="text-[11px] text-purple-900 font-semibold block">Remedy Name</span>
                <span className="text-xs sm:text-sm font-bold text-purple-950 mt-0.5 block">
                  {medicine.remedyName || medicine.name}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Latin Botanical / Source</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 italic mt-0.5 block">
                  {medicine.latinName || medicine.botanicalOrLatinName}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Exact Potency (30C / 200C / 1M / Q)</span>
                <span className="text-xs sm:text-sm font-bold text-purple-900 font-mono mt-0.5 block">
                  {medicine.potency || medicine.strengthOrPotency}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Dilution / Carrier Base</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.dilution || 'Extra Neutral Alcohol (ENA) / Sucrose Globules'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Dosage Form</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                  {medicine.dosageForm}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] text-slate-500 block">Manufacturer</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {medicine.manufacturer}
                </span>
              </div>
            </div>

            {medicine.motherTinctureInfo && (
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 text-xs text-purple-900 font-medium">
                <span className="font-bold block mb-1">Mother Tincture (Ø) / Dilution Guidance:</span>
                {medicine.motherTinctureInfo}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                Safety Information & Administration Care
              </span>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                {medicine.knownSafetyInfo || medicine.safetyWarning || 'Avoid strong flavours (mint, coffee, camphor) 15 minutes before or after taking homeopathic doses. Follow BHMS clinician guidance.'}
              </p>
            </div>
          </div>
        )}

        {/* Indian Pharmacy Availability & Jan Aushadhi Section */}
        <div id="availability-section" className="flex flex-col gap-3 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-900 text-[20px]">store</span>
            <span>Indian Pharmacy Availability & Generic Savings</span>
          </h2>

          {medicine.janAushadhiEquivalent && (
            <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Generic Equivalent:
                </span>
                <h4 className="text-sm font-bold text-emerald-950 mt-0.5">
                  {medicine.janAushadhiEquivalent.name}
                </h4>
                <span className="text-xs text-emerald-700 font-mono">
                  Code: {medicine.janAushadhiEquivalent.genericCode}
                </span>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-sm sm:text-base font-bold text-emerald-900 font-mono block">
                  PMBJP Price: {formatIndianCurrency(medicine.janAushadhiEquivalent.approxPrice)}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Save {medicine.janAushadhiEquivalent.savingsPct}% vs Branded MRP
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Apollo Pharmacy</span>
              <span className="text-emerald-700 font-bold">{medicine.onlineAvailability.apollo}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Tata 1mg</span>
              <span className="text-emerald-700 font-bold">{medicine.onlineAvailability.tata1mg}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Netmeds</span>
              <span className="text-emerald-700 font-bold">{medicine.onlineAvailability.netmeds}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Jan Aushadhi</span>
              <span className="text-emerald-700 font-bold">{medicine.onlineAvailability.janAushadhiKendra}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Safety Notice */}
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-slate-500 shrink-0 mt-0.5">
            medical_services
          </span>
          <p className="leading-relaxed">
            <span className="font-bold text-slate-800">Citizen Health Locker Medical Notice: </span>
            This page provides patient information extracted from your medical records and national drug indexes.
            Never alter dosages or substitute medications without the explicit recommendation of your licensed treating physician.
          </p>
        </div>
      </div>
    </div>
  );
};
