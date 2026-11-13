/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Citizen Reminders & Appointments Schedule
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import {
  AppointmentItem,
  NotificationPreferences,
  PatientProfile,
  VaccineItem,
} from '../types/health.ts';
import { SupportedLanguage, getTranslation, formatIndianCurrency } from '../utils/i18n.ts';

interface RemindersScheduleViewProps {
  patient: PatientProfile;
  appointments?: AppointmentItem[];
  vaccines?: VaccineItem[];
  onAddAppointment?: (appt: AppointmentItem) => void;
  onToggleAppointmentStatus?: (id: string) => void;
  onDeleteAppointment?: (id: string) => void;
  onUpdateNotificationPrefs?: (prefs: NotificationPreferences) => void;
  isMobileShell?: boolean;
  onOpenLogDose?: () => void;
  currentLang?: SupportedLanguage;
}

export const RemindersScheduleView: React.FC<RemindersScheduleViewProps> = ({
  patient,
  appointments = [],
  vaccines = [],
  onAddAppointment,
  onToggleAppointmentStatus,
  onDeleteAppointment,
  onUpdateNotificationPrefs,
  onOpenLogDose,
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const prefs = patient.notificationPreferences || {
    smsEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
  };
  const [pushEnabled, setPushEnabled] = useState(prefs.pushEnabled);
  const [smsEnabled, setSmsEnabled] = useState(prefs.smsEnabled);
  const [emailEnabled, setEmailEnabled] = useState(prefs.emailEnabled);

  // Add Appointment Inline Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [clinicianOrFacility, setClinicianOrFacility] = useState('');
  const [category, setCategory] = useState<AppointmentItem['category']>('consultation');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [feeInr, setFeeInr] = useState('');
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const dueVaccines = vaccines.filter((v) => v.type === 'due' || v.type === 'seasonal');
  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clinicianOrFacility.trim() || !scheduledDate.trim()) {
      showToast('Please enter visit title, doctor/lab name, and date.');
      return;
    }
    const newAppt: AppointmentItem = {
      id: `appt-${Date.now()}`,
      title: title.trim(),
      clinicianOrFacility: clinicianOrFacility.trim(),
      category,
      scheduledDate: scheduledDate.trim(),
      scheduledTime: scheduledTime.trim() || '10:00 AM',
      feeInr: feeInr.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    };
    if (onAddAppointment) {
      onAddAppointment(newAppt);
    }
    setTitle('');
    setClinicianOrFacility('');
    setScheduledDate('');
    setScheduledTime('');
    setFeeInr('');
    setNotes('');
    setShowAddForm(false);
    showToast(`Scheduled "${newAppt.title}".`);
  };

  const handleSavePreferences = () => {
    if (onUpdateNotificationPrefs) {
      onUpdateNotificationPrefs({
        smsEnabled,
        emailEnabled,
        pushEnabled,
      });
    }
    showToast('Notification channel preferences saved.');
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-slate-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">{t.remindersTitle}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.remindersSubtitle} • Citizen: <strong className="text-slate-700">{patient.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">{showAddForm ? 'close' : 'event_available'}</span>
            <span>{showAddForm ? 'Cancel' : 'Schedule Visit / Lab'}</span>
          </button>
          {onOpenLogDose && (
            <button
              type="button"
              onClick={onOpenLogDose}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">vaccines</span>
              <span>Log Vaccine</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Appointment Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateAppointment}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-xs flex flex-col gap-3"
        >
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-800 text-[18px]">calendar_add_on</span>
            <span>Schedule Doctor Consultation, Lab Test, or Follow-Up</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Visit / Test Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cardiology Follow-up / Fasting Lipid Panel"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Doctor or Diagnostic Center *</label>
              <input
                type="text"
                required
                value={clinicianOrFacility}
                onChange={(e) => setClinicianOrFacility(e.target.value)}
                placeholder="Clinician or hospital name"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AppointmentItem['category'])}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <option value="consultation">Doctor Consultation</option>
                <option value="lab">Lab / Pathology Test</option>
                <option value="vaccination">Vaccination Dose</option>
                <option value="follow_up">Follow-Up Review</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Date *</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Consultation / Test Fee (₹ Optional)</label>
              <input
                type="number"
                min="0"
                value={feeInr}
                onChange={(e) => setFeeInr(e.target.value)}
                placeholder="e.g. 500"
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
            >
              Save Appointment
            </button>
          </div>
        </form>
      )}

      {/* Citizen Contact Summary */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">badge</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 truncate leading-tight">{patient.name}</h2>
              {patient.age > 0 && (
                <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                  {patient.age} {t.years}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {t.abhaId}: {patient.synthMrn} • {patient.phone || 'Mobile not provided'} • {patient.email || 'Email not provided'}
            </p>
          </div>
        </div>
        <span className="text-xs bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
          {upcomingAppointments.length} Upcoming {upcomingAppointments.length === 1 ? 'Visit' : 'Visits'}
        </span>
      </div>

      {/* Section 1: Scheduled Appointments */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-800 text-[20px]">calendar_month</span>
            <span>Scheduled Consultations & Lab Visits ({appointments.length})</span>
          </h3>
        </div>

        {appointments.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-slate-300">event_busy</span>
            <p className="text-xs sm:text-sm font-semibold text-slate-700">No appointments or lab visits scheduled</p>
            <p className="text-[11px] text-slate-500 max-w-md">
              Add upcoming clinic visits, pathology bookings, or medication follow-ups to keep your care calendar organized.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-1 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
            >
              + Schedule First Appointment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{appt.title}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        appt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appt.status === 'cancelled'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {appt.status}
                    </span>
                    {appt.feeInr && Number(appt.feeInr) > 0 && (
                      <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {formatIndianCurrency(Number(appt.feeInr))}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {appt.clinicianOrFacility} • {appt.scheduledDate} at {appt.scheduledTime}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {onToggleAppointmentStatus && appt.status === 'upcoming' && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleAppointmentStatus(appt.id);
                        showToast(`Marked "${appt.title}" as completed.`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer"
                    >
                      Mark Done
                    </button>
                  )}
                  {onDeleteAppointment && (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAppointment(appt.id);
                        showToast(`Deleted "${appt.title}".`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Vaccine Due / Seasonal Alerts Derived From User Ledger */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-800 text-[20px]">notification_important</span>
            <span>Immunization Dose Alerts ({dueVaccines.length})</span>
          </h3>
        </div>

        {dueVaccines.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2 flex-wrap">
            <span>No pending or overdue vaccination alerts in your ledger.</span>
            {onOpenLogDose && (
              <button
                type="button"
                onClick={onOpenLogDose}
                className="text-blue-800 font-semibold hover:underline cursor-pointer"
              >
                + Log a vaccine record
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {dueVaccines.map((vax) => (
              <div
                key={vax.id}
                className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-xs text-amber-950 block">{vax.title}</span>
                  <span className="text-[11px] text-amber-800">
                    {vax.code} • {vax.dueDate ? `Due ${vax.dueDate}` : vax.status}
                  </span>
                </div>
                {onOpenLogDose && (
                  <button
                    type="button"
                    onClick={onOpenLogDose}
                    className="px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-semibold cursor-pointer"
                  >
                    Log Dose
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Notification Channels */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-800 text-[20px]">tune</span>
            <span>Notification Channels</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 block">In-App & Push Reminders</span>
              <span className="text-slate-500">Show appointment and prescription refill reminders inside your locker</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushEnabled}
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                pushEnabled ? 'bg-blue-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  pushEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 block">SMS Reminders</span>
              <span className="text-slate-500">
                Registered mobile: {patient.phone ? patient.phone : 'Not provided (add in Settings)'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={smsEnabled}
              onClick={() => setSmsEnabled(!smsEnabled)}
              className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                smsEnabled ? 'bg-blue-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  smsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 block">Email Summary</span>
              <span className="text-slate-500">
                Registered email: {patient.email ? patient.email : 'Not provided (add in Settings)'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                emailEnabled ? 'bg-blue-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  emailEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSavePreferences}
          className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer"
        >
          Save Notification Preferences
        </button>
      </div>

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
