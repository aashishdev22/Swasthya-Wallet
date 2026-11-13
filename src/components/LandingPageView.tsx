/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n.ts';

interface LandingPageViewProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
  onDemoLogin?: () => void;
  currentLang: SupportedLanguage;
  onSelectLang: (lang: SupportedLanguage) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onGoToLogin,
  onGoToRegister,
  currentLang,
  onSelectLang,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const _t = getTranslation(currentLang);
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

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
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-100">
      {/* Top Header */}
      <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-2 sm:min-h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          {/* Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Swasthya Wallet
              </div>
              <div className="text-[11px] sm:text-xs text-blue-700 font-medium leading-snug mt-0.5">
                Digital Health Locker for Citizens
              </div>
            </div>
          </div>

          {/* Right Controls: Language Selector & Actions */}
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0 shrink-0">
            {/* 12 Indian Languages Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                aria-label="Select Language"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">{currentLangObj.nativeName}</span>
                <span className="sm:hidden">{currentLangObj.code.toUpperCase()}</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_drop_down</span>
              </button>

              {isLangMenuOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fadeIn">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Indian Languages (12)
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onSelectLang(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
                          currentLang === lang.code ? 'bg-blue-50/80 font-bold text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="font-medium mr-1.5">{lang.nativeName}</span>
                          <span className="text-[11px] text-slate-400">({lang.name})</span>
                        </div>
                        {currentLang === lang.code && (
                          <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={onGoToLogin}
                className="px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Login
              </button>
              <button
                type="button"
                onClick={onGoToRegister}
                className="px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
              >
                Create Your Wallet
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center justify-center text-center">
        {/* Brand Icon Shield */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600/10 border border-blue-200 text-blue-600 flex items-center justify-center mb-6 shadow-xs">
          <span className="material-symbols-outlined text-[38px] sm:text-[44px]">health_and_safety</span>
        </div>

        {/* Official Tagline Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Digital Health Locker for Citizens</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Your Health, Securely in Your Hands.
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          One secure place for managing your personal health records.
        </p>

        {/* Two Primary Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full sm:w-auto min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl text-sm sm:text-base transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span>Login</span>
          </button>

          <button
            type="button"
            onClick={onGoToRegister}
            className="w-full sm:w-auto min-w-[200px] bg-white hover:bg-slate-50 text-blue-700 font-semibold py-3 px-6 rounded-xl text-sm sm:text-base border border-blue-200 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Create Your Wallet</span>
          </button>
        </div>

        {/* Citizen Data Sovereignty Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
          <span>Every locker starts private and stores only your authenticated citizen health records.</span>
        </div>

        {/* 4 Feature Pillars (Minimal, Clean White Background with Blue Accents) */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[22px]">lock</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">Zero-Knowledge Vault</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Client-side AES-256 encryption ensures only you and your authorized clinicians hold keys to your health reports.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">ABHA &amp; CoWIN Ready</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Consolidate blood tests, prescriptions, radiological scans, and universal vaccination certificates in one locker.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[22px]">translate</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">12 Indian Languages</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Designed for every Indian citizen, working professionals, students, and senior citizens with clear local terminology.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-blue-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900">Doctor QR Sharing</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Generate ephemeral, PIN-protected QR codes to let visiting doctors verify diagnostic records securely in seconds.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-50 py-5 border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Swasthya Wallet</span>
            <span>•</span>
            <span>Digital Health Locker for Citizens</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>DPDP Act 2023 Compliant</span>
            <span>•</span>
            <span>Ayushman Bharat Digital Mission (ABDM)</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">256-Bit Encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
