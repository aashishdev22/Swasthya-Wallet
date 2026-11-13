/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Sidebar Navigation
 * Official Slogan: Digital Health Locker for Citizens
 */

import React from 'react';
import { PatientProfile } from '../types/health.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';
import { AvatarBadge } from './AvatarBadge.tsx';

export type NavTab =
  | 'dashboard'
  | 'medical-records'
  | 'prescription-assistant'
  | 'find-medicines'
  | 'medicine-alternatives'
  | 'qr-sharing'
  | 'vaccination-wallet'
  | 'reminders-and-appointments'
  | 'secure-sharing'
  | 'document-verification'
  | 'security-and-audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  patient: PatientProfile;
  onOpenAuthGate?: () => void;
  currentLang?: SupportedLanguage;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  patient,
  onOpenAuthGate,
  currentLang = 'en',
  onLogout,
}) => {
  const t = getTranslation(currentLang);

  const navItems: Array<{ tab: NavTab; label: string; icon: string; badge?: string }> = [
    { tab: 'dashboard', label: t.dashboard, icon: 'space_dashboard' },
    { tab: 'medical-records', label: t.medicalRecords, icon: 'clinical_notes' },
    { tab: 'prescription-assistant', label: 'Prescription Assistant', icon: 'document_scanner', badge: 'AI' },
    { tab: 'find-medicines', label: 'Find Medicines', icon: 'storefront' },
    { tab: 'medicine-alternatives', label: 'Medicine Alternatives', icon: 'swap_horiz' },
    { tab: 'qr-sharing', label: 'QR Health Sharing', icon: 'qr_code_scanner', badge: 'Full' },
    { tab: 'vaccination-wallet', label: t.vaccinationWallet, icon: 'vaccines' },
    { tab: 'reminders-and-appointments', label: t.remindersSchedule, icon: 'calendar_month' },
    { tab: 'secure-sharing', label: t.secureSharing, icon: 'share' },
    { tab: 'document-verification', label: t.documentVerification, icon: 'verified' },
    { tab: 'security-and-audit', label: t.securityAudit, icon: 'security' },
    { tab: 'settings', label: t.settings, icon: 'tune' },
  ];

  return (
    <aside className="fixed left-0 top-8 bottom-0 w-72 bg-slate-50 z-40 hidden lg:flex flex-col justify-between py-4 border-r border-slate-200">
      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Brand Header */}
        <div className="px-5">
          <div className="flex items-center gap-2.5 pb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 tracking-tight leading-tight">
                {t.appName}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold tracking-wide">
                {t.appSubtitle}
              </div>
            </div>
          </div>

          {/* Active Citizen ABHA Card */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className="mt-2.5 w-full text-left p-3 rounded-xl bg-white hover:bg-blue-50/40 shadow-xs border border-slate-200/80 transition-colors cursor-pointer flex items-center gap-2.5"
            title="Manage Profile & Photo"
          >
            <AvatarBadge
              name={patient.name}
              avatarUrl={patient.avatarUrl}
              sizeClass="w-10 h-10"
              textSizeClass="text-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[11px] gap-1">
                <span className="text-slate-500 font-medium">{t.abhaId}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold">
                  {t.verifiedBadge}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-900 mt-0.5 truncate">{patient.name}</div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium truncate">
                {patient.synthMrn} • {patient.bloodType}
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 px-4" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onSelectTab(item.tab)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Vault Footer & Lock Gate Button */}
      <div className="px-4 flex flex-col gap-2 pt-2 border-t border-slate-200/80">
        {onOpenAuthGate && (
          <button
            type="button"
            onClick={onOpenAuthGate}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-300/80 shadow-2xs cursor-pointer"
            title="Lock active session and return to Authentication Gate"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-700">lock</span>
              <span>{t.authGate}</span>
            </div>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        )}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 cursor-pointer"
            title="Securely log out of Swasthya Wallet"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Logout</span>
            </div>
            <span className="text-[11px] text-slate-400">Exit</span>
          </button>
        )}
        <div className="p-2.5 rounded-xl bg-white flex items-center justify-between border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
            <span className="text-[11px] text-slate-800 font-semibold">{t.tamperProof}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Digital India</span>
        </div>
      </div>
    </aside>
  );
};
