/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Citizen Vaccination Wallet (CoWIN & ABDM Ledger)
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import { PatientProfile, VaccineItem } from '../types/health.ts';
import { LogVaccineModal } from './LogVaccineModal.tsx';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface VaccinationWalletViewProps {
  patient: PatientProfile;
  vaccines: VaccineItem[];
  onAddVaccine?: (vaccine: VaccineItem) => void;
  onDeleteVaccine?: (id: string) => void;
  isMobileShell?: boolean;
  onNavigateTab?: (tab: string) => void;
  onOpenScanPaperModal?: () => void;
  currentLang?: SupportedLanguage;
}

export const VaccinationWalletView: React.FC<VaccinationWalletViewProps> = ({
  patient,
  vaccines,
  onAddVaccine,
  onDeleteVaccine,
  isMobileShell = false,
  onNavigateTab,
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const [filterType, setFilterType] = useState<'all' | 'administered' | 'due' | 'seasonal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedVaccineForModal, setSelectedVaccineForModal] = useState<VaccineItem | null>(null);
  const [mobileSubView, setMobileSubView] = useState<'ledger' | 'certificate'>('ledger');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const completedCount = vaccines.filter((v) => v.type === 'administered').length;
  const upcomingCount = vaccines.filter((v) => v.type === 'seasonal').length;
  const overdueCount = vaccines.filter((v) => v.type === 'due').length;

  const filteredVaccines = vaccines.filter((v) => {
    const matchesFilter = filterType === 'all' || v.type === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.code.toLowerCase().includes(q) ||
      (v.subtitle && v.subtitle.toLowerCase().includes(q)) ||
      (v.lot && v.lot.toLowerCase().includes(q)) ||
      (v.facility && v.facility.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const handleDownloadFhirJson = () => {
    if (vaccines.length === 0) {
      showToast('No immunization records available to export.');
      return;
    }
    const payload = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      patient: {
        name: patient.name,
        abha: patient.synthMrn,
        mrn: patient.mrn,
      },
      entry: vaccines.map((v) => ({
        resource: {
          resourceType: 'Immunization',
          id: v.id,
          status: v.type === 'administered' ? 'completed' : 'not-done',
          vaccineCode: { coding: [{ system: 'http://hl7.org/fhir/sid/cvx', code: v.code, display: v.title }] },
          occurrenceDateTime: v.lastDose || v.dueDate,
          lotNumber: v.lot,
          location: { display: v.facility },
        },
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Swasthya_Immunization_FHIR_${patient.mrn}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('FHIR R4 Immunization bundle exported.');
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[11px] uppercase tracking-wider">
              {t.cowinVerified}
            </span>
            <span className="text-xs font-semibold text-slate-500">ABHA • FHIR R4 Immunization</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {t.vaccinesTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Citizen: <strong className="text-slate-800">{patient.name}</strong> • ABHA: {patient.synthMrn}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Log Vaccine Dose</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadFhirJson}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export FHIR JSON</span>
          </button>
        </div>
      </div>

      {/* Real Metric Summary Row */}
      <div className={`grid ${isMobileShell ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-3`}>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Logged</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{vaccines.length}</span>
          <span className="text-[11px] text-blue-700 font-medium">Immunization Records</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Completed Doses</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{completedCount}</span>
          <span className="text-[11px] text-emerald-700 font-medium">Verified / Recorded</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Seasonal / Upcoming</span>
          <span className="text-2xl font-extrabold text-blue-900 mt-1 block">{upcomingCount}</span>
          <span className="text-[11px] text-slate-500 font-medium">Scheduled Windows</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Due / Overdue</span>
          <span className={`text-2xl font-extrabold mt-1 block ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueCount}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Action Required</span>
        </div>
      </div>

      {isMobileShell && (
        <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileSubView('ledger')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileSubView === 'ledger' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700'
            }`}
          >
            Immunization Ledger ({vaccines.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileSubView('certificate')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mobileSubView === 'certificate' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700'
            }`}
          >
            Digital Pass
          </button>
        </div>
      )}

      {isMobileShell && mobileSubView === 'certificate' ? (
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                ABDM • W3C Verifiable Pass
              </span>
              <h2 className="text-base font-bold">{patient.name}</h2>
            </div>
            <span className="material-symbols-outlined text-[28px] text-emerald-400">verified</span>
          </div>
          {vaccines.length === 0 ? (
            <div className="py-6 text-center text-xs text-blue-100">
              Log your first vaccination certificate to generate your digital immunization pass.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {vaccines.slice(0, 3).map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-white/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{v.title}</div>
                    <div className="text-[11px] text-blue-200 truncate">
                      {v.lastDose || v.dueDate || 'Date not set'} • {v.facility || 'Clinic'}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 shrink-0">
                    {v.code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vaccines by name, CVX code, lot #, or facility..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'administered', label: 'Completed' },
                { id: 'seasonal', label: 'Seasonal' },
                { id: 'due', label: 'Due' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Empty State or Dynamic Vaccine Rows */}
          {filteredVaccines.length === 0 ? (
            <div className="py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">vaccines</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {vaccines.length === 0
                  ? 'No vaccination records logged yet'
                  : 'No immunizations match your current filter'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                {vaccines.length === 0
                  ? 'Log your COVID-19, Tdap, Hepatitis, Typhoid, or seasonal flu doses and CoWIN certificates into your encrypted citizen locker.'
                  : 'Try clearing the search term or switching the status filter.'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowLogModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
                >
                  + Log First Vaccine Dose
                </button>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('reminders-and-appointments')}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Schedule Reminders
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredVaccines.map((v) => (
                <div
                  key={v.id}
                  className="py-3.5 px-2 rounded-xl hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        v.type === 'due'
                          ? 'bg-rose-50 text-rose-700'
                          : v.type === 'seasonal'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">vaccines</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900">{v.title}</h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {v.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            v.type === 'due'
                              ? 'bg-rose-100 text-rose-800'
                              : v.type === 'seasonal'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>
                      {v.subtitle && (
                        <p className="text-xs text-slate-600 mt-0.5">{v.subtitle}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                        {v.lastDose && <span>Date: <strong className="text-slate-700">{v.lastDose}</strong></span>}
                        {v.dueDate && <span>Due: <strong className="text-rose-700">{v.dueDate}</strong></span>}
                        {v.lot && <span>Batch/Lot: <strong className="font-mono text-slate-700">{v.lot}</strong></span>}
                        {v.facility && <span>Facility: <strong className="text-slate-700">{v.facility}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedVaccineForModal(v)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold cursor-pointer"
                    >
                      Certificate
                    </button>
                    {onDeleteVaccine && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteVaccine(v.id);
                          showToast(`Removed ${v.title} from immunization ledger.`);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Vaccine Modal */}
      <LogVaccineModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        patient={patient}
        onAddVaccine={(vax) => {
          if (onAddVaccine) {
            onAddVaccine(vax);
          }
        }}
        onSuccess={(vaxName) => showToast(`${vaxName} certificate saved to your citizen health locker.`)}
        currentLang={currentLang}
      />

      {/* Certificate Detail Modal */}
      {selectedVaccineForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-[20px]">verified</span>
                <h3 className="font-bold text-sm text-slate-900">Immunization Certificate Detail</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVaccineForModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-blue-900 text-white text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                ABDM / CoWIN Citizen Record
              </span>
              <h4 className="text-base font-bold mt-1">{selectedVaccineForModal.title}</h4>
              <p className="text-xs text-blue-200 mt-0.5">
                {selectedVaccineForModal.code} • {selectedVaccineForModal.status}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Citizen</span>
                <span className="font-semibold text-slate-900">{patient.name}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Administration Date</span>
                <span className="font-semibold text-slate-900">
                  {selectedVaccineForModal.lastDose || selectedVaccineForModal.dueDate || 'Not set'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Batch / Lot #</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedVaccineForModal.lot || 'Not provided'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Facility</span>
                <span className="font-semibold text-slate-900 truncate block">
                  {selectedVaccineForModal.facility || 'Citizen Self-Reported'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedVaccineForModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
