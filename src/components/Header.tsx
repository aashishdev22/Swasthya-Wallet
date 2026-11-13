/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { PatientProfile } from '../types/health.ts';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n.ts';
import { syncEngine, SyncStatusInfo } from '../utils/syncEngine.ts';
import { AvatarBadge } from './AvatarBadge.tsx';

interface HeaderProps {
  patient: PatientProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: (mode: 'desktop' | 'mobile') => void;
  onOpenAuthGate?: () => void;
  currentLang?: SupportedLanguage;
  onSelectLang?: (lang: SupportedLanguage) => void;
  onLogout?: () => void;
  onOpenStorageSettings?: () => void;
  onOpenProfileSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  patient,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  unreadCount = 0,
  viewMode,
  onToggleViewMode,
  onOpenAuthGate,
  currentLang = 'en',
  onSelectLang,
  onLogout,
  onOpenStorageSettings,
  onOpenProfileSettings,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(() => syncEngine.getStatus());
  const t = getTranslation(currentLang);

  useEffect(() => {
    return syncEngine.subscribe((info) => {
      setSyncStatus(info);
    });
  }, []);

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    }
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangMenuOpen]);

  return (
    <div className="sticky top-0 z-40 w-full lg:contents">
      {/* Topmost Citizen Trust & National Health Identity Bar */}
      <div className="w-full lg:fixed lg:top-0 lg:left-0 lg:right-0 min-h-8 lg:h-8 py-1 lg:py-0 bg-[#00142f] lg:z-50 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-3 sm:px-6 text-xs select-none border-b border-white/10 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="text-[11px] font-medium tracking-wide text-white leading-snug">
            {currentLang === 'hi'
              ? 'डिजिटल स्वास्थ्य लॉकर • आयुष्मान भारत (ABHA) प्रमाणित'
              : currentLang === 'bn'
              ? 'ডিজিটাল হেলথ লকার • আয়ুষ্মান ভারত (ABHA) যাচাইকৃত'
              : currentLang === 'ta'
              ? 'டிஜிட்டல் சுகாதார லாக்கர் • ஆயுஷ்மான் பாரத் (ABHA)'
              : currentLang === 'te'
              ? 'డిజిటల్ హెల్త్ లాకర్ • ఆయుష్మాన్ భారత్ (ABHA)'
              : 'Digital Health Locker • ABHA Verified Record'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-blue-200 hidden md:inline-block">
            ABHA: {patient.synthMrn}
          </span>
          {onOpenAuthGate && (
            <button
              type="button"
              onClick={onOpenAuthGate}
              className="text-[11px] text-amber-300 hover:text-white font-medium underline cursor-pointer whitespace-nowrap"
            >
              {t.authGate}
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Header Bar */}
      <header className="w-full lg:fixed lg:top-8 lg:left-72 lg:right-0 lg:w-auto lg:h-16 py-2.5 lg:py-0 bg-white/95 backdrop-blur-md lg:z-30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 shadow-xs border-b border-slate-200">
        {/* Full Brand Title & Official Slogan on mobile screens */}
        <div className="flex sm:hidden items-center gap-2.5 min-w-0 w-full">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-base text-slate-900 tracking-tight leading-tight">
              Swasthya Wallet
            </div>
            <div className="text-[11px] font-medium text-blue-700 leading-snug mt-0.5">
              Digital Health Locker for Citizens
            </div>
          </div>
        </div>

        {/* Left Search Bar on Tablet & Desktop */}
        <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md min-w-0">
          <div className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <input
              type="text"
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={t.search}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-700"
                aria-label={t.clear}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0 shrink-0">
          {/* Background Synchronization Status Indicator */}
          <button
            type="button"
            onClick={onOpenStorageSettings}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
              syncStatus.state === 'Synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : syncStatus.state === 'Cloud Syncing'
                ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                : syncStatus.state === 'Sync Pending'
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : syncStatus.state === 'Sync Failed'
                ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title={`Storage Status: ${syncStatus.state}. Click to view Storage & Cloud Backup settings.`}
            aria-label={`Storage Status: ${syncStatus.state}`}
          >
            {syncStatus.state === 'Cloud Syncing' ? (
              <span className="material-symbols-outlined text-[15px] animate-spin text-blue-600">
                sync
              </span>
            ) : syncStatus.state === 'Synced' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ) : syncStatus.state === 'Sync Pending' ? (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            ) : syncStatus.state === 'Sync Failed' ? (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            )}
            <span className="text-[11px] font-medium hidden sm:inline whitespace-nowrap">
              {syncStatus.state}
            </span>
          </button>

          {/* Language Selector Dropdown Button */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              id="language-selector-button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              aria-expanded={isLangMenuOpen}
              aria-label={t.selectLanguage}
              title={t.selectLanguage}
            >
              <span className="text-sm">🌐</span>
              <span className="font-semibold hidden sm:inline">{currentLangObj.nativeName}</span>
              <span className="font-semibold sm:hidden">{currentLangObj.code.toUpperCase()}</span>
              <span className="material-symbols-outlined text-[16px] text-blue-600">
                {isLangMenuOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>

            {/* Language Selection Dropdown Menu */}
            {isLangMenuOpen && (
              <div
                className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-fadeIn"
                role="dialog"
                aria-label={t.selectLanguage}
              >
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span>🌐</span>
                    <span>{t.selectLanguage} (12 Languages)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">All India</span>
                </div>

                <div className="grid grid-cols-2 gap-1 p-1 max-h-80 overflow-y-auto">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = currentLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          if (onSelectLang) {
                            onSelectLang(lang.code);
                          }
                          setIsLangMenuOpen(false);
                        }}
                        className={`flex flex-col text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <span className="text-sm font-semibold leading-tight">
                          {lang.nativeName}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {lang.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Responsive Desktop/Mobile Shell Switcher */}
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => onToggleViewMode('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-white text-blue-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t.desktopView}
            >
              <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
              <span>{t.desktopView}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-white text-blue-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t.mobileView}
            >
              <span className="material-symbols-outlined text-[16px]">smartphone</span>
              <span>{t.mobileView}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notifications Button */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
              aria-label={t.notifications}
              title={t.notifications}
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Patient Profile Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onOpenProfileSettings || onOpenStorageSettings}
                className="flex items-center gap-2 text-left rounded-xl hover:bg-slate-50 px-1.5 py-1 transition-colors cursor-pointer"
                title="Open Citizen Profile & Photo Settings"
              >
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-slate-900 font-bold leading-tight">
                      {patient.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {t.verifiedBadge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {patient.age > 0 ? `${patient.age} ${t.years} • ` : ''}ABHA: {patient.mrn}
                  </div>
                </div>
                <AvatarBadge
                  name={patient.name}
                  avatarUrl={patient.avatarUrl}
                  sizeClass="w-8 h-8"
                  textSizeClass="text-xs"
                  className="ring-2 ring-slate-100"
                />
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Logout from Swasthya Wallet"
                  aria-label="Logout"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
