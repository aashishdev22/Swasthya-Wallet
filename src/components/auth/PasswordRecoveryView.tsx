/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthHeader, AuthScreenType } from './AuthHeader.tsx';
import { AuthFooter } from './AuthFooter.tsx';
import {
  detectIdentifierType,
  requestPasswordReset,
  verifyResetTokenOrOtp,
  completePasswordReset,
  validatePasswordStrength,
  sendSupabasePasswordResetEmail,
  requestSupabaseMobileRecoveryOtp,
  verifySupabaseMobileRecoveryOtp,
  completeSupabaseRecoveredPasswordUpdate,
  getOtpResendCooldown,
  validateOtpCode,
} from '../../utils/auth.ts';
import { isSupabaseConfigured } from '../../utils/supabase.ts';
import { SupportedLanguage } from '../../utils/i18n.ts';

interface PasswordRecoveryViewProps {
  onNavigate: (screen: AuthScreenType) => void;
  onReturnToPortal: () => void;
  currentLang?: SupportedLanguage;
  onSelectLang?: (lang: SupportedLanguage) => void;
  initialResetStep?: boolean;
}

export const PasswordRecoveryView: React.FC<PasswordRecoveryViewProps> = ({
  onNavigate,
  onReturnToPortal,
  currentLang = 'en',
  onSelectLang,
  initialResetStep = false,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<
    'input_identifier' | 'enter_otp' | 'reset_password' | 'success'
  >(initialResetStep ? 'reset_password' : 'input_identifier');
  const [recoveryChannel, setRecoveryChannel] = useState<'supabase_phone' | 'local'>('local');
  const [e164Phone, setE164Phone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [contactMasked, setContactMasked] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [vaultNote, setVaultNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastOtpSentAt, setLastOtpSentAt] = useState<number | null>(null);
  const [cooldownTick, setCooldownTick] = useState(0);
  const [verifyAttempts, setVerifyAttempts] = useState(0);

  const MAX_VERIFY_ATTEMPTS = 5;
  const MAX_RESENDS = 3;
  const RESEND_COOLDOWN_SEC = 60;

  const detected = detectIdentifierType(identifier);
  const passStrength = validatePasswordStrength(newPassword);

  const cooldownState = getOtpResendCooldown(
    resendCount,
    lastOtpSentAt,
    Date.now(),
    MAX_RESENDS,
    RESEND_COOLDOWN_SEC
  );

  useEffect(() => {
    if (step !== 'enter_otp' || recoveryChannel !== 'supabase_phone' || !lastOtpSentAt) return;
    if (cooldownState.secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, recoveryChannel, lastOtpSentAt, cooldownState.secondsRemaining, cooldownTick]);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your mobile number, email address, or username.');
      return;
    }

    setIsLoading(true);

    if (isSupabaseConfigured()) {
      if (detected === 'mobile') {
        const otpRes = await requestSupabaseMobileRecoveryOtp(identifier.trim());
        setIsLoading(false);
        if (!otpRes.success || !otpRes.e164Phone) {
          setErrorMessage(otpRes.error || 'Could not send mobile recovery OTP.');
          return;
        }
        setRecoveryChannel('supabase_phone');
        setE164Phone(otpRes.e164Phone);
        setContactMasked(otpRes.maskedPhone || identifier.trim());
        setOtpCode('');
        setVerifyAttempts(0);
        setResendCount(0);
        setLastOtpSentAt(Date.now());
        setStep('enter_otp');
        return;
      }

      if (detected === 'email') {
        const sbRes = await sendSupabasePasswordResetEmail(identifier.trim());
        setIsLoading(false);
        if (!sbRes.success) {
          setErrorMessage(sbRes.error || 'Could not send password reset email.');
          return;
        }
        setVaultNote(
          'Password reset link dispatched via Supabase Auth. Follow the link in your inbox; your encrypted health vault keys remain intact.'
        );
        setStep('success');
        return;
      }

      setIsLoading(false);
      setErrorMessage(
        'Enter your registered +91 mobile number (for SMS OTP recovery) or email address (for reset link).'
      );
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      const res = requestPasswordReset(identifier.trim());
      setRecoveryChannel('local');
      if (res.previewOtp) {
        setOtpCode(res.previewOtp);
      }
      if (res.token) {
        setActiveToken(res.token);
      }
      setContactMasked(res.contactMasked || identifier.trim());
      setStep('enter_otp');
    }, 350);
  };

  // Step 3: Verify single-use OTP / Token
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (recoveryChannel === 'supabase_phone') {
      if (verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
        setErrorMessage('Maximum OTP verification attempts reached. Please resend a new OTP.');
        return;
      }
      const otpCheck = validateOtpCode(otpCode);
      if (!otpCheck.valid) {
        setErrorMessage(otpCheck.error || 'Please enter the 6-digit SMS verification code.');
        return;
      }
      setIsLoading(true);
      const verifyResult = await verifySupabaseMobileRecoveryOtp(e164Phone, otpCheck.cleaned);
      setIsLoading(false);
      if (!verifyResult.success) {
        setVerifyAttempts((prev) => prev + 1);
        setErrorMessage(verifyResult.error || 'Invalid or expired verification code.');
        return;
      }
      setStep('reset_password');
      return;
    }

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your registered contact.');
      return;
    }

    const verifyResult = verifyResetTokenOrOtp(identifier, otpCode.trim());
    if (!verifyResult.success) {
      setErrorMessage(verifyResult.error || 'Invalid or expired verification code.');
      return;
    }

    setActiveToken(verifyResult.token || activeToken);
    setStep('reset_password');
  };

  const handleResendRecoveryOtp = async () => {
    if (recoveryChannel !== 'supabase_phone' || !e164Phone || isResendingOtp) return;
    const check = getOtpResendCooldown(
      resendCount,
      lastOtpSentAt,
      Date.now(),
      MAX_RESENDS,
      RESEND_COOLDOWN_SEC
    );
    if (check.lockedOut) {
      setErrorMessage('Maximum OTP resend limit reached (3/3). Please try again later.');
      return;
    }
    if (!check.canResend) {
      setErrorMessage(`Please wait ${check.secondsRemaining}s before requesting another OTP.`);
      return;
    }

    setErrorMessage(null);
    setIsResendingOtp(true);
    const res = await requestSupabaseMobileRecoveryOtp(e164Phone);
    setIsResendingOtp(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Could not resend recovery SMS OTP.');
      return;
    }
    setResendCount((prev) => prev + 1);
    setLastOtpSentAt(Date.now());
    setVerifyAttempts(0);
    setOtpCode('');
  };

  // Step 4 & 5: Save New Password & Invalidate Single-use Token
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!passStrength.valid) {
      setErrorMessage(`New password does not meet criteria: ${passStrength.errors.join('; ')}`);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured() && (recoveryChannel === 'supabase_phone' || initialResetStep)) {
        const res = await completeSupabaseRecoveredPasswordUpdate(newPassword);
        setIsLoading(false);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update password.');
          return;
        }
        setVaultNote(
          'Password updated in Supabase Auth. Encrypted health records and zero-knowledge vault keys remain preserved.'
        );
        setStep('success');
        return;
      }

      const res = await completePasswordReset(
        identifier,
        activeToken || otpCode.trim(),
        newPassword
      );
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password.');
        return;
      }

      setVaultNote(res.vaultRecoveryNote || null);
      setStep('success');
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between selection:bg-blue-100">
      {/* Top Header */}
      <AuthHeader
        currentScreen="recovery"
        onNavigate={onNavigate}
        onReturnToPortal={onReturnToPortal}
        currentLang={currentLang}
        onSelectLang={onSelectLang}
      />

      {/* Main Container */}
      <main className="w-full py-6 sm:py-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-blue-600 px-6 py-6 text-white text-center">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <span className="material-symbols-outlined text-[28px]">lock_reset</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Account Recovery</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Reset your Swasthya Wallet password securely
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl p-3 flex items-start gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">error</span>
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Zero-Knowledge Vault Notice */}
            <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-600">
              <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0 mt-0.5">shield</span>
              <div>
                <strong>Zero-Knowledge Protection:</strong> Password recovery resets account authentication while preserving your client-side medical vault keys and zero-knowledge enclave.
              </div>
            </div>

            {/* Step 1: Input Identifier */}
            {step === 'input_identifier' && (
              <form onSubmit={handleIdentifierSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="recovery-identity" className="block text-xs font-semibold text-slate-700">
                      Mobile Number (+91) / Email ID <span className="text-red-500">*</span>
                    </label>
                    {identifier.trim().length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                        {detected === 'mobile' ? 'Mobile OTP' : detected === 'email' ? 'Email Link' : 'Username'}
                      </span>
                    )}
                  </div>
                  <input
                    id="recovery-identity"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter 10-digit mobile number or email"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Enter your +91 mobile number for a 6-digit SMS OTP, or your registered email for a recovery link.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="w-full text-center text-xs text-slate-600 hover:text-slate-900 font-semibold py-1 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {step === 'enter_otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                  Verification code sent to <strong>{contactMasked}</strong>.
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="recovery-otp" className="block text-xs font-semibold text-slate-700">
                      6-Digit Verification Code (OTP)
                    </label>
                    {recoveryChannel === 'supabase_phone' && (
                      <span className="text-[11px] text-slate-500">
                        Attempts left: {Math.max(0, MAX_VERIFY_ATTEMPTS - verifyAttempts)}/{MAX_VERIFY_ATTEMPTS}
                      </span>
                    )}
                  </div>
                  <input
                    id="recovery-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 text-center">
                    Single-use security token • Rate limited
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={isLoading || (recoveryChannel === 'supabase_phone' && verifyAttempts >= MAX_VERIFY_ATTEMPTS)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? 'Verifying OTP...' : 'Verify & Continue'}
                  </button>

                  {recoveryChannel === 'supabase_phone' && (
                    <button
                      type="button"
                      onClick={handleResendRecoveryOtp}
                      disabled={isResendingOtp || !cooldownState.canResend}
                      className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-800 font-semibold py-2 px-4 rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
                    >
                      {isResendingOtp
                        ? 'Resending OTP...'
                        : cooldownState.lockedOut
                        ? 'Resend Limit Reached'
                        : !cooldownState.canResend
                        ? `Resend OTP in ${cooldownState.secondsRemaining}s`
                        : `Resend OTP (${MAX_RESENDS - resendCount} left)`}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStep('input_identifier')}
                    className="w-full text-center text-xs text-slate-600 hover:text-slate-900 font-medium py-1 cursor-pointer"
                  >
                    Change Account Identifier
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {step === 'reset_password' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="new-pass" className="block text-xs font-semibold text-slate-700">
                      New Password (min 12 characters) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-blue-600 font-medium cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="new-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {newPassword.length > 0 && (
                    <div className="text-[11px]">
                      Strength:{' '}
                      <span className={`font-semibold ${passStrength.color}`}>
                        {passStrength.label} ({passStrength.score}/4)
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-new-pass" className="block text-xs font-semibold text-slate-700">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirm-new-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success & Step 6: Redirect to Login */}
            {step === 'success' && (
              <div className="text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Password Reset Complete!</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Your Swasthya Wallet password has been securely updated. The reset token has been invalidated and all active sessions revoked.
                  </p>
                </div>
                {vaultNote && (
                  <div className="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 p-2.5 rounded-lg text-left">
                    ✓ {vaultNote}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs cursor-pointer"
                >
                  Proceed to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
};
