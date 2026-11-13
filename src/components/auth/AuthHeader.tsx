/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../../utils/i18n.ts';

export type AuthScreenType = 'landing' | 'login' | 'register' | 'recovery';

interface AuthHeaderProps {
  currentScreen: AuthScreenType;
  onNavigate: (screen: AuthScreenType) => void;
  onReturnToPortal: () => void;
  currentLang?: SupportedLanguage;
  onSelectLang?: (lang: SupportedLanguage) => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  currentScreen,
  onNavigate,
  onReturnToPortal,
  currentLang = 'en',
  onSelectLang,
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangOpen]);

  return (
    <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-2 sm:min-h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer min-w-0"
            title="Swasthya Wallet Home"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Swasthya Wallet
              </span>
              <span className="text-[11px] sm:text-xs text-blue-700 font-medium leading-snug mt-0.5">
                Digital Health Locker for Citizens
              </span>
            </div>
          </button>
        </div>

        {/* Navigation & Controls */}
        <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-3 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0 shrink-0">
          {/* Language Selector */}
          {onSelectLang && (
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                aria-label="Change Language"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">{currentLangObj.nativeName}</span>
                <span className="sm:hidden">{currentLangObj.code.toUpperCase()}</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_drop_down</span>
              </button>

              {isLangOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-60 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-fadeIn">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Indian Languages (12)
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onSelectLang(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
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
          )}

          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  currentScreen === 'login'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  currentScreen === 'register'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Register
              </button>
            </nav>

            <div className="flex items-center pl-1.5 sm:pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={onReturnToPortal}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 cursor-pointer whitespace-nowrap"
                title="Return to Health Locker"
              >
                <span>Explore Locker</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
