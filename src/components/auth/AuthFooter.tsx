/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AuthFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white py-4 mt-auto border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="font-semibold text-slate-700">Swasthya Health Wallet</span>
          <span>•</span>
          <span>Ayushman Bharat Digital Mission (ABDM) &amp; DPDP Guidelines Compliant</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Zero-Knowledge Storage
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] text-slate-500">256-Bit Encrypted</span>
        </div>
      </div>
    </footer>
  );
};
