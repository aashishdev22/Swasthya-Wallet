/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PatientProfile, MedicalRecord, VaccineItem, ActiveDelegation, AuditEvent } from '../data/mockData.ts';
import { NavTab } from './Sidebar.tsx';
import { SupportedLanguage, getTranslation, formatIndianDate, formatIndianCurrency } from '../utils/i18n.ts';

interface DashboardViewProps {
  patient: PatientProfile;
  records: MedicalRecord[];
  vaccines: VaccineItem[];
  delegations: ActiveDelegation[];
  auditLogs: AuditEvent[];
  isMobileShell?: boolean;
  onNavigateTab: (tab: NavTab) => void;
  onSelectRecord: (record: MedicalRecord) => void;
  onOpenUpload: () => void;
  onOpenDicomViewer: (record: MedicalRecord) => void;
  currentLang?: SupportedLanguage;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patient,
  records,
  vaccines,
  delegations,
  auditLogs: _auditLogs,
  isMobileShell = false,
  onNavigateTab,
  onSelectRecord,
  onOpenUpload,
  onOpenDicomViewer,
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const [tableSearch, setTableSearch] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      !tableSearch ||
      rec.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
      rec.clinician.toLowerCase().includes(tableSearch.toLowerCase()) ||
      rec.hospital.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesType = recordTypeFilter === 'all' || rec.category === recordTypeFilter;
    return matchesSearch && matchesType;
  });

  const activeDelegationsCount = delegations.filter((d) => !d.revoked).length;

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* Welcome & Citizen Health Card */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-900 flex items-center justify-center text-white overflow-hidden shadow-xs ring-2 ring-slate-100 shrink-0">
              <img
                src={patient.avatarUrl}
                alt={patient.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-blue-700 tracking-wide uppercase mb-0.5">
                Swasthya Wallet • Digital Health Locker for Citizens
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {patient.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  {t.verifiedBadge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t.abhaId}: <span className="font-semibold text-slate-800">{patient.synthMrn}</span> • {t.age}: {patient.age} {t.years}
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>{t.quickAddRecord}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('secure-sharing')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all border border-slate-200 cursor-pointer min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-700">share</span>
              <span>{t.quickShareDoctor}</span>
            </button>
          </div>
        </div>

        {/* Citizen Key Health Attributes Row */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">{t.bloodGroup}</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{patient.bloodType}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">{t.emergencyContact}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 truncate block">
              Priya Sharma (+91 98765)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">{t.primaryDoctor}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 truncate block">
              {patient.primaryAttending}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium block">{t.insuranceCard}</span>
            <span className="text-xs sm:text-sm font-semibold text-blue-800 mt-0.5 truncate block">
              {patient.insurance}
            </span>
          </div>
        </div>
      </section>

      {/* 4 Clean Metric Summary Cards */}
      <section className={`grid ${isMobileShell ? 'grid-cols-2 gap-3' : 'grid-cols-2 lg:grid-cols-4 gap-4'}`}>
        {/* Card 1: Health Records */}
        <div
          onClick={() => onNavigateTab('medical-records')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.activeRecordsCount}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{records.length}</div>
            <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>{t.tamperProof}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Vaccines */}
        <div
          onClick={() => onNavigateTab('vaccination-wallet')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.vaccinesGivenCount}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">vaccines</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{vaccines.length}</div>
            <div className="text-xs text-purple-700 font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>CoWIN Verified</span>
            </div>
          </div>
        </div>

        {/* Card 3: Upcoming Visits */}
        <div
          onClick={() => onNavigateTab('reminders-and-appointments')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.upcomingVisitsCount}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">2</div>
            <div className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>Dr. Ananya Iyer ({formatIndianCurrency(600)})</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Shares */}
        <div
          onClick={() => onNavigateTab('secure-sharing')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t.activeSharesCount}</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeDelegationsCount}</div>
            <div className="text-xs text-teal-700 font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>PIN & QR Protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Citizen Health Locker Services Hub */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Digital Health Locker Services
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Citizen Health Tools & Prescription Assistant
            </h2>
          </div>
          <span className="text-xs bg-white/10 border border-white/20 text-blue-100 px-3 py-1 rounded-full font-medium">
            Ayush & Allopathy Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Service 1: Prescription Assistant */}
          <button
            type="button"
            onClick={() => onNavigateTab('prescription-assistant')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Prescription OCR</span>
              <span className="text-[10px] text-blue-200 leading-tight block">Allopathy, Ayurveda & Homeo</span>
            </div>
          </button>

          {/* Service 2: Find Medicines */}
          <button
            type="button"
            onClick={() => onNavigateTab('find-medicines')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Find Medicines</span>
              <span className="text-[10px] text-blue-200 leading-tight block">Pharmacies & Jan Aushadhi</span>
            </div>
          </button>

          {/* Service 3: Medicine Alternatives */}
          <button
            type="button"
            onClick={() => onNavigateTab('medicine-alternatives')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Alternatives</span>
              <span className="text-[10px] text-blue-200 leading-tight block">Generic & Same-Salt Discovery</span>
            </div>
          </button>

          {/* Service 4: Full-Screen QR Sharing */}
          <button
            type="button"
            onClick={() => onNavigateTab('qr-sharing')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Full-Screen QR</span>
              <span className="text-[10px] text-blue-200 leading-tight block">Present Code to Clinician</span>
            </div>
          </button>

          {/* Service 5: Storage Settings & Google Drive */}
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Storage Settings</span>
              <span className="text-[10px] text-blue-200 leading-tight block">Device & Drive Backup</span>
            </div>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Recent Health Records List (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t.recordsTitle}</h2>
                <p className="text-xs text-slate-500">{t.recordsSubtitle}</p>
              </div>

              {/* Category Filter Controls */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setRecordTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    recordTypeFilter === 'all'
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.all}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordTypeFilter('lab')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    recordTypeFilter === 'lab'
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.labTest}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordTypeFilter('imaging')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    recordTypeFilter === 'imaging'
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.imagingXray}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordTypeFilter('prescription')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    recordTypeFilter === 'prescription'
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.prescriptions}
                </button>
              </div>
            </div>

            {/* In-table search input */}
            <div className="pt-3 pb-2">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Records List Items */}
            <div className="divide-y divide-slate-100 mt-2">
              {filteredRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No records match your search.
                </div>
              ) : (
                filteredRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          rec.category === 'lab'
                            ? 'bg-blue-50 text-blue-700'
                            : rec.category === 'imaging'
                            ? 'bg-purple-50 text-purple-700'
                            : rec.category === 'prescription'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {rec.category === 'imaging'
                            ? 'radiology'
                            : rec.category === 'prescription'
                            ? 'medication'
                            : rec.category === 'lab'
                            ? 'biotech'
                            : 'description'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {rec.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {rec.clinician} • {rec.hospital}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-medium text-slate-600">
                            {formatIndianDate(rec.date)}
                          </span>
                          <span>·</span>
                          <span>{rec.fileFormat}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            {t.tamperProof}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 sm:shrink-0 self-end sm:self-center">
                      {rec.category === 'imaging' && (
                        <button
                          type="button"
                          onClick={() => onOpenDicomViewer(rec)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-900 hover:bg-purple-100 text-xs font-semibold transition-all cursor-pointer"
                        >
                          {t.viewImage}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectRecord(rec)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 text-xs font-semibold transition-all cursor-pointer"
                      >
                        {t.viewDetails}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Appointments & Reminders (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Upcoming Visits Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-800 text-[20px]">calendar_month</span>
                <h3 className="font-bold text-sm text-slate-900">{t.scheduledVisits}</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('reminders-and-appointments')}
                className="text-xs text-blue-700 font-semibold hover:underline"
              >
                {t.viewDetails}
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {/* Visit 1 */}
              {!dismissedAlerts.includes('dr-ananya') && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Dr. Ananya Iyer, MD</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Max Super Speciality Hospital, Saket
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                      {formatIndianCurrency(600)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                    <span>15/11/2024 at 10:30 AM IST</span>
                    <button
                      type="button"
                      onClick={() => setDismissedAlerts((p) => [...p, 'dr-ananya'])}
                      className="text-[11px] text-slate-400 hover:text-slate-700"
                    >
                      {t.close}
                    </button>
                  </div>
                </div>
              )}

              {/* Lab Test */}
              {!dismissedAlerts.includes('lal-path') && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Fasting Blood Sugar Test</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Dr. Lal PathLabs (Home Collection)
                      </span>
                    </div>
                    <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                      {formatIndianCurrency(350)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                    <span>16/11/2024 at 07:30 AM IST</span>
                    <button
                      type="button"
                      onClick={() => setDismissedAlerts((p) => [...p, 'lal-path'])}
                      className="text-[11px] text-slate-400 hover:text-slate-700"
                    >
                      {t.close}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('reminders-and-appointments')}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer text-center"
            >
              {t.bookVisit}
            </button>
          </div>

          {/* Quick Verify Card */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-[22px]">verified</span>
              <h3 className="font-bold text-sm">{t.verificationTitle}</h3>
            </div>
            <p className="text-xs text-blue-200 mt-1 leading-relaxed">
              {t.verificationSubtitle}
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('document-verification')}
              className="mt-4 w-full py-2.5 rounded-xl bg-white text-blue-950 hover:bg-blue-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {t.quickVerifyReport}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
