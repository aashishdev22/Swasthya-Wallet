/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Recipient Health Record Verification Portal (Doctor View)
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState } from 'react';
import { MedicalRecord, PatientProfile } from '../types/health.ts';

interface RecipientVerificationViewProps {
  patientName: string;
  patient?: PatientProfile;
  expectedPin?: string;
  scopeName: string;
  records: MedicalRecord[];
  onClose: () => void;
}

export const RecipientVerificationView: React.FC<RecipientVerificationViewProps> = ({
  patientName,
  patient,
  expectedPin,
  scopeName,
  records,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!expectedPin);
  const [pinError, setPinError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedPin || pinInput === expectedPin) {
      setIsUnlocked(true);
      setPinError(null);
    } else {
      setPinError('Incorrect 4-digit security PIN. Please check the PIN displayed on the patient QR screen.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Recipient Header */}
        <div className="bg-blue-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight">Swasthya Wallet • Clinician Access</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Verified QR
                </span>
              </div>
              <p className="text-xs text-blue-200">Patient-Authorized Ephemeral Health Record Portal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {!isUnlocked ? (
            /* PIN Protection Screen */
            <div className="max-w-md mx-auto text-center py-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Enter Doctor Access PIN</h3>
              <p className="text-xs text-slate-500 mb-6">
                <strong>{patientName}</strong> has protected this digital health locker share with a 4-digit PIN. Please enter the PIN provided by the patient.
              </p>

              <form onSubmit={handleUnlock} className="flex flex-col items-center gap-4">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-40 text-center font-mono text-2xl tracking-[0.5em] py-2.5 px-3 border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  autoFocus
                />

                {pinError && <p className="text-xs text-red-600 font-medium">{pinError}</p>}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Verify PIN & Decrypt Records
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked Read-Only Medical Viewer */
            <div className="flex flex-col gap-5">
              {/* Patient Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{patientName}</span>
                    {patient && (
                      <span className="text-[11px] text-slate-500">
                        {patient.age > 0 ? `• ${patient.age} Y` : ''}
                        {patient.bloodType && patient.bloodType !== 'Not specified' ? ` • ${patient.bloodType}` : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-blue-700 font-medium block">
                    Share Scope: <strong className="uppercase">{scopeName.replace('_', ' ')}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>Temporary Clinician Session</span>
                </div>
              </div>

              {/* Records List */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Authorized Clinical Records ({records.length})
                </h4>

                {records.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                    No records included in this share scope.
                  </div>
                )}

                {records.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl transition-all flex items-center justify-between cursor-pointer hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">
                          {rec.category === 'lab'
                            ? 'biotech'
                            : rec.category === 'imaging'
                            ? 'radiology'
                            : rec.category === 'prescription'
                            ? 'medication'
                            : 'description'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 block truncate max-w-xs sm:max-w-md">
                          {rec.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {rec.clinician} • {rec.date} • {rec.fileFormat}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {rec.fileSize}
                      </span>
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Record Modal Preview if clicked */}
              {selectedRecord && (
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900">{selectedRecord.title}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(null)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Close Details
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 mb-2">
                    <strong>Hospital:</strong> {selectedRecord.hospital} | <strong>Clinician:</strong> {selectedRecord.clinician}
                  </p>
                  {selectedRecord.indication && (
                    <p className="text-xs text-slate-600 mb-1">
                      <strong>Indication:</strong> {selectedRecord.indication}
                    </p>
                  )}
                  {selectedRecord.impression && (
                    <p className="text-xs text-slate-600 mb-1">
                      <strong>Impression:</strong> {selectedRecord.impression}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Cryptographic Digest (SHA-256): {selectedRecord.sha256}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Read-only Clinician Sandbox • Ayushman Bharat Digital Mission (ABDM) Compatible</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};
