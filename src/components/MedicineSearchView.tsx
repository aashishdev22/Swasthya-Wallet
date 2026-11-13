/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Mobile Medicine Two-Column Square Grid
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import {
  INDIAN_MEDICINE_CATALOG,
  MedicineItem,
} from '../data/medicineDatabase.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';
import { MedicineCategoryIcon } from './CategoryIcon.tsx';

interface MedicineSearchViewProps {
  currentLang?: SupportedLanguage;
  initialQuery?: string;
  initialSystem?: string;
  onSearchChange?: (q: string) => void;
  onSystemChange?: (sys: string) => void;
  filterPrescribedOnly?: boolean;
  onFilterPrescribedOnlyChange?: (val: boolean) => void;
  filterRecentOnly?: boolean;
  onFilterRecentOnlyChange?: (val: boolean) => void;
  onSelectMedicine: (med: MedicineItem) => void;
  onSelectFindAlternatives?: (med: MedicineItem) => void;
}

export const MedicineSearchView: React.FC<MedicineSearchViewProps> = ({
  currentLang = 'en',
  initialQuery = '',
  initialSystem = 'all',
  onSearchChange,
  onSystemChange,
  filterPrescribedOnly: controlledPrescribed,
  onFilterPrescribedOnlyChange: setControlledPrescribed,
  filterRecentOnly: controlledRecent,
  onFilterRecentOnlyChange: setControlledRecent,
  onSelectMedicine,
}) => {
  const _t = getTranslation(currentLang);

  const [internalQuery, setInternalQuery] = useState<string>(initialQuery);
  const [internalSystem, setInternalSystem] = useState<string>(initialSystem);

  const searchQuery = initialQuery !== undefined && onSearchChange ? initialQuery : internalQuery;
  const setSearchQuery = onSearchChange || setInternalQuery;

  const selectedSystem = initialSystem !== undefined && onSystemChange ? initialSystem : internalSystem;
  const setSelectedSystem = onSystemChange || setInternalSystem;

  const [internalPrescribed, setInternalPrescribed] = useState<boolean>(false);
  const filterPrescribedOnly = controlledPrescribed !== undefined ? controlledPrescribed : internalPrescribed;
  const setFilterPrescribedOnly = setControlledPrescribed || setInternalPrescribed;

  const [internalRecent, setInternalRecent] = useState<boolean>(false);
  const filterRecentOnly = controlledRecent !== undefined ? controlledRecent : internalRecent;
  const setFilterRecentOnly = setControlledRecent || setInternalRecent;

  // System filters
  const systemFilters = [
    { id: 'all', label: 'All Systems', icon: 'apps' },
    { id: 'allopathy', label: 'Allopathy', icon: 'medication' },
    { id: 'ayurveda', label: 'Ayurveda', icon: 'spa' },
    { id: 'homeopathy', label: 'Homeopathy', icon: 'science' },
  ];

  // Filtering catalog
  const filteredMedicines = INDIAN_MEDICINE_CATALOG.filter((med) => {
    // Medical system filter
    if (selectedSystem !== 'all' && med.system !== selectedSystem) {
      return false;
    }

    // Prescription-linked filter
    if (filterPrescribedOnly && !med.prescriptionDate && !med.linkedRecordId) {
      return false;
    }

    // Recent filter
    if (filterRecentOnly && !med.prescriptionDate?.includes('2024')) {
      return false;
    }

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      med.name.toLowerCase().includes(q) ||
      med.genericOrActiveSalt.toLowerCase().includes(q) ||
      med.manufacturer.toLowerCase().includes(q) ||
      (med.sanskritName && med.sanskritName.toLowerCase().includes(q)) ||
      (med.botanicalOrLatinName && med.botanicalOrLatinName.toLowerCase().includes(q)) ||
      (med.strengthOrPotency && med.strengthOrPotency.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full flex flex-col gap-4 font-sans pb-12">
      {/* Mobile-First Header: Top Heading "Medicines" */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Medicines
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-xs">
              {filteredMedicines.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Allopathy, Ayurveda & Homeopathy • Tap any square card to view complete medicine details
          </p>
        </div>
      </div>

      {/* Search Bar & System Filters */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
          <span className="material-symbols-outlined text-slate-400 text-[20px] ml-3.5 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicines by name, active salt, or potency..."
            className="w-full h-11 pl-2.5 pr-10 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-700"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* 4 System Filter Tabs (Horizontal Scrollable for Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {systemFilters.map((sys) => {
            const isSelected = selectedSystem === sys.id;
            return (
              <button
                key={sys.id}
                type="button"
                onClick={() => setSelectedSystem(sys.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{sys.icon}</span>
                <span>{sys.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Prescription-Linked & Recent */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterPrescribedOnly}
                onChange={(e) => setFilterPrescribedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium text-slate-700">Prescription-Linked</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterRecentOnly}
                onChange={(e) => setFilterRecentOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium text-slate-700">Recent</span>
            </label>
          </div>

          <span className="text-[11px] text-slate-400">
            Showing {filteredMedicines.length} items
          </span>
        </div>
      </div>

      {/* Two-Column Square Grid on Mobile, Responsive to 3/4 cols on Tablet/Desktop (Problem 5 & Part 2) */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 text-xs sm:text-sm">
          <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2 block">medication</span>
          No medicines found matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              onClick={() => onSelectMedicine(med)}
              className="aspect-square bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center text-center group active:scale-[0.98] select-none relative overflow-hidden"
              role="button"
              tabIndex={0}
              aria-label={`View medicine details for ${med.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectMedicine(med);
              }}
            >
              {/* Category-Specific Representative Icon at Top */}
              <div className="transition-transform group-hover:scale-105 duration-200 mb-2 sm:mb-3">
                <MedicineCategoryIcon medicine={med} size={28} />
              </div>

              {/* Medicine Name ONLY - No price, manufacturer, dosage, or ingredients on the card */}
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug px-1 max-w-full">
                {med.name}
              </h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
