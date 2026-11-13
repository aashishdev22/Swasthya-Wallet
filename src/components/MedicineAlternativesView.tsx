/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Medicine Alternative Discovery Engine
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import {
  INDIAN_MEDICINE_CATALOG,
  MedicineItem,
  findMedicineAlternatives,
  MANDATORY_SAFETY_DISCLAIMER,
} from '../data/medicineDatabase.ts';
import { SupportedLanguage, getTranslation, formatIndianCurrency } from '../utils/i18n.ts';

interface MedicineAlternativesViewProps {
  currentLang?: SupportedLanguage;
  selectedMedicine?: MedicineItem | null;
  onSelectAnotherMedicine?: (med: MedicineItem) => void;
}

export const MedicineAlternativesView: React.FC<MedicineAlternativesViewProps> = ({
  currentLang = 'en',
  selectedMedicine = null,
  onSelectAnotherMedicine,
}) => {
  const t = getTranslation(currentLang);

  const [currentMed, setCurrentMed] = useState<MedicineItem>(
    selectedMedicine || INDIAN_MEDICINE_CATALOG[0]
  );

  const alternatives = findMedicineAlternatives(currentMed);

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[26px]">swap_horiz</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Medicine Alternatives & Generic Equivalents
              </h1>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase">
                Clinical Safety
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Swasthya Wallet • Digital Health Locker for Citizens | Same Salt, Generic & Multi-System Discovery
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory Safety Banner (Part 15 Requirement) */}
      <div className="p-4 sm:p-5 bg-amber-50/90 border-2 border-amber-300 rounded-3xl flex items-start gap-3.5 text-amber-950 shadow-xs">
        <span className="material-symbols-outlined text-amber-600 text-[26px] shrink-0 mt-0.5">
          warning
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-amber-900">
            Mandatory Medical Safety Notice
          </span>
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            {MANDATORY_SAFETY_DISCLAIMER}
          </p>
          <span className="text-[11px] text-amber-800">
            Never change a prescribed medicine, dosage, or medical system (Allopathy, Ayurveda, Homeopathy) without consulting your registered medical practitioner.
          </span>
        </div>
      </div>

      {/* Selector: Choose Origin Medicine */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Viewing Alternatives For:
          </span>
          <span className="text-xs text-blue-700 font-semibold font-mono">
            {currentMed.genericOrActiveSalt}
          </span>
        </div>

        {/* Medicine Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {INDIAN_MEDICINE_CATALOG.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setCurrentMed(m);
                onSelectAnotherMedicine?.(m);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                currentMed.id === m.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Current Medicine Overview Card */}
        <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{currentMed.name}</span>
              <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded uppercase font-bold text-slate-600">
                {currentMed.system} • {currentMed.dosageForm}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Composition: <strong>{currentMed.genericOrActiveSalt}</strong> ({currentMed.strengthOrPotency})
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-slate-900 font-mono">
              MRP: {formatIndianCurrency(currentMed.approxMrp)}
            </span>
            <span className="text-[10px] text-slate-400 block">{currentMed.manufacturer}</span>
          </div>
        </div>
      </div>

      {/* Alternatives Categorized Results (Part 15 Requirement) */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Discovered Alternatives ({alternatives.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alternatives.map((alt) => (
            <div
              key={alt.id}
              className={`rounded-3xl border p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-3 transition-all ${
                alt.matchType === 'exact_match'
                  ? 'bg-blue-50/40 border-blue-200'
                  : alt.matchType === 'same_ingredient'
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      alt.matchType === 'same_ingredient'
                        ? 'bg-emerald-100 text-emerald-800'
                        : alt.matchType === 'exact_match'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {alt.matchLabel}
                  </span>

                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatIndianCurrency(alt.approxPrice)}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 leading-snug">{alt.name}</h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {alt.brandOrMaker} • {alt.dosageForm} ({alt.strengthOrPotency})
                </p>

                {alt.savingsInfo && (
                  <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-xl inline-block">
                    {alt.savingsInfo}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{alt.sourceNotes}</span>
                <span className="text-blue-700 font-semibold cursor-pointer">Verified Formulary</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
