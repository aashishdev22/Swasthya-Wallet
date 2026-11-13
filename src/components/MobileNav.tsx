/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Mobile Bottom Navigation
 * Official Slogan: Digital Health Locker for Citizens
 */

import React from 'react';
import { NavTab } from './Sidebar.tsx';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentLang?: SupportedLanguage;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab, currentLang = 'en' }) => {
  const t = getTranslation(currentLang);

  const tabs: Array<{ tab: NavTab; label: string; icon: string }> = [
    { tab: 'dashboard', label: 'Home', icon: 'space_dashboard' },
    { tab: 'medical-records', label: 'Records', icon: 'clinical_notes' },
    { tab: 'prescription-assistant', label: 'Rx AI', icon: 'document_scanner' },
    { tab: 'find-medicines', label: 'Medicines', icon: 'storefront' },
    { tab: 'qr-sharing', label: 'Share QR', icon: 'qr_code_scanner' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-md">
      <div className="flex justify-between items-center h-16 px-1 max-w-lg mx-auto">
        {tabs.map((tabItem) => {
          const isActive = currentTab === tabItem.tab;
          return (
            <button
              key={tabItem.tab}
              type="button"
              onClick={() => onSelectTab(tabItem.tab)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg transition-colors min-h-[48px] cursor-pointer ${
                isActive
                  ? 'text-blue-900 bg-blue-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                {tabItem.icon}
              </span>
              <span className="text-[10px] leading-tight truncate max-w-[68px]">
                {tabItem.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
