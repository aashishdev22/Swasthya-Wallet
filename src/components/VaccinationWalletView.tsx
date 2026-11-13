/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PatientProfile, VaccineItem } from '../data/mockData.ts';
import { LogVaccineModal } from './LogVaccineModal.tsx';
import { SupportedLanguage, getTranslation, formatIndianDate } from '../utils/i18n.ts';

interface VaccinationWalletViewProps {
  patient: PatientProfile;
  vaccines: VaccineItem[];
  isMobileShell?: boolean;
  onOpenScanPaperModal?: () => void;
  onNavigateTab?: (tab: string) => void;
  currentLang?: SupportedLanguage;
}

export const VaccinationWalletView: React.FC<VaccinationWalletViewProps> = ({
  patient,
  vaccines,
  isMobileShell = false,
  onNavigateTab,
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'upcoming' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mobileSubView, setMobileSubView] = useState<'certificate' | 'ledger'>('ledger');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedVaccineForModal, setSelectedVaccineForModal] = useState<VaccineItem | null>(null);
  const [showFhirPayloadAccordion, setShowFhirPayloadAccordion] = useState(false);
  const [sigCopied, setSigCopied] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered vaccines list
  const filteredVaccines = vaccines.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.lot ? v.lot.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (v.facility ? v.facility.toLowerCase().includes(searchQuery.toLowerCase()) : false);

    const matchesCategory = true;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'titer' && v.title.includes('Hepatitis B')) ||
      (statusFilter === 'iis' && v.status === 'verified') ||
      (statusFilter === 'self' && v.status === 'staged');

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'completed' && v.type === 'administered') ||
      (activeTab === 'upcoming' && (v.type === 'due' || v.type === 'seasonal')) ||
      (activeTab === 'overdue' && v.id === 'vac-1');

    return matchesSearch && matchesCategory && matchesStatus && matchesTab;
  });

  const handleCopySig = () => {
    navigator.clipboard?.writeText('7a8f9c102b4e89dfecd301');
    setSigCopied(true);
    showToast('Cryptographic signature copied to clipboard.');
    setTimeout(() => setSigCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-12">
      {/* =========================================================================
          DESKTOP VIEW: Vaccination Wallet & Schedule Management (Template #2)
         ========================================================================= */}
      {!isMobileShell ? (
        <div className="flex flex-col w-full gap-5">
          {/* Breadcrumb & Regulatory Header */}
          <div className="bg-surface border-b border-surface-variant pb-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <span className="text-blue-800 font-semibold">CoWIN / Digital India</span>
                <span>/</span>
                <span>National Immunization Schedule</span>
                <span>/</span>
                <span className="text-slate-900 font-bold">ABHA: {patient.synthMrn}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  CoWIN Verified Digital Certificates
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Universal Immunization Registry
                </span>
              </div>
            </div>

            {/* Main Header View */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.vaccinesTitle}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    {t.verifiedBadge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.vaccinesSubtitle}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVaccineForModal(vaccines[2] || vaccines[0])}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container text-xs font-semibold transition-all shadow-xs border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">qr_code_2</span>
                  <span>Export SMART® Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('reminders-and-appointments') : showToast('Reminders opened')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container text-xs font-semibold transition-all shadow-xs border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">notifications_active</span>
                  <span>Configure Reminders</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('CDC ACIP 2024 Schedule Configured (Adult 19-49 Years cohort).')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container text-xs font-semibold transition-all shadow-xs border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                  <span>Schedule Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ Add / Log Vaccine Dose</span>
                </button>
              </div>
            </div>
          </div>

          {/* Intelligent Schedule Assumptions & Clinical Banner */}
          <div className="rounded-xl p-4 bg-surface-container-low shadow-xs border border-outline-variant/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-secondary">
                <span className="material-symbols-outlined text-[24px]">model_training</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-primary">ACIP 2024 Adult Schedule Rule Engine v4.2</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-code-sm text-[10px] font-semibold">
                    SYNTHETIC ACTIVE
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 max-w-4xl leading-relaxed">
                  Next due dates computed algorithmically from Eleanor Vance (Age: 35Y), recorded dose intervals, and immunocompetence flags. Clinical exceptions and contraindications can be registered through backend clinical sync.
                </p>
                <div className="flex items-center gap-3 mt-1.5 font-code-sm text-[11px] text-on-surface-variant">
                  <span>Source: <strong className="text-on-surface">CDC / ACIP General Best Practice Guidelines</strong></span>
                  <span>•</span>
                  <span className="text-error font-medium">Demo schedule projection for simulation only — consult your primary healthcare provider.</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
              <span className="font-code-sm text-xs text-secondary bg-surface-container-lowest px-2.5 py-1.5 rounded shadow-xs border border-outline-variant/20">
                SHA256: 9b2d...c308
              </span>
            </div>
          </div>

          {/* Metric Summary Cards: 4 across */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Administered & Verified */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs text-on-surface-variant uppercase font-semibold">Administered & Verified</span>
                <div className="w-8 h-8 rounded-lg bg-tertiary-container text-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary leading-none">8</span>
                  <span className="text-xs text-on-surface-variant font-medium">Protocols</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-container">
                  <span className="font-code-sm text-[11px] text-secondary font-medium">10 doses recorded</span>
                  <span className="font-code-sm text-[11px] text-on-surface-variant font-semibold">100% Cryptographic</span>
                </div>
              </div>
            </div>

            {/* Card 2: Upcoming & Recommended */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs text-on-surface-variant uppercase font-semibold">Upcoming & Recommended</span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">event_repeat</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-secondary leading-none">1</span>
                  <span className="text-xs text-on-surface-variant font-medium">Protocol</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-container">
                  <span className="font-code-sm text-[11px] text-secondary font-medium truncate">Seasonal Flu 2024–2025</span>
                  <span className="font-code-sm text-[11px] text-on-surface-variant">Window: Oct–Dec</span>
                </div>
              </div>
            </div>

            {/* Card 3: Overdue Dose */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs text-error uppercase font-semibold">Overdue Dose</span>
                <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-error leading-none">1</span>
                  <span className="text-xs text-error font-medium">Protocol</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-container">
                  <span className="font-code-sm text-[11px] text-error font-semibold">Tdap Booster (+18 Days)</span>
                  <span className="font-code-sm text-[10px] px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-bold">
                    URGENT
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Exemptions & Deferrals */}
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs text-on-surface-variant uppercase font-semibold">Exemptions & Deferrals</span>
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-on-surface leading-none">0</span>
                  <span className="text-xs text-on-surface-variant font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-container">
                  <span className="font-code-sm text-[11px] text-on-surface-variant">Physician Attestation</span>
                  <button
                    type="button"
                    onClick={() => showToast('Medical exemption requisition form initiated.')}
                    className="font-code-sm text-[11px] text-secondary hover:underline font-semibold"
                  >
                    + Request
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid: 8-column records list + 4-column side interactive pass and reminders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (8 cols): Structured Immunization Ledger & Filter Toolbar */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Filter, Search and Category Bar */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative w-full flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search vaccines by antigen, CVX code, brand, lot number, or provider..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none"
                    >
                      <option value="all">Category: Routine Adult</option>
                      <option value="seasonal">Category: Seasonal</option>
                      <option value="travel">Category: Travel</option>
                      <option value="occupational">Category: Occupational</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs focus:outline-none"
                    >
                      <option value="all">Status: IIS Verified</option>
                      <option value="titer">Lab Titer Verified</option>
                      <option value="self">Self-Reported</option>
                    </select>
                  </div>
                </div>

                {/* Status Segmented Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === 'all'
                        ? 'bg-primary-container text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>All Immunizations</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-secondary text-on-secondary font-code-sm text-[10px]">
                      10
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('completed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === 'completed'
                        ? 'bg-primary-container text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>Completed Series</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-surface-dim text-on-surface-variant font-code-sm text-[10px]">
                      8
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === 'upcoming'
                        ? 'bg-primary-container text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>Upcoming & Due</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-code-sm text-[10px]">
                      1
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overdue')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeTab === 'overdue'
                        ? 'bg-error text-on-error shadow-xs'
                        : 'bg-error-container text-on-error-container hover:bg-error-container/80'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">priority_high</span>
                    <span>Overdue</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-error text-on-error font-code-sm text-[10px]">
                      1
                    </span>
                  </button>
                </div>
              </div>

              {/* Ledger Cards Table Header */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
                <div className="px-4 py-3 bg-surface-container flex items-center justify-between border-b border-surface-variant">
                  <div className="flex items-center gap-2 font-semibold text-xs text-primary">
                    <span className="material-symbols-outlined text-secondary text-[18px]">history_edu</span>
                    <span>Structured Clinical Ledger</span>
                  </div>
                  <div className="flex items-center gap-2 font-code-sm text-[11px] text-on-surface-variant">
                    <span>Standard: CDC/IIS-HL7-VXU</span>
                    <span>•</span>
                    <span>Sort: Priority & Due Date</span>
                  </div>
                </div>

                {/* Ledger Items List */}
                <div className="divide-y divide-surface-container">
                  {/* Row 1: Overdue Dose (Tdap) */}
                  <div className="p-4 hover:bg-surface-container-low transition-colors bg-surface-container-lowest flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">emergency</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-primary">
                              Tdap (Tetanus, Diphtheria, Acellular Pertussis)
                            </h3>
                            <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                              CVX 115 • Boostrix
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-on-error-container font-code-sm text-[10px] font-bold animate-pulse">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              18 DAYS OVERDUE
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                            <span>Series: <strong className="text-on-surface">Dose 1 of 1 (10-Yr Booster)</strong></span>
                            <span>Administered: <strong className="text-on-surface">Oct 14, 2014</strong></span>
                            <span>Facility: <strong className="text-on-surface">Metro Health Clinic</strong></span>
                            <span>Lot: <span className="font-code-sm font-semibold">#BOO-99120B</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 mt-2 sm:mt-0">
                        <span className="inline-flex items-center gap-1 font-code-sm text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          WA IIS Attested
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setShowLogModal(true)}
                            className="px-3 py-1.5 rounded bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-all shadow-xs"
                          >
                            Schedule Dose
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLogModal(true)}
                            className="px-2.5 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant text-xs font-semibold transition-all"
                          >
                            Log Dose
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 p-2.5 rounded-lg bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-error font-medium">
                        <span className="material-symbols-outlined text-[16px]">event_busy</span>
                        <span>Calculated Expiration: Oct 14, 2024. ACIP guidelines recommend decennial booster every 10 years.</span>
                      </div>
                      <div className="flex items-center gap-2 font-code-sm text-[10px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">attachment</span>
                          PDF Archive (420 KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedVaccineForModal(vaccines[0])}
                          className="text-secondary hover:underline font-semibold"
                        >
                          View History »
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: COVID-19 Moderna */}
                  <div className="p-4 hover:bg-surface-container-low transition-colors bg-surface-container-lowest flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">coronavirus</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-primary">
                              COVID-19 mRNA (Moderna Spikevax 2023–2024 Formula)
                            </h3>
                            <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                              CVX 311 • Spikevax 0.5mL
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-code-sm text-[10px] font-bold">
                              <span className="material-symbols-outlined text-[12px]">verified_user</span>
                              W3C VC PASS
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                            <span>Dose: <strong className="text-on-surface">Dose 3 (Bivalent Updated)</strong></span>
                            <span>Administered: <strong className="text-on-surface">Oct 12, 2023</strong></span>
                            <span>Provider: <strong className="text-on-surface">CVS Pharmacy #4021</strong></span>
                            <span>Lot: <span className="font-code-sm font-semibold">#MOD-09941A</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 mt-2 sm:mt-0">
                        <span className="inline-flex items-center gap-1 font-code-sm text-[10px] text-on-tertiary-fixed-variant bg-tertiary-fixed/30 px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[13px]">enhanced_encryption</span>
                          Cryptographically Anchored
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedVaccineForModal(vaccines[2] || vaccines[0])}
                            className="px-3 py-1.5 rounded bg-surface-container-highest text-primary hover:bg-surface-variant text-xs font-semibold transition-all"
                          >
                            View Certificate
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedVaccineForModal(vaccines[2] || vaccines[0])}
                            className="px-2.5 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">qr_code</span>
                            <span>QR Pass</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 p-2.5 rounded-lg bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
                        <span>Next Due: Fall 2024/2025 Seasonal formulation release pending FDA/ACIP final timing.</span>
                      </div>
                      <span className="font-code-sm text-[10px] text-on-surface-variant">Signature: JWS-ECDSA (secp256r1)</span>
                    </div>
                  </div>

                  {/* Row 3: Hepatitis B Recombinant */}
                  <div className="p-4 hover:bg-surface-container-low transition-colors bg-surface-container-lowest flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">bloodtype</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-primary">
                              Hepatitis B (Recombinant)
                            </h3>
                            <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                              CVX 08 • Engerix-B
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-code-sm text-[10px] font-semibold">
                              LIFETIME PROTECTION
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                            <span>Status: <strong className="text-on-surface">Series 3 of 3 (Complete)</strong></span>
                            <span>Completed: <strong className="text-on-surface">May 19, 2019</strong></span>
                            <span>Provider: <strong className="text-on-surface">UW Medicine Primary Care</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 mt-2 sm:mt-0">
                        <span className="inline-flex items-center gap-1 font-code-sm text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[13px]">science</span>
                          Lab Titer Verified
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedVaccineForModal(vaccines[3] || vaccines[0])}
                            className="px-3 py-1.5 rounded bg-surface-container-highest text-primary hover:bg-surface-variant text-xs font-semibold transition-all"
                          >
                            View Record
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 p-2.5 rounded-lg bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-on-surface">
                        <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">check_circle</span>
                        <span>Quantitative Titer: <strong>Anti-HBs &gt; 100 mIU/mL (Immune / Protective)</strong> • LOINC 22322-2</span>
                      </div>
                      <span className="font-code-sm text-[10px] text-on-surface-variant">Lab: Quest Diagnostics (CLIA-Validated)</span>
                    </div>
                  </div>

                  {/* Row 4: Seasonal Influenza */}
                  <div className="p-4 hover:bg-surface-container-low transition-colors bg-surface-container-lowest flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-primary">
                              Influenza, Inactivated (IIV4, High-Dose/Standard)
                            </h3>
                            <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                              CVX 158 • Fluzone Quadrivalent
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-code-sm text-[10px] font-bold">
                              RECOMMENDED WINDOW
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                            <span>Protocol: <strong className="text-on-surface">Seasonal 2024–2025</strong></span>
                            <span>Target Window: <strong className="text-secondary font-semibold">By Dec 15, 2024</strong></span>
                            <span>Provider: <span className="italic text-on-surface-variant">Pending Scheduling</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 mt-2 sm:mt-0">
                        <span className="inline-flex items-center gap-1 font-code-sm text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                          ACIP Annual Rec
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => showToast('Opening provider scheduling network for flu prophylaxis...')}
                            className="px-3 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary/90 text-xs font-semibold transition-all"
                          >
                            Book In-Network
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLogModal(true)}
                            className="px-2.5 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant text-xs font-semibold transition-all"
                          >
                            Mark Administered
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 p-2.5 rounded-lg bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-secondary">flare</span>
                        <span>Annual seasonal prophylaxis. Recommended timing between September and end of November.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast('Displaying 12 local in-network pharmacy clinics.')}
                        className="text-secondary font-code-sm text-[11px] font-semibold hover:underline"
                      >
                        Find Local Pharmacies »
                      </button>
                    </div>
                  </div>

                  {/* Row 5: MMR */}
                  <div className="p-4 hover:bg-surface-container-low transition-colors bg-surface-container-lowest flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">shield</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-primary">
                              MMR (Measles, Mumps, Rubella Virus Vaccine Live)
                            </h3>
                            <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                              CVX 03 • M-M-R II
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-code-sm text-[10px] font-semibold">
                              COMPLETE
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                            <span>Status: <strong className="text-on-surface">Series 2 of 2 (Complete)</strong></span>
                            <span>Administered: <strong className="text-on-surface">Aug 22, 2007</strong></span>
                            <span>Provider: <strong className="text-on-surface">Valley Pediatric Group</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 mt-2 sm:mt-0">
                        <span className="inline-flex items-center gap-1 font-code-sm text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded">
                          WA IIS Historic
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedVaccineForModal(vaccines[4] || vaccines[0])}
                            className="px-3 py-1.5 rounded bg-surface-container-highest text-primary hover:bg-surface-variant text-xs font-semibold transition-all"
                          >
                            View Record
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Varicella */}
                  <div className="p-4 hover:bg-surface-container-low transition-colors bg-surface-container-lowest flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">healing</span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-xs sm:text-sm text-primary">
                              Varicella (Chickenpox Live Virus)
                            </h3>
                            <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                              CVX 21 • Varivax
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-code-sm text-[10px] font-semibold">
                              COMPLETE
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-1">
                            <span>Status: <strong className="text-on-surface">Series 2 of 2 (Complete)</strong></span>
                            <span>Administered: <strong className="text-on-surface">Jun 14, 2005</strong></span>
                            <span>Facility: <strong className="text-on-surface">Kaiser Permanente</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 mt-2 sm:mt-0">
                        <span className="inline-flex items-center gap-1 font-code-sm text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded">
                          Attested Registry
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedVaccineForModal(vaccines[0])}
                            className="px-3 py-1.5 rounded bg-surface-container-highest text-primary hover:bg-surface-variant text-xs font-semibold transition-all"
                          >
                            View Record
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagination & Bulk Export Bar */}
              <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-code-sm text-xs text-on-surface-variant">
                  <span>Showing {filteredVaccines.length} of 10 immunization records</span>
                  <span>•</span>
                  <span className="text-primary font-semibold">HL7 VXU v2.5.1 Schema Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(vaccines, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'FHIR_Immunization_Bundle.json';
                      a.click();
                      showToast('FHIR R4 JSON bundle exported.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Download FHIR JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Print Official Ledger</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): SMART® Health Pass Card, Reminders & Schedule Engine Controls */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* SMART® Health Card Verifiable Pass */}
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
                <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[22px]">smart_card_reader</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm leading-tight">SMART® Health Card</span>
                      <span className="font-code-sm text-[10px] text-secondary uppercase font-semibold">W3C Verifiable Credential</span>
                    </div>
                  </div>
                  <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-semibold">
                    ISSUER: WA DOH
                  </span>
                </div>

                {/* QR Code Body */}
                <div className="p-4 flex flex-col items-center text-center bg-surface-container-lowest">
                  <div className="p-3 bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20 relative group">
                    {/* High Precision Cryptographic 2D Code Vector */}
                    <svg className="w-44 h-44 text-primary" fill="currentColor" viewBox="0 0 160 160">
                      <rect fill="currentColor" height="40" rx="4" width="40" x="10" y="10"></rect>
                      <rect fill="#FFFFFF" height="28" rx="2" width="28" x="16" y="16"></rect>
                      <rect fill="currentColor" height="16" rx="1" width="16" x="22" y="22"></rect>
                      <rect fill="currentColor" height="40" rx="4" width="40" x="110" y="10"></rect>
                      <rect fill="#FFFFFF" height="28" rx="2" width="28" x="116" y="16"></rect>
                      <rect fill="currentColor" height="16" rx="1" width="16" x="122" y="22"></rect>
                      <rect fill="currentColor" height="40" rx="4" width="40" x="10" y="110"></rect>
                      <rect fill="#FFFFFF" height="28" rx="2" width="28" x="16" y="116"></rect>
                      <rect fill="currentColor" height="16" rx="1" width="16" x="22" y="122"></rect>
                      <rect height="6" width="6" x="56" y="14"></rect>
                      <rect height="6" width="10" x="68" y="14"></rect>
                      <rect height="6" width="6" x="84" y="14"></rect>
                      <rect height="6" width="6" x="96" y="14"></rect>
                      <rect height="6" width="8" x="56" y="26"></rect>
                      <rect height="10" width="6" x="70" y="26"></rect>
                      <rect height="6" width="12" x="82" y="26"></rect>
                      <rect height="6" width="6" x="98" y="26"></rect>
                      <rect height="6" width="14" x="56" y="38"></rect>
                      <rect height="6" width="6" x="76" y="42"></rect>
                      <rect height="6" width="8" x="88" y="38"></rect>
                      <rect fill="#006398" height="16" rx="2" width="16" x="72" y="54"></rect>
                      <rect height="6" width="8" x="94" y="56"></rect>
                      <rect height="12" width="6" x="110" y="56"></rect>
                      <rect height="6" width="14" x="124" y="56"></rect>
                      <rect height="8" width="6" x="144" y="56"></rect>
                      <rect height="6" width="12" x="14" y="86"></rect>
                      <rect height="6" width="6" x="32" y="86"></rect>
                      <rect height="12" width="6" x="44" y="90"></rect>
                      <rect height="6" width="10" x="56" y="78"></rect>
                      <rect height="12" width="6" x="72" y="76"></rect>
                      <rect height="8" width="8" x="84" y="82"></rect>
                      <rect height="10" width="6" x="98" y="82"></rect>
                      <rect height="6" width="12" x="110" y="90"></rect>
                      <rect height="6" width="8" x="128" y="84"></rect>
                      <rect height="6" width="8" x="142" y="86"></rect>
                      <rect height="6" width="8" x="56" y="98"></rect>
                      <rect height="10" width="6" x="70" y="94"></rect>
                      <rect height="6" width="12" x="82" y="98"></rect>
                      <rect height="6" width="6" x="98" y="98"></rect>
                      <rect height="12" width="6" x="56" y="112"></rect>
                      <rect height="6" width="10" x="68" y="110"></rect>
                      <rect height="8" width="6" x="84" y="116"></rect>
                      <rect height="12" width="6" x="96" y="110"></rect>
                    </svg>
                  </div>

                  <div className="mt-3 flex flex-col items-center">
                    <span className="font-bold text-sm text-primary">{patient.name}</span>
                    <span className="font-code-sm text-[11px] text-on-surface-variant">
                      DOB: {patient.dob} • MRN {patient.mrn}
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-code-sm text-[10px] font-semibold mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed"></span>
                      <span>SHA-256 Digest: 8c3f4e19...b62a</span>
                    </div>
                  </div>

                  {/* Wallet Buttons */}
                  <div className="grid grid-cols-2 gap-2 w-full mt-3">
                    <button
                      type="button"
                      onClick={() => showToast('Apple Wallet pass bundle exported (.pkpass).')}
                      className="py-2 px-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[17px]">wallet</span>
                      <span>Apple Wallet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Google Wallet pass JWT minted.')}
                      className="py-2 px-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                      <span>Google Wallet</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      showToast('Verifiable cryptographic pass link copied.');
                    }}
                    className="w-full mt-1.5 py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    <span>Share Verifiable Cryptographic Link</span>
                  </button>
                </div>
              </div>

              {/* Automated Schedule Reminders */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                    <span className="material-symbols-outlined text-secondary text-[18px]">notification_important</span>
                    <span>Upcoming Reminders</span>
                  </div>
                  <span className="font-code-sm text-[10px] text-secondary bg-surface-container px-2 py-0.5 rounded font-semibold">
                    2 Active
                  </span>
                </div>
                {/* Tdap Alert */}
                <div className="p-2.5 rounded-lg bg-error-container text-on-error-container flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">notification_add</span>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Tdap Booster Overdue Alert</span>
                      <span className="font-code-sm text-[10px] font-bold">HIGH</span>
                    </div>
                    <p className="text-[11px] mt-0.5">
                      Channel: SMS (+1 206-***-8491) & Push. Next: <strong>Tomorrow at 09:00 AM</strong>.
                    </p>
                  </div>
                </div>
                {/* Flu Shot Alert */}
                <div className="p-2.5 rounded-lg bg-surface-container-low flex items-start gap-2 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">forward_to_inbox</span>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Flu Shot Window Closing</span>
                      <span className="font-code-sm text-[10px] text-on-surface-variant font-medium">NORMAL</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Channel: Encrypted Patient Email. Scheduled for <strong>Nov 20, 2024</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab ? onNavigateTab('reminders-and-appointments') : showToast('Notification settings opened.')}
                  className="mt-1 w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary text-xs font-semibold text-center transition-colors"
                >
                  Manage All Notification Channels
                </button>
              </div>

              {/* Clinical Exceptions & Sync */}
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-primary">
                  <span className="material-symbols-outlined text-secondary text-[18px]">clinical_notes</span>
                  <span>Clinical Exceptions & Sync</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Baseline Schedule:</span>
                    <span className="font-code-sm text-xs font-bold text-primary">CDC ACIP Adult 19+</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Contraindications:</span>
                    <span className="text-tertiary-fixed-dim font-code-sm text-[11px] font-bold">None Logged (Immune Competent)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Pregnancy Status:</span>
                    <span className="font-code-sm text-xs text-on-surface">Not Documented</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-on-surface-variant">Travel Risk Profile:</span>
                    <span className="font-code-sm text-xs text-on-surface">Standard Domestic</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] mt-1 border border-outline-variant/20">
                  Need to defer or register a certified medical exemption? Requires physician signed FHIR questionnaire resource.
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Medical exemption requisition request queued.')}
                  className="w-full py-2 px-3 rounded-lg bg-surface-container-high hover:bg-surface-variant text-secondary text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">post_add</span>
                  <span>Submit Medical Exemption Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            MOBILE SHELL VIEW: Vaccine Certificate Details & SMART Pass (Template #4)
           ========================================================================= */
        <div className="flex flex-col w-full gap-4">
          {/* Top Sub-Switcher between Certificate Detail and Mobile Ledger */}
          <div className="bg-surface-container p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileSubView('certificate')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                mobileSubView === 'certificate'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">badge</span>
              <span>Certificate Pass</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileSubView('ledger')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                mobileSubView === 'ledger'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">history_edu</span>
              <span>Ledger (10)</span>
            </button>
          </div>

          {mobileSubView === 'certificate' ? (
            /* Certificate Detail Mode */
            <div className="flex flex-col w-full gap-4">
              {/* Cryptographic Sandbox Demo Pill Banner */}
              <div className="w-full bg-surface-container-high rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-secondary shrink-0 animate-pulse"></span>
                  <span className="font-code-sm text-[10px] text-on-surface-variant truncate tracking-tight uppercase">
                    DEMO DATA • W3C VERIFIABLE CREDENTIAL • SHA-256
                  </span>
                </div>
                <span className="font-code-sm text-[10px] text-secondary bg-surface-container-lowest px-2 py-0.5 rounded shrink-0 font-medium">
                  FHIR R4
                </span>
              </div>

              {/* SMART® Health Card Visual Pass Container */}
              <div className="w-full rounded-2xl bg-primary-container text-on-primary p-4 shadow-xl relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-secondary/20 blur-2xl pointer-events-none"></div>
                <div className="absolute -left-10 -bottom-10 w-36 h-36 rounded-full bg-secondary-container/10 blur-xl pointer-events-none"></div>

                {/* Header Meta */}
                <div className="relative z-10 flex items-start justify-between border-b border-on-primary/10 pb-2.5 mb-2.5">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary-container text-[18px]">verified</span>
                      <span className="font-code-sm text-[11px] text-secondary-container font-semibold tracking-wider uppercase">
                        SMART® HEALTH CARD
                      </span>
                    </div>
                    <p className="font-body-sm text-[11px] text-surface-variant/90 truncate mt-0.5">
                      State Dept of Public Health • Immunization Registry
                    </p>
                  </div>
                  <span className="font-code-sm text-[10px] bg-surface-container-lowest/15 text-on-primary px-2 py-0.5 rounded font-mono">
                    SPEC v1.1.0
                  </span>
                </div>

                {/* Recipient Identity Block */}
                <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <span className="font-code-sm text-[10px] text-on-primary-container tracking-wider block uppercase">
                      Vaccinated Subject
                    </span>
                    <h2 className="text-lg font-bold text-on-primary truncate">{patient.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5 text-surface-variant">
                      <span className="text-xs">DOB: {patient.dob} ({patient.age}Y)</span>
                      <span className="text-surface-variant/40">•</span>
                      <span className="font-code-sm text-xs text-secondary-container">#US-WA-890214-E</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary-container text-[24px]">fingerprint</span>
                  </div>
                </div>

                {/* High-Density Cryptographic QR Code Representation */}
                <div className="relative z-10 bg-surface-container-lowest rounded-xl p-3 flex flex-col items-center justify-center shadow-inner">
                  <div className="w-44 h-44 bg-surface-container-lowest flex items-center justify-center relative p-1">
                    <svg className="w-full h-full text-primary" fill="currentColor" viewBox="0 0 160 160">
                      <rect fill="currentColor" height="44" rx="4" width="44" x="8" y="8"></rect>
                      <rect fill="#FFFFFF" height="32" width="32" x="14" y="14"></rect>
                      <rect fill="currentColor" height="16" width="16" x="22" y="22"></rect>
                      <rect fill="currentColor" height="44" rx="4" width="44" x="108" y="8"></rect>
                      <rect fill="#FFFFFF" height="32" width="32" x="114" y="14"></rect>
                      <rect fill="currentColor" height="16" width="16" x="122" y="22"></rect>
                      <rect fill="currentColor" height="44" rx="4" width="44" x="8" y="108"></rect>
                      <rect fill="#FFFFFF" height="32" width="32" x="14" y="114"></rect>
                      <rect fill="currentColor" height="16" width="16" x="22" y="122"></rect>
                      <rect fill="currentColor" height="24" rx="2" width="24" x="112" y="112"></rect>
                      <rect fill="#FFFFFF" height="12" width="12" x="118" y="118"></rect>
                      <rect fill="currentColor" height="4" width="4" x="122" y="122"></rect>
                      <rect height="6" width="6" x="60" y="12"></rect>
                      <rect height="12" width="6" x="72" y="12"></rect>
                      <rect height="12" width="6" x="84" y="12"></rect>
                      <rect height="6" width="18" x="60" y="24"></rect>
                      <rect height="6" width="6" x="84" y="24"></rect>
                      <rect height="18" width="6" x="96" y="24"></rect>
                      <rect height="18" width="6" x="60" y="36"></rect>
                      <rect height="6" width="18" x="72" y="36"></rect>
                      <rect height="12" width="12" x="60" y="60"></rect>
                      <rect height="18" width="6" x="78" y="60"></rect>
                      <rect height="6" width="24" x="90" y="60"></rect>
                      <rect height="6" width="18" x="24" y="78"></rect>
                      <rect height="12" width="6" x="48" y="72"></rect>
                      <rect height="12" width="18" x="84" y="72"></rect>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest shadow-md flex items-center justify-center p-0.5">
                        <span className="material-symbols-outlined text-secondary text-[20px]">health_and_safety</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-code-sm text-[10px] text-on-surface mt-1.5 text-center truncate w-full">
                    shc:/5676290953101160341029...
                  </p>
                </div>

                {/* Footer */}
                <div className="relative z-10 mt-3 pt-2.5 border-t border-on-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-tertiary-fixed shrink-0"></span>
                      <span className="font-code-sm text-[11px] text-tertiary-fixed truncate font-semibold">
                        RSA-2048 • GENUINE ISSUER SIGNED
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySig}
                      className="font-code-sm text-[10px] text-secondary-container hover:text-on-primary transition-colors tracking-wide shrink-0 font-bold"
                    >
                      {sigCopied ? 'COPIED' : 'COPY SIG'}
                    </button>
                  </div>
                  <p className="font-code-sm text-[10px] text-on-primary-container truncate mt-0.5">
                    SIG: 7a8f9c102b4e89df901aa7134de0491...ecd301
                  </p>
                </div>
              </div>

              {/* Primary Wallet Export Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Saved to Apple Wallet.')}
                  className="h-11 rounded-lg bg-surface-container-lowest text-primary shadow-xs border border-outline-variant/20 flex items-center justify-center gap-1.5 px-2 active:scale-[0.98] transition-transform text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-primary text-[18px]">account_balance_wallet</span>
                  <span className="truncate">Add to Apple Wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Saved to Google Wallet.')}
                  className="h-11 rounded-lg bg-surface-container-lowest text-primary shadow-xs border border-outline-variant/20 flex items-center justify-center gap-1.5 px-2 active:scale-[0.98] transition-transform text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-secondary text-[18px]">wallet</span>
                  <span className="truncate">Add to Google Wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Generating Signed PDF Certificate...')}
                  className="col-span-2 h-11 rounded-lg bg-primary text-on-primary shadow-sm flex items-center justify-center gap-2 px-3 active:scale-[0.99] transition-transform text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download Signed PDF Certificate (HIPAA/HL7)</span>
                </button>
              </div>

              {/* Granular FHIR Immunization Resource Breakdown */}
              <div className="w-full bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">vaccines</span>
                    <h3 className="font-semibold text-xs text-primary">Immunization Event Payload</h3>
                  </div>
                  <span className="font-code-sm text-[10px] px-2 py-0.5 rounded bg-surface-container-low text-primary font-mono">
                    #imm-8842-cov3
                  </span>
                </div>

                <div className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/20">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-code-sm text-[10px] text-secondary font-semibold uppercase">Primary Agent</span>
                      <h4 className="font-bold text-xs text-primary mt-0.5">COVID-19 mRNA, Bivalent</h4>
                      <p className="font-body-sm text-[11px] text-on-surface-variant">Original & Omicron BA.4 / BA.5 sublineage</p>
                    </div>
                    <span className="font-code-sm text-[10px] bg-surface-container-lowest text-secondary px-2 py-0.5 rounded shadow-xs font-semibold shrink-0">
                      Dose 3 of 3
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-surface-container-low text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-on-surface-variant">Administration Timestamp</span>
                    <span className="font-medium text-primary">Oct 12, 2023 • 14:15 PST</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-on-surface-variant">Manufacturer / Brand</span>
                    <span className="font-medium text-primary">ModernaTX (Spikevax Bivalent)</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-on-surface-variant">Coding Taxonomy</span>
                    <span className="font-code-sm text-[10px] text-primary bg-surface-container-low px-1.5 py-0.5 rounded">
                      CVX 311 • NDC 80777-0287-99
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-on-surface-variant">Lot # & Shelf Expiry</span>
                    <div className="text-right">
                      <span className="font-code-sm text-xs font-semibold text-primary">KP9218</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant block">Exp: 06/30/2024</span>
                    </div>
                  </div>
                  <div className="py-2 flex items-start justify-between gap-2">
                    <span className="text-on-surface-variant shrink-0">Facility & Clinician</span>
                    <div className="text-right">
                      <span className="font-medium text-primary block">CVS Pharmacy #4021</span>
                      <span className="font-code-sm text-[10px] text-on-surface-variant">RPh S. Davis • Lic #PH-49210</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Intelligence Card */}
              <div className="w-full bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-outline-variant/20 space-y-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-secondary text-[18px]">calendar_month</span>
                  <h3 className="font-semibold text-xs">Schedule Intelligence & Booster Status</h3>
                </div>
                <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center gap-2 border border-outline-variant/20">
                  <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-primary font-semibold block">Up to Date for 2023-2024 Formulation</span>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">No booster required at current clinical interval.</p>
                  </div>
                </div>
              </div>

              {/* Raw FHIR JSON Payload Accordion */}
              <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/20 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowFhirPayloadAccordion(!showFhirPayloadAccordion)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-secondary text-[18px]">data_object</span>
                    <span className="font-code-sm text-xs text-primary font-semibold truncate">
                      RAW HL7 FHIR JSON RESOURCE
                    </span>
                  </div>
                  <span className={`material-symbols-outlined text-primary text-[20px] transition-transform ${showFhirPayloadAccordion ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {showFhirPayloadAccordion && (
                  <div className="px-3 pb-3 bg-primary-container text-surface-container-lowest">
                    <pre className="font-code-sm text-[11px] p-2.5 rounded-lg bg-primary overflow-x-auto text-secondary-container leading-relaxed border border-white/10">
{`{
  "resourceType": "Immunization",
  "id": "imm-8842-cov3",
  "status": "completed",
  "vaccineCode": {
    "coding": [{
      "system": "http://hl7.org/fhir/sid/cvx",
      "code": "311",
      "display": "COVID-19 mRNA bivalent"
    }]
  },
  "patient": {
    "reference": "Patient/UH-8842-DEMO",
    "display": "Eleanor Vance"
  },
  "occurrenceDateTime": "2023-10-12T14:15:00-07:00",
  "lotNumber": "KP9218",
  "expirationDate": "2024-06-30"
}`}
                    </pre>
                  </div>
                )}
              </div>

              {/* Share Cryptographic Proof Flow Action */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('15-Minute timed cryptographic sharing link copied.');
                }}
                className="w-full h-11 rounded-xl bg-secondary text-on-secondary shadow-sm flex items-center justify-center gap-2 text-xs font-semibold active:scale-[0.99] transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Share Cryptographic Proof via Timed Link</span>
              </button>
            </div>
          ) : (
            /* Mobile Ledger Mode */
            <div className="flex flex-col w-full gap-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-primary">All Recorded Vaccines (10)</span>
                <button
                  type="button"
                  onClick={() => setShowLogModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Log Vaccine</span>
                </button>
              </div>

              <div className="space-y-2">
                {vaccines.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedVaccineForModal(v);
                      setMobileSubView('certificate');
                    }}
                    className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-code-sm text-[9px] uppercase px-1.5 py-0.2 rounded bg-surface-container font-semibold text-secondary">
                          {v.code}
                        </span>
                        {v.type === 'due' && (
                          <span className="font-code-sm text-[9px] px-1.5 py-0.2 rounded bg-error-container text-on-error-container font-bold">
                            OVERDUE
                          </span>
                        )}
                        <span className="font-code-sm text-[10px] text-outline">{v.lastDose || v.dueDate}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-primary truncate">{v.title}</h4>
                      <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                        {v.facility || 'Clinical Provider'} • Lot: {v.lot || 'N/A'}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Vaccine Modal */}
      <LogVaccineModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        patient={patient}
        onSuccess={(vax) => showToast(`${vax} vaccine registered and queued for WA DOH-IIS registry sync.`)}
      />

      {/* Certificate Detail Modal for Desktop */}
      {selectedVaccineForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-primary/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            <header className="px-4 py-3 bg-surface/90 border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                <span className="font-semibold text-sm text-primary">SMART® Health Pass Credential</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVaccineForModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </header>
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="bg-primary text-on-primary rounded-xl p-4 flex flex-col items-center text-center">
                <span className="font-code-sm text-[10px] uppercase tracking-wider text-secondary-fixed font-bold">
                  W3C Verifiable Credential • FHIR R4
                </span>
                <h3 className="font-bold text-base mt-1">{selectedVaccineForModal.title}</h3>
                <p className="font-code-sm text-xs text-secondary-fixed-dim mt-0.5">
                  {selectedVaccineForModal.code} • Lot: {selectedVaccineForModal.lot || 'BOO-99120B'}
                </p>
                <div className="mt-3 p-2 bg-surface-container-lowest rounded-xl">
                  <svg className="w-40 h-40 text-primary" fill="currentColor" viewBox="0 0 160 160">
                    <rect fill="currentColor" height="40" rx="4" width="40" x="10" y="10"></rect>
                    <rect fill="#FFFFFF" height="28" rx="2" width="28" x="16" y="16"></rect>
                    <rect fill="currentColor" height="16" rx="1" width="16" x="22" y="22"></rect>
                    <rect fill="currentColor" height="40" rx="4" width="40" x="110" y="10"></rect>
                    <rect fill="#FFFFFF" height="28" rx="2" width="28" x="116" y="16"></rect>
                    <rect fill="currentColor" height="16" rx="1" width="16" x="122" y="22"></rect>
                    <rect fill="currentColor" height="40" rx="4" width="40" x="10" y="110"></rect>
                    <rect fill="#FFFFFF" height="28" rx="2" width="28" x="16" y="116"></rect>
                    <rect fill="currentColor" height="16" rx="1" width="16" x="22" y="122"></rect>
                    <rect height="6" width="6" x="56" y="14"></rect>
                    <rect height="6" width="10" x="68" y="14"></rect>
                    <rect height="6" width="6" x="84" y="14"></rect>
                    <rect height="6" width="6" x="96" y="14"></rect>
                    <rect fill="#006398" height="16" rx="2" width="16" x="72" y="54"></rect>
                    <rect height="12" width="6" x="110" y="56"></rect>
                    <rect height="8" width="6" x="84" y="116"></rect>
                  </svg>
                </div>
                <p className="font-code-sm text-[10px] text-surface-variant mt-2 font-mono">
                  SIG: 7a8f9c102b4e89df...ecd301
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
                  <span className="font-code-sm text-[10px] text-outline block">Administered Date</span>
                  <span className="font-semibold text-primary">{selectedVaccineForModal.lastDose || selectedVaccineForModal.dueDate || '2024-10-14'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
                  <span className="font-code-sm text-[10px] text-outline block">Administering Facility</span>
                  <span className="font-semibold text-primary truncate block">{selectedVaccineForModal.facility || 'Clinical Center'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCopySig();
                    setSelectedVaccineForModal(null);
                  }}
                  className="flex-1 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs"
                >
                  Copy Cryptographic Token
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVaccineForModal(null)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-primary text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 max-w-sm mx-auto bg-primary text-on-primary p-3 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">verified</span>
          <span className="text-xs flex-1">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
