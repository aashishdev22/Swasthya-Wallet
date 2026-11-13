/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SupportedLanguage, getTranslation } from '../utils/i18n.ts';

export interface BiometricChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  recordTitle?: string;
  enforceMode?: 'app_unlock' | 'record_view';
  currentLang?: SupportedLanguage;
}

export const BiometricChallengeModal: React.FC<BiometricChallengeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  subtitle,
  recordTitle,
  enforceMode: _enforceMode = 'record_view',
  currentLang = 'en',
}) => {
  const t = getTranslation(currentLang);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'touch_id' | 'face_id' | 'fido_key'>('touch_id');

  useEffect(() => {
    if (isOpen) {
      setPhase('idle');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalTitle = title || t.biometricPromptTitle;
  const modalSubtitle = subtitle || t.biometricPromptSubtitle;

  const handleTriggerSensor = () => {
    setPhase('scanning');
    setErrorMessage(null);

    // Simulate authenticating against FIDO2 / TouchID / FaceID / Windows Hello hardware sensor
    setTimeout(() => {
      setPhase('success');
      setTimeout(() => {
        onSuccess();
      }, 700);
    }, 1000);
  };

  const handleSimulatePassphraseFallback = () => {
    setPhase('scanning');
    setErrorMessage(null);
    setTimeout(() => {
      setPhase('success');
      setTimeout(() => {
        onSuccess();
      }, 700);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative animate-scaleUp">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-900 via-indigo-600 to-emerald-500"></div>

        <div className="p-6 flex flex-col items-center text-center">
          {/* Hardware Sensor Icon */}
          <div className="relative mb-4 mt-2">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                phase === 'scanning'
                  ? 'bg-blue-100 text-blue-900 scale-105 shadow-md'
                  : phase === 'success'
                  ? 'bg-emerald-100 text-emerald-800 ring-4 ring-emerald-300/40'
                  : phase === 'failed'
                  ? 'bg-red-100 text-red-700 ring-4 ring-red-300/40'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {phase === 'scanning' ? (
                <span className="material-symbols-outlined text-[42px] animate-pulse">
                  {authMethod === 'touch_id' ? 'fingerprint' : authMethod === 'face_id' ? 'face' : 'usb'}
                </span>
              ) : phase === 'success' ? (
                <span className="material-symbols-outlined text-[44px]">verified_user</span>
              ) : phase === 'failed' ? (
                <span className="material-symbols-outlined text-[42px]">error</span>
              ) : (
                <span className="material-symbols-outlined text-[42px]">
                  {authMethod === 'touch_id' ? 'fingerprint' : authMethod === 'face_id' ? 'face' : 'usb'}
                </span>
              )}
            </div>

            {/* Scanning pulse ring */}
            {phase === 'scanning' && (
              <span className="absolute inset-0 rounded-full border-2 border-blue-600 animate-ping opacity-60 pointer-events-none"></span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-900 text-[11px] font-bold uppercase tracking-wider mb-2 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>FIDO2 / WebAuthn Biometric Enclave</span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{modalTitle}</h2>

          {recordTitle && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold max-w-full truncate">
              <span className="text-slate-400 font-normal mr-1">Record:</span>
              <span>{recordTitle}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
            {modalSubtitle}
          </p>

          {/* Sensor Method Selector */}
          <div className="grid grid-cols-3 gap-2 w-full mt-4 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              disabled={phase === 'scanning'}
              onClick={() => setAuthMethod('touch_id')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                authMethod === 'touch_id'
                  ? 'bg-white text-blue-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">fingerprint</span>
              <span className="text-[10px]">{t.touchSensor.split(' ')[0]}</span>
            </button>
            <button
              type="button"
              disabled={phase === 'scanning'}
              onClick={() => setAuthMethod('face_id')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                authMethod === 'face_id'
                  ? 'bg-white text-blue-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">face</span>
              <span className="text-[10px]">{t.faceUnlock.split(' ')[0]}</span>
            </button>
            <button
              type="button"
              disabled={phase === 'scanning'}
              onClick={() => setAuthMethod('fido_key')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                authMethod === 'fido_key'
                  ? 'bg-white text-blue-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">usb</span>
              <span className="text-[10px]">{t.securityKey.split(' ')[0]}</span>
            </button>
          </div>

          {/* Status Feedback Message */}
          <div className="w-full mt-4 min-h-[36px] flex items-center justify-center">
            {phase === 'scanning' && (
              <div className="flex items-center gap-2 text-xs text-blue-700 font-semibold animate-pulse">
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Probing Hardware Security Enclave (0x88F)...</span>
              </div>
            )}
            {phase === 'success' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{t.authSuccessToast}</span>
              </div>
            )}
            {phase === 'failed' && (
              <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMessage || 'Verification failed.'}</span>
              </div>
            )}
            {phase === 'idle' && (
              <span className="text-[11px] text-slate-500 font-medium">
                Touch sensor or click below to verify
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              type="button"
              disabled={phase === 'scanning' || phase === 'success'}
              onClick={handleTriggerSensor}
              className="w-full h-11 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {authMethod === 'touch_id' ? 'fingerprint' : authMethod === 'face_id' ? 'face' : 'usb'}
              </span>
              <span>
                {phase === 'scanning'
                  ? 'Verifying...'
                  : phase === 'success'
                  ? 'Verified'
                  : t.scanSensorButton}
              </span>
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleSimulatePassphraseFallback}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">password</span>
                <span>{t.passphraseFallback}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>ABHA DIGITAL ENCLAVE</span>
          <span className="font-bold text-slate-800">AES-256 ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
};
