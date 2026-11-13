/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
  currentLang?: SupportedLanguage;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onClearAll,
  currentLang = 'en',
}) => {
  if (!isOpen) return null;
  const t = getTranslation(currentLang);

  const notifications = [
    {
      id: 'notif-1',
      title: 'Tetanus Toxoid (TT) Booster Due',
      body: 'Adult booster due after 10-year interval. Safdarjung Hospital CVC has walk-in slots available.',
      time: '12m ago',
      type: 'urgent',
      icon: 'vaccines',
    },
    {
      id: 'notif-2',
      title: 'Doctor Consultation Access Authorized',
      body: 'Dr. Rajesh Sharma (Apollo Hospital) accessed your Cardiology records using your secure PIN.',
      time: '2h ago',
      type: 'info',
      icon: 'key',
    },
    {
      id: 'notif-3',
      title: 'AIIMS Central Lab Report Ready',
      body: 'Complete Blood Count & Metabolic Panel verified and sealed with tamper-proof digital signature.',
      time: '1d ago',
      type: 'success',
      icon: 'verified',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-800 text-[22px]">notifications</span>
            <h3 className="font-bold text-base text-slate-900">{t.notifications}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            aria-label={t.close}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                notif.type === 'urgent'
                  ? 'bg-amber-50/60 border-amber-200/80'
                  : notif.type === 'success'
                  ? 'bg-emerald-50/60 border-emerald-200/80'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  notif.type === 'urgent'
                    ? 'bg-amber-100 text-amber-800'
                    : notif.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{notif.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {notif.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {notif.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {t.clear}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer shadow-2xs"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
