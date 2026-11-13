/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Mobile Health Records Two-Column Square Grid
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import { MedicalRecord } from '../data/mockData.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';
import { RecordCategoryIcon } from './CategoryIcon.tsx';

interface MedicalRecordsViewProps {
  records: MedicalRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectRecord: (record: MedicalRecord) => void;
  onOpenUpload: () => void;
  onOpenDicomViewer?: (record: MedicalRecord) => void;
  onShareRecord?: (record: MedicalRecord) => void;
  currentLang?: SupportedLanguage;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  sortBy?: 'date_desc' | 'date_asc' | 'alpha';
  onSortChange?: (s: 'date_desc' | 'date_asc' | 'alpha') => void;
  recentOnly?: boolean;
  onRecentOnlyChange?: (val: boolean) => void;
}

export const MedicalRecordsView: React.FC<MedicalRecordsViewProps> = ({
  records,
  searchQuery,
  onSearchChange,
  onSelectRecord,
  onOpenUpload,
  currentLang = 'en',
  selectedCategory: controlledCategory,
  onSelectCategory: setControlledCategory,
  sortBy: controlledSortBy,
  onSortChange: setControlledSortBy,
  recentOnly: controlledRecentOnly,
  onRecentOnlyChange: setControlledRecentOnly,
}) => {
  const _t = getTranslation(currentLang);
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const activeCategory = controlledCategory !== undefined ? controlledCategory : internalCategory;
  const setActiveCategory = setControlledCategory || setInternalCategory;

  const [internalSortBy, setInternalSortBy] = useState<'date_desc' | 'date_asc' | 'alpha'>('date_desc');
  const sortBy = controlledSortBy !== undefined ? controlledSortBy : internalSortBy;
  const setSortBy = setControlledSortBy || setInternalSortBy;

  const [internalRecentOnly, setInternalRecentOnly] = useState<boolean>(false);
  const recentOnly = controlledRecentOnly !== undefined ? controlledRecentOnly : internalRecentOnly;
  const setRecentOnly = setControlledRecentOnly || setInternalRecentOnly;

  // 6 Specified Categories
  const categories = [
    { id: 'all', label: 'All Records', count: records.length, icon: 'folder' },
    { id: 'lab', label: '1. Lab Reports', count: records.filter((r) => r.category === 'lab').length, icon: 'biotech' },
    { id: 'prescription', label: '2. Prescriptions', count: records.filter((r) => r.category === 'prescription').length, icon: 'medication' },
    { id: 'notes', label: '3. Medical History', count: records.filter((r) => r.category === 'notes' || r.category === 'consult').length, icon: 'history_edu' },
    { id: 'vaccine', label: '4. Vaccination Records', count: records.filter((r) => r.category === ('vaccine' as any)).length, icon: 'vaccines' },
    { id: 'imaging', label: '5. Diagnostic Reports', count: records.filter((r) => r.category === 'imaging').length, icon: 'radiology' },
    { id: 'other', label: '6. Other Documents', count: records.filter((r) => r.category === 'discharge' || r.category === 'other').length, icon: 'description' },
  ];

  // Filtering
  const filteredRecords = records
    .filter((rec) => {
      // Category Filter
      if (activeCategory === 'all') {
        // all
      } else if (activeCategory === 'notes') {
        if (rec.category !== 'notes' && rec.category !== 'consult') return false;
      } else if (activeCategory === 'other') {
        if (rec.category !== 'discharge' && rec.category !== 'other') return false;
      } else if (rec.category !== activeCategory) {
        return false;
      }

      // Recent Filter (e.g. within 2024)
      if (recentOnly && !rec.date.includes('2024')) {
        return false;
      }

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rec.title.toLowerCase().includes(q) ||
        rec.clinician.toLowerCase().includes(q) ||
        rec.hospital.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      // Date sort
      return b.id.localeCompare(a.id);
    });

  return (
    <div className="flex flex-col w-full gap-4 pb-12 font-sans">
      {/* Mobile-First Header Banner */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              My Health Records
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-xs">
              {filteredRecords.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted Health Locker • Tap any square card to view full record details
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenUpload}
          className="h-10 sm:h-11 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto min-h-[44px]"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Upload Record</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
          <span className="material-symbols-outlined text-slate-400 text-[20px] ml-3.5 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search records by name, doctor, or hospital..."
            className="w-full h-11 pl-2.5 pr-10 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-slate-400 hover:text-slate-700"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* 6 Category Filter Chips (Horizontal Scrollable for Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Sort & Recent Records */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recentOnly}
              onChange={(e) => setRecentOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 focus:ring-blue-500 cursor-pointer"
            />
            <span className="font-medium text-slate-700">Recent Records (2024)</span>
          </label>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two-Column Square Grid on Mobile, Responsive to 3/4 cols on Tablet/Desktop (Problem 4 & Part 2) */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 text-xs sm:text-sm">
          <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2 block">folder_off</span>
          No medical records found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              onClick={() => onSelectRecord(rec)}
              className="aspect-square bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center text-center group active:scale-[0.98] select-none relative overflow-hidden"
              role="button"
              tabIndex={0}
              aria-label={`View record details for ${rec.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectRecord(rec);
              }}
            >
              {/* Category-Specific Representative Icon at Top */}
              <div className="transition-transform group-hover:scale-105 duration-200 mb-2 sm:mb-3">
                <RecordCategoryIcon record={rec} size={28} />
              </div>

              {/* Record Name ONLY - No doctor, hospital, date, or other metadata */}
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug px-1 max-w-full">
                {rec.title}
              </h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
