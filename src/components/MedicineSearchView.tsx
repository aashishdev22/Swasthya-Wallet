/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - User Medicine Locker + Indian Drug Reference Formulary
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import {
  INDIAN_MEDICINE_CATALOG,
  MedicalSystemType,
  MedicineItem,
} from '../data/medicineDatabase.ts';
import { UserMedicine } from '../types/health.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';
import { MedicineCategoryIcon } from './CategoryIcon.tsx';

interface MedicineSearchViewProps {
  currentLang?: SupportedLanguage;
  userMedicines?: UserMedicine[];
  onAddUserMedicine?: (med: Omit<UserMedicine, 'id'>) => void;
  onToggleUserMedicineActive?: (id: string) => void;
  onDeleteUserMedicine?: (id: string) => void;
  initialQuery?: string;
  initialSystem?: string;
  onSearchChange?: (q: string) => void;
  onSystemChange?: (sys: string) => void;
  filterPrescribedOnly?: boolean;
  onFilterPrescribedOnlyChange?: (val: boolean) => void;
  filterRecentOnly?: boolean;
  onFilterRecentOnlyChange?: (val: boolean) => void;
  onSelectMedicine: (med: MedicineItem, userMed?: UserMedicine) => void;
  onSelectFindAlternatives?: (med: MedicineItem) => void;
  onOpenPrescriptionScanner?: () => void;
}

