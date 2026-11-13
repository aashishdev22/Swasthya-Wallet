/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PatientProfile } from '../data/mockData.ts';
import { SupportedLanguage, getTranslation, formatIndianDate, formatIndianCurrency } from '../utils/i18n.ts';

interface RemindersScheduleViewProps {
  patient: PatientProfile;
  isMobileShell?: boolean;
  onOpenLogDose?: () => void;
  currentLang?: SupportedLanguage;
}

export const RemindersScheduleView: React.FC<RemindersScheduleViewProps> = ({
  patient,
  isMobileShell = false,
  onOpenLogDose,
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emergencyEnabled, setEmergencyEnabled] = useState(true);
  const [leadNoticeDays, setLeadNoticeDays] = useState<number>(30);
  const [snoozedTdap, setSnoozedTdap] = useState(false);
  const [markedReceivedTdap, setMarkedReceivedTdap] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleDispatchDiagnostic = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      showToast('Diagnostic FHIR notification dispatched to registered endpoints (SMS & Push).');
    }, 1000);
  };

  const handleSavePreferences = () => {
    showToast('Preferences synchronized with cryptographic clinical engine.');
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Indian Health Locker Reminders Banner */}
      <div className="bg-white rounded-2xl p-4 flex items-center justify-between gap-2 shadow-xs border border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <p className="text-xs text-slate-700 font-semibold truncate">
            {t.remindersTitle} • {t.remindersSubtitle}
          </p>
        </div>
        <span className="text-[11px] bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold shrink-0">
          ABHA Connected
        </span>
      </div>

      {/* Patient Context Brief */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">badge</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 truncate leading-tight">
                {patient.name}
              </h2>
              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                {patient.age} {t.years}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {t.abhaId}: {patient.synthMrn} • {patient.bloodType}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            SMS & WhatsApp Active
          </span>
        </div>
      </div>

      {/* Section 1: Active Clinical Dose Alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">notification_important</span>
            <h3 className="font-semibold text-sm text-primary">Actionable Dose Alerts</h3>
          </div>
          <span className="font-code-sm text-[11px] bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-bold">
            {markedReceivedTdap ? '0 OVERDUE' : '1 OVERDUE'}
          </span>
        </div>

        {/* Alert Card 1: Critical Overdue (Tdap) */}
        {!markedReceivedTdap && (
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-error"></div>
            <div className="pl-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-xs text-error font-semibold uppercase tracking-wider">
                      High Clinical Priority
                    </span>
                    <span className="font-code-sm text-[10px] text-on-surface-variant">• CVX 115</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-primary mt-0.5">
                    Tdap Booster Revaccination
                  </h4>
                </div>
                <span className="font-code-sm text-xs text-error bg-error-container px-2 py-0.5 rounded shrink-0 font-bold self-start">
                  {snoozedTdap ? 'Snoozed 7 Days' : '18 Days Late'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">
                Decennial tetanus, diphtheria, and pertussis schedule milestone. Was due{' '}
                <span className="font-semibold text-on-surface">Oct 14, 2024</span>.
              </p>

              {/* Dispatch Telemetry Box */}
              <div className="bg-surface-container-low rounded-lg p-2.5 mb-3 flex flex-col gap-1 border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">phonelink_ring</span>
                  <span className="text-xs text-on-surface font-semibold">Active Channels:</span>
                  <span className="text-xs text-on-surface-variant truncate">Push (Daily, 9:00 AM) + SMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">contact_phone</span>
                  <span className="font-code-sm text-xs text-on-surface-variant">+1 (555) ***-8842</span>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onOpenLogDose}
                  className="w-full h-10 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">event_available</span>
                  <span>Schedule Vaccine Appointment</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSnoozedTdap(!snoozedTdap);
                      showToast(snoozedTdap ? 'Alert active' : 'Tdap alert snoozed for 7 days');
                    }}
                    className="h-9 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">snooze</span>
                    <span>{snoozedTdap ? 'Resume Alert' : 'Snooze 7 Days'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMarkedReceivedTdap(true);
                      showToast('Tdap marked as received. Logging certificate...');
                      if (onOpenLogDose) onOpenLogDose();
                    }}
                    className="h-9 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    <span>Already Received</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Card 2: Upcoming Window (Influenza) */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-secondary-container"></div>
          <div className="pl-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-xs text-secondary font-semibold uppercase tracking-wider">
                    Optimal Window Open
                  </span>
                  <span className="font-code-sm text-[10px] text-on-surface-variant">• CVX 141</span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-primary mt-0.5">
                  Annual Influenza (Flu) 2024–2025
                </h4>
              </div>
              <span className="font-code-sm text-xs text-on-secondary-container bg-secondary-fixed px-2 py-0.5 rounded shrink-0 font-semibold self-start">
                Standard Season
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mb-3">
              Target Window: <strong className="text-on-surface">Oct 1 – Dec 15, 2024</strong> (Peak antibody efficacy before January surge).
            </p>

            {/* Scheduled Notice Box */}
            <div className="bg-surface-container-low rounded-lg p-2.5 mb-3 flex items-center justify-between border border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">alarm</span>
                <div>
                  <p className="text-xs text-on-surface font-semibold">Next Reminder Scheduled</p>
                  <p className="font-code-sm text-[11px] text-on-surface-variant">Nov 15, 2024 at 10:00 AM</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline text-[18px]">edit_calendar</span>
            </div>

            {/* Action CTAs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => showToast('Opening in-network pharmacy locator (Walgreens/CVS/Kaiser)...')}
                className="h-9 bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">local_pharmacy</span>
                <span>Find Pharmacy</span>
              </button>
              <button
                type="button"
                onClick={() => showToast('Cadence editor: Reminder interval set to bi-weekly.')}
                className="h-9 bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span>Edit Cadence</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Accent Section: Smart Lead Optimization */}
      <div className="bg-primary text-on-primary rounded-xl p-4 relative overflow-hidden shadow-md">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="material-symbols-outlined text-secondary-container text-[18px]">insights</span>
            <span className="font-label-md text-xs tracking-wider uppercase text-secondary-container font-semibold">
              Engine Metric
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-on-primary">94.8% Adherence Rate</p>
          <p className="text-xs text-on-primary-container mt-1 max-w-lg leading-relaxed">
            Proactive notifications with a 30-day warning window minimize vaccine delays by over 4.2 weeks across adult populations.
          </p>
        </div>
        {/* Background Ambient SVG Accent */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 pointer-events-none">
          <svg fill="none" height="120" viewBox="0 0 180 120" width="180">
            <path d="M10 110 C 40 90, 70 100, 100 40 C 130 -10, 150 30, 175 15" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></path>
            <circle cx="100" cy="40" fill="currentColor" r="10"></circle>
            <circle cx="175" cy="15" fill="currentColor" r="8"></circle>
          </svg>
        </div>
      </div>

      {/* Section 2: Notification Channels & Routing Config */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
            <h3 className="font-semibold text-sm text-primary">Channel Routing & Cadence</h3>
          </div>
          <span className="font-code-sm text-xs text-on-surface-variant">4 Rules Configured</span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 divide-y divide-surface-container">
          {/* Toggle: Push Notifications */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-start gap-2.5 pr-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-primary">Mobile Push Alerts</h4>
                <p className="font-body-sm text-[11px] text-on-surface-variant">Real-time alerts directly on this validated clinical terminal.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Push Alerts"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-11 h-6 rounded-full relative p-0.5 shrink-0 transition-colors ${
                pushEnabled ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-surface-container-lowest transform transition-transform ${
                  pushEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Toggle: SMS Gateway */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-start gap-2.5 pr-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[18px]">sms</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-primary">SMS Direct Dispatch</h4>
                  <span className="font-code-sm text-[9px] text-secondary bg-secondary-fixed px-1 py-0.2 rounded font-semibold">
                    Verified
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant">+1 (555) ***-8842 • Carrier Rate Standard</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle SMS Alerts"
              onClick={() => setSmsEnabled(!smsEnabled)}
              className={`w-11 h-6 rounded-full relative p-0.5 shrink-0 transition-colors ${
                smsEnabled ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-surface-container-lowest transform transition-transform ${
                  smsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Toggle: Email Digest */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-start gap-2.5 pr-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-primary">
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-primary">Weekly Immunization Digest</h4>
                <p className="font-body-sm text-[11px] text-on-surface-variant truncate">e.vance@example.org (HIPAA Enforced PDF Link)</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Email Digest"
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`w-11 h-6 rounded-full relative p-0.5 shrink-0 transition-colors ${
                emailEnabled ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-surface-container-lowest transform transition-transform ${
                  emailEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Lead Time Segmented Selector */}
          <div className="p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-primary">Reminder Lead Notice</span>
              <span className="font-code-sm text-xs text-secondary font-semibold">{leadNoticeDays} Days Prior</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mb-2">
              Set how far in advance alerts begin before a recommended due date window closes.
            </p>
            <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-lg">
              {[14, 30, 60].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setLeadNoticeDays(days)}
                  className={`py-1.5 rounded text-xs font-semibold text-center transition-all ${
                    leadNoticeDays === days
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Booster Advisory Toggle */}
          <div className="p-3.5 flex items-center justify-between bg-error-container/20">
            <div className="flex items-start gap-2.5 pr-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-error-container flex items-center justify-center shrink-0 text-error">
                <span className="material-symbols-outlined text-[18px]">crisis_alert</span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-error">Regional Outbreak & Travel Directives</h4>
                <p className="font-body-sm text-[11px] text-on-surface-variant">Immediate CDC/WHO overrides for emergency booster alerts.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Toggle Outbreak Alerts"
              onClick={() => setEmergencyEnabled(!emergencyEnabled)}
              className={`w-11 h-6 rounded-full relative p-0.5 shrink-0 transition-colors ${
                emergencyEnabled ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-surface-container-lowest transform transition-transform ${
                  emergencyEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Schedule Logic & Intelligent Tracking Profile */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
            <h3 className="font-semibold text-sm text-primary">Intelligent Schedule Engine</h3>
          </div>
          <span className="font-code-sm text-[10px] text-on-tertiary-container bg-tertiary-fixed px-1.5 py-0.5 rounded font-bold">
            ACTIVE
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm border border-outline-variant/20 flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">verified</span>
            <div>
              <h4 className="text-xs font-semibold text-primary">CDC ACIP Adult Schedule</h4>
              <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                Calibrated for Female, Age 35 (Interval 19–49 Years cohort).
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between border border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]">rule</span>
              <span className="text-xs font-semibold text-primary">Automated Gap Detection</span>
            </div>
            <span className="font-code-sm text-xs text-on-surface font-semibold">Active (FHIR-Sync)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-surface-container">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">child_friendly</span>
                Pregnancy Protocol
              </span>
              <span className="font-code-sm text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                Not Active
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-surface-container">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">flight_takeoff</span>
                Travel Vector Profile
              </span>
              <span className="font-code-sm text-xs text-secondary font-semibold">East Asia (Hep A / Typhoid)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">gavel</span>
                Physician Exemptions
              </span>
              <span className="font-code-sm text-xs text-on-surface-variant">0 Active Overrides</span>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-lg p-2.5 flex items-start gap-2">
            <span className="material-symbols-outlined text-outline text-[16px] shrink-0 mt-0.5">info</span>
            <p className="font-code-sm text-[10px] text-on-surface-variant leading-tight">
              Alert triggers stem from simulated clinical parameters. Records do not supersede personalized diagnostic counsel by a licensed clinician.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Dispatch Audit Telemetry History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">history_toggle_off</span>
            <h3 className="font-semibold text-sm text-primary">Dispatch Audit Trail</h3>
          </div>
          <span className="font-code-sm text-xs text-on-surface-variant">SHA-256 Signed</span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm border border-outline-variant/20 flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5 pb-2 border-b border-surface-container">
            <div className="w-7 h-7 rounded bg-error-container text-error flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">notifications_active</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary truncate">Tdap Overdue Alert</span>
                <span className="font-code-sm text-[9px] text-on-tertiary-container bg-tertiary-fixed px-1.5 py-0.2 rounded font-bold">
                  Delivered
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant">Push payload dispatched to iOS Device (UDID-94A)</p>
              <p className="font-code-sm text-[10px] text-outline mt-0.5">Oct 28, 2024 • 09:00:12 AM EST</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pb-2 border-b border-surface-container">
            <div className="w-7 h-7 rounded bg-surface-container text-secondary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">sms</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary truncate">Tdap Schedule Due Notice</span>
                <span className="font-code-sm text-[9px] text-on-tertiary-container bg-tertiary-fixed px-1.5 py-0.2 rounded font-bold">
                  Delivered
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant">SMS Gateway ACK: +1 (555) ***-8842</p>
              <p className="font-code-sm text-[10px] text-outline mt-0.5">Oct 14, 2024 • 08:30:44 AM EST</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded bg-surface-container text-primary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">mail</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary truncate">Flu Window Announcement</span>
                <span className="font-code-sm text-[9px] text-secondary bg-secondary-fixed px-1.5 py-0.2 rounded font-bold">
                  Opened
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant">Annual immunization cohort guidance bulletin</p>
              <p className="font-code-sm text-[10px] text-outline mt-0.5">Oct 01, 2024 • 10:00:03 AM EST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleSavePreferences}
          className="w-full h-11 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>Save Notification Preferences</span>
        </button>
        <button
          type="button"
          onClick={handleDispatchDiagnostic}
          disabled={isDispatching}
          className="w-full h-10 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {isDispatching ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              <span>Dispatching FHIR Payload...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Dispatch Diagnostic Test Notification</span>
            </>
          )}
        </button>
        <p className="font-code-sm text-[10px] text-on-surface-variant text-center mt-0.5">
          CONFIGURATION CHECKSUM: 8F2A-E41B-998C-D14A
        </p>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 max-w-sm mx-auto bg-primary text-on-primary p-3 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">verified</span>
          <span className="text-xs flex-1">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
