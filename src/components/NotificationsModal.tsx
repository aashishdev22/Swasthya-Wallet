/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NotificationItem } from '../types/health.ts';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onClearAll: () => void;
  onMarkAllRead?: () => void;
  currentLang?: SupportedLanguage;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkAllRead,
  currentLang = 'en',
}) => {
  if (!isOpen) return null;
  const t = getTranslation(currentLang);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-800 text-[22px]">notifications</span>
            <h3 className="font-bold text-base text-slate-900">{t.notifications}</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
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
          {notifications.length === 0 ? (
            <div className="py-10 px-4 text-center bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-slate-300">notifications_off</span>
              <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
                Vaccine reminders, record upload confirmations, and doctor sharing alerts will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const formattedDate = (() => {
                try {
                  const d = new Date(notif.createdAt);
                  return isNaN(d.getTime())
                    ? notif.createdAt
                    : d.toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                } catch {
                  return notif.createdAt;
                }
              })();

              const cardStyle =
                notif.type === 'warning'
                  ? 'bg-amber-50/60 border-amber-200/80'
                  : notif.type === 'security'
                  ? 'bg-rose-50/60 border-rose-200/80'
                  : notif.type === 'reminder'
                  ? 'bg-blue-50/60 border-blue-200/80'
                  : 'bg-emerald-50/60 border-emerald-200/80';

              const iconBadgeStyle =
                notif.type === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : notif.type === 'security'
                  ? 'bg-rose-100 text-rose-800'
                  : notif.type === 'reminder'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-emerald-100 text-emerald-800';

              const iconName =
                notif.type === 'warning'
                  ? 'warning'
                  : notif.type === 'security'
                  ? 'shield'
                  : notif.type === 'reminder'
                  ? 'vaccines'
                  : 'verified';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${cardStyle}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBadgeStyle}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{iconName}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight flex items-center gap-1.5">
                        <span>{notif.title}</span>
                        {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0" />}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formattedDate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {onMarkAllRead && unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-semibold text-blue-800 hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {t.clear}
              </button>
            )}
          </div>
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