export const MedicineSearchView: React.FC<MedicineSearchViewProps> = ({
  currentLang = 'en',
  userMedicines = [],
  onAddUserMedicine,
  onToggleUserMedicineActive,
  onDeleteUserMedicine,
  initialQuery = '',
  initialSystem = 'all',
  onSearchChange,
  onSystemChange,
  filterPrescribedOnly: controlledPrescribed,
  onFilterPrescribedOnlyChange: setControlledPrescribed,
  filterRecentOnly: controlledRecent,
  onFilterRecentOnlyChange: setControlledRecent,
  onSelectMedicine,
  onOpenPrescriptionScanner,
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

  // Manual Add Medicine Drawer State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newSystem, setNewSystem] = useState<MedicalSystemType>('allopathy');
  const [newSalt, setNewSalt] = useState<string>('');
  const [newForm, setNewForm] = useState<string>('Tablet');
  const [newStrength, setNewStrength] = useState<string>('');
  const [newFrequency, setNewFrequency] = useState<string>('');
  const [newDuration, setNewDuration] = useState<string>('');
  const [newInstructions, setNewInstructions] = useState<string>('');

  const systemFilters = [
    { id: 'all', label: 'All Systems', icon: 'apps' },
    { id: 'allopathy', label: 'Allopathy', icon: 'medication' },
    { id: 'ayurveda', label: 'Ayurveda', icon: 'spa' },
    { id: 'homeopathy', label: 'Homeopathy', icon: 'science' },
  ];

  // Filter personal medicines saved by this user
  const filteredUserMedicines = userMedicines.filter((med) => {
    if (selectedSystem !== 'all' && med.system !== selectedSystem) return false;
    if (filterPrescribedOnly && !med.linkedRecordId && !med.prescriptionDate) return false;
    if (filterRecentOnly && !med.isActive) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      med.name.toLowerCase().includes(q) ||
      med.genericOrActiveSalt.toLowerCase().includes(q) ||
      (med.strengthOrPotency && med.strengthOrPotency.toLowerCase().includes(q)) ||
      (med.prescriberName && med.prescriberName.toLowerCase().includes(q))
    );
  });

  // Reference formulary catalog (strictly clinical reference; user prescription links checked via userMedicines)
  const currentYear = String(new Date().getFullYear());
  const filteredFormulary = INDIAN_MEDICINE_CATALOG.filter((med) => {
    if (selectedSystem !== 'all' && med.system !== selectedSystem) {
      return false;
    }

    if (filterPrescribedOnly) {
      const matchedUserRx = userMedicines.some(
        (u) =>
          u.catalogMedicineId === med.id ||
          u.name.toLowerCase().includes(med.name.toLowerCase()) ||
          med.name.toLowerCase().includes(u.name.toLowerCase())
      );
      if (!matchedUserRx) return false;
    }

    if (filterRecentOnly) {
      const matchedRecentRx = userMedicines.some(
        (u) =>
          (u.catalogMedicineId === med.id || u.name.toLowerCase().includes(med.name.toLowerCase())) &&
          (u.isActive || (u.prescriptionDate && u.prescriptionDate.includes(currentYear)))
      );
      if (!matchedRecentRx) return false;
    }

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

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onAddUserMedicine) return;
    onAddUserMedicine({
      name: newName.trim(),
      system: newSystem,
      genericOrActiveSalt: newSalt.trim() || 'Specified by clinician',
      dosageForm: newForm,
      strengthOrPotency: newStrength.trim() || 'Standard',
      frequency: newFrequency.trim() || undefined,
      duration: newDuration.trim() || undefined,
      instructions: newInstructions.trim() || undefined,
      prescriptionDate: new Date().toLocaleDateString('en-GB'),
      isActive: true,
    });
    setNewName('');
    setNewSalt('');
    setNewStrength('');
    setNewFrequency('');
    setNewDuration('');
    setNewInstructions('');
    setShowAddForm(false);
  };

  const toPreviewMedicineItem = (u: UserMedicine): MedicineItem => {
    const matched = INDIAN_MEDICINE_CATALOG.find(
      (c) =>
        c.id === u.catalogMedicineId ||
        c.name.toLowerCase() === u.name.toLowerCase() ||
        c.genericOrActiveSalt.toLowerCase() === u.genericOrActiveSalt.toLowerCase()
    );
    if (matched) return matched;
    return {
      id: u.id,
      name: u.name,
      system: u.system,
      genericOrActiveSalt: u.genericOrActiveSalt,
      dosageForm: u.dosageForm,
      strengthOrPotency: u.strengthOrPotency,
      manufacturer: u.manufacturer || 'Patient Locker Entry',
      approxMrp: 0,
      onlineAvailability: {
        apollo: 'Order on Request',
        tata1mg: 'Order on Request',
        netmeds: 'Order on Request',
        janAushadhiKendra: 'Check Kendra',
      },
      nearbyPharmaciesCount: 0,
      ingredientsList: [u.genericOrActiveSalt],
      indications: 'As prescribed by your healthcare practitioner',
      directions: u.instructions || u.frequency || 'Follow clinician dosage instructions',
    };
  };

  return (
    <div className="w-full flex flex-col gap-4 font-sans pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Medicines
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-xs">
              {userMedicines.length} Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Your personal medicine locker & Indian Drug Reference Formulary (Allopathy, Ayurveda & Homeopathy)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onAddUserMedicine && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">{showAddForm ? 'close' : 'add'}</span>
              <span>{showAddForm ? 'Cancel' : 'Add Medicine'}</span>
            </button>
          )}
          {onOpenPrescriptionScanner && (
            <button
              type="button"
              onClick={onOpenPrescriptionScanner}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">document_scanner</span>
              <span>Scan Rx</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Manual Add Medicine Form */}
      {showAddForm && onAddUserMedicine && (
        <form
          onSubmit={handleManualAdd}
          className="bg-white rounded-3xl p-4 sm:p-6 border border-blue-200 shadow-xs flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="material-symbols-outlined text-blue-800 text-[20px]">medication</span>
            <h2 className="text-sm font-bold text-slate-900">Add Medicine to Personal Locker</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Medicine Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Dolo 650 / Ashwagandha Churna"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">System</label>
              <select
                value={newSystem}
                onChange={(e) => setNewSystem(e.target.value as MedicalSystemType)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="allopathy">Allopathy</option>
                <option value="ayurveda">Ayurveda</option>
                <option value="homeopathy">Homeopathy</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Active Salt / Composition</label>
              <input
                type="text"
                value={newSalt}
                onChange={(e) => setNewSalt(e.target.value)}
                placeholder="e.g. Paracetamol IP"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Dosage Form</label>
              <input
                type="text"
                value={newForm}
                onChange={(e) => setNewForm(e.target.value)}
                placeholder="Tablet, Capsule, Churna, Globules"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Strength / Potency</label>
              <input
                type="text"
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                placeholder="e.g. 650 mg / 30C"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Frequency & Duration</label>
              <input
                type="text"
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                placeholder="e.g. Twice daily after meals (5 days)"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
            >
              Save to My Medicines
            </button>
          </div>
        </form>
      )}

      {/* Search Bar & System Filters */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex flex-col gap-3">
        <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
          <span className="material-symbols-outlined text-slate-400 text-[20px] ml-3.5 pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your medicines or national formulary by name, salt, or potency..."
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

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterPrescribedOnly}
                onChange={(e) => setFilterPrescribedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium text-slate-700">Prescription-Linked Only</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterRecentOnly}
                onChange={(e) => setFilterRecentOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium text-slate-700">Active / Current</span>
            </label>
          </div>

          <span className="text-[11px] text-slate-400">
            {filteredUserMedicines.length} Personal • {filteredFormulary.length} Reference
          </span>
        </div>
      </div>

      {/* SECTION 1: Personal Saved / Prescribed Medicines (Real User Data) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-900 text-[20px]">prescriptions</span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">My Medicines Locker</h2>
          </div>
          <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full">
            {filteredUserMedicines.length} {filteredUserMedicines.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {filteredUserMedicines.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-slate-300">medication</span>
            <p className="text-xs sm:text-sm font-semibold text-slate-700">
              No medicines in your personal locker yet.
            </p>
            <p className="text-[11px] text-slate-500 max-w-md">
              Scan a prescription or add a medicine manually to track your active doses, frequencies, and linked prescriptions.
            </p>
            {onAddUserMedicine && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-1 px-3.5 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer"
              >
                + Add First Medicine
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUserMedicines.map((u) => (
              <div
                key={u.id}
                onClick={() => onSelectMedicine(toPreviewMedicineItem(u), u)}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {u.system} • {u.dosageForm}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1.5 truncate">{u.name}</h3>
                  <p className="text-xs text-slate-600 truncate">
                    {u.genericOrActiveSalt} {u.strengthOrPotency ? `• ${u.strengthOrPotency}` : ''}
                  </p>
                  {(u.frequency || u.instructions) && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {u.frequency || u.instructions}
                    </p>
                  )}
                </div>

                <div
                  className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-slate-400">
                    {u.prescriptionDate ? `Rx: ${u.prescriptionDate}` : 'Saved to Locker'}
                  </span>
                  <div className="flex items-center gap-2">
                    {onToggleUserMedicineActive && (
                      <button
                        type="button"
                        onClick={() => onToggleUserMedicineActive(u.id)}
                        className="text-blue-700 font-semibold hover:underline cursor-pointer"
                      >
                        {u.isActive ? 'Pause' : 'Resume'}
                      </button>
                    )}
                    {onDeleteUserMedicine && (
                      <button
                        type="button"
                        onClick={() => onDeleteUserMedicine(u.id)}
                        className="text-rose-600 font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Indian Drug Reference Formulary (2-Column Square Grid on Mobile) */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-800 text-[18px]">menu_book</span>
          <h2 className="text-sm font-bold text-slate-800">
            Indian Drug Reference Formulary (Allopathy, Ayurveda & Homeopathy)
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">{filteredFormulary.length} references</span>
      </div>

      {filteredFormulary.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 text-xs sm:text-sm">
          <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2 block">medication</span>
          No reference medicines found matching current filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {filteredFormulary.map((med) => {
            const matchedUserMed = userMedicines.find(
              (u) =>
                u.catalogMedicineId === med.id ||
                u.name.toLowerCase().includes(med.name.toLowerCase()) ||
                med.name.toLowerCase().includes(u.name.toLowerCase())
            );
            return (
              <div
                key={med.id}
                onClick={() => onSelectMedicine(med, matchedUserMed)}
                className="aspect-square bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center text-center group active:scale-[0.98] select-none relative overflow-hidden"
                role="button"
                tabIndex={0}
                aria-label={`View medicine details for ${med.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectMedicine(med, matchedUserMed);
                }}
              >
                <div className="transition-transform group-hover:scale-105 duration-200 mb-2 sm:mb-3">
                  <MedicineCategoryIcon medicine={med} size={28} />
                </div>

                <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug px-1 max-w-full">
                  {med.name}
                </h3>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
