/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthHeader, AuthScreenType } from './AuthHeader.tsx';
import { AuthFooter } from './AuthFooter.tsx';
import {
  registerWithSupabasePhoneStart,
  verifySupabasePhoneSignupOtp,
  resendSupabasePhoneSignupOtp,
  getOtpResendCooldown,
  validateOtpCode,
  PendingPhoneRegistration,
  validateDob,
  normalizeMobile,
  validateEmail,
  validatePasswordStrength,
  generateSuggestedUsername,
  UserAccount,
} from '../../utils/auth.ts';
import { SupportedLanguage } from '../../utils/i18n.ts';

interface PatientRegistrationViewProps {
  onSuccessRegister: (userData: UserAccount) => void;
  onNavigate: (screen: AuthScreenType) => void;
  onReturnToPortal: () => void;
  currentLang?: SupportedLanguage;
  onSelectLang?: (lang: SupportedLanguage) => void;
}

export const PatientRegistrationView: React.FC<PatientRegistrationViewProps> = ({
  onSuccessRegister,
  onNavigate,
  onReturnToPortal,
  currentLang = 'en',
  onSelectLang,
}) => {
  // 6 Fields in Exact Order:
  // 1. Full Legal Name
  const [fullName, setFullName] = useState('');
  // 2. Date of Birth (DD/MM/YYYY)
  const [dob, setDob] = useState('');
  // 3. Mobile Number (+91 default, 10 digits)
  const [mobileNumber, setMobileNumber] = useState('');
  // 4. Email Address
  const [email, setEmail] = useState('');
  // 5. Password
  const [password, setPassword] = useState('');
  // 6. Confirm Password
  const [confirmPassword, setConfirmPassword] = useState('');

  // Optional Biometric Passkey enrollment toggle
  const [enrollBiometrics, setEnrollBiometrics] = useState(true);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingOtp, setPendingOtp] = useState<PendingPhoneRegistration | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpStatusNotice, setOtpStatusNotice] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [lastOtpSentAt, setLastOtpSentAt] = useState<number | null>(null);
  const [cooldownTick, setCooldownTick] = useState(0);
  const [verifyAttempts, setVerifyAttempts] = useState(0);
  const [successAccount, setSuccessAccount] = useState<UserAccount | null>(null);
  const [emailLinkNotice, setEmailLinkNotice] = useState<string | null>(null);

  const MAX_VERIFY_ATTEMPTS = 5;
  const MAX_RESENDS = 3;
  const RESEND_COOLDOWN_SEC = 60;

  // Field touch tracking
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Live cooldown ticker for Resend OTP button
  const cooldownState = getOtpResendCooldown(
    resendCount,
    lastOtpSentAt,
    Date.now(),
    MAX_RESENDS,
    RESEND_COOLDOWN_SEC
  );

  useEffect(() => {
    if (!pendingOtp || !lastOtpSentAt) return;
    if (cooldownState.secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingOtp, lastOtpSentAt, cooldownState.secondsRemaining, cooldownTick]);

  // Live password validation
  const passStrength = validatePasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Real-time suggested username preview
  const liveNormalizedMob = normalizeMobile(mobileNumber);
  const suggestedUsername =
    fullName.trim().length >= 2
      ? generateSuggestedUsername(fullName, liveNormalizedMob || undefined)
      : '';

  // Auto slash helper for DD/MM/YYYY
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d/]/g, '');
    if (val.length === 2 && !val.includes('/') && e.target.value.length > dob.length) {
      val = val + '/';
    } else if (val.length === 5 && val.split('/').length === 2 && e.target.value.length > dob.length) {
      val = val + '/';
    }
    if (val.length <= 10) {
      setDob(val);
      if (errorMessage) setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setOtpStatusNotice(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your Full Legal Name as printed on your Aadhaar card.');
      return;
    }

    const dobCheck = validateDob(dob);
    if (!dobCheck.valid) {
      setErrorMessage(dobCheck.error || 'Please enter a valid Date of Birth in DD/MM/YYYY format.');
      return;
    }

    const normMob = normalizeMobile(mobileNumber);
    if (!normMob) {
      setErrorMessage('Please enter a valid Indian 10-digit mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!passStrength.valid) {
      setErrorMessage(`Please satisfy all password security criteria: ${passStrength.errors.join('; ')}`);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerWithSupabasePhoneStart({
        fullName,
        dob,
        mobileNumber,
        email,
        password,
        confirmPassword,
        enrollBiometrics,
      });

      if (!res.success || !res.pending) {
        setErrorMessage(
          res.error || 'Could not dispatch SMS verification OTP. Please check your details and try again.'
        );
        setIsSubmitting(false);
        return;
      }

      setPendingOtp(res.pending);
      setOtpInput('');
      setVerifyAttempts(0);
      setResendCount(0);
      setLastOtpSentAt(Date.now());
      setOtpStatusNotice(`6-digit SMS OTP dispatched to ${res.pending.maskedPhone}.`);
      setIsSubmitting(false);
    } catch {
      setErrorMessage('An unexpected error occurred while sending SMS OTP. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingOtp) return;
    setErrorMessage(null);
    setOtpStatusNotice(null);

    if (verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      setErrorMessage('Maximum OTP verification attempts reached. Please resend a new OTP before retrying.');
      return;
    }

    const otpCheck = validateOtpCode(otpInput);
    if (!otpCheck.valid) {
      setErrorMessage(otpCheck.error || 'Enter the 6-digit SMS OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifySupabasePhoneSignupOtp({
        pending: pendingOtp,
        otpCode: otpCheck.cleaned,
      });

      if (!res.success || !res.user) {
        setVerifyAttempts((prev) => prev + 1);
        setErrorMessage(res.error || 'Invalid or expired 6-digit OTP.');
        setIsVerifyingOtp(false);
        return;
      }

      setEmailLinkNotice(res.emailLinkNotice || null);
      setPendingOtp(null);
      setSuccessAccount(res.user);
      setIsVerifyingOtp(false);
    } catch {
      setVerifyAttempts((prev) => prev + 1);
      setErrorMessage('OTP verification request failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingOtp || isResendingOtp) return;
    const check = getOtpResendCooldown(
      resendCount,
      lastOtpSentAt,
      Date.now(),
      MAX_RESENDS,
      RESEND_COOLDOWN_SEC
    );
    if (check.lockedOut) {
      setErrorMessage('Maximum SMS OTP resend limit reached (3/3). Please wait before creating a new request.');
      return;
    }
    if (!check.canResend) {
      setErrorMessage(`Please wait ${check.secondsRemaining}s before requesting another OTP.`);
      return;
    }

    setErrorMessage(null);
    setOtpStatusNotice(null);
    setIsResendingOtp(true);

    try {
      const res = await resendSupabasePhoneSignupOtp(pendingOtp.e164Phone);
      setIsResendingOtp(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Could not resend SMS OTP.');
        return;
      }
      setResendCount((prev) => prev + 1);
      setLastOtpSentAt(Date.now());
      setVerifyAttempts(0);
      setOtpInput('');
      setOtpStatusNotice(`A fresh 6-digit SMS OTP has been sent to ${pendingOtp.maskedPhone}.`);
    } catch {
      setIsResendingOtp(false);
      setErrorMessage('Unable to resend SMS OTP right now. Please try again shortly.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between selection:bg-blue-100">
      {/* Top Header */}
      <AuthHeader
        currentScreen="register"
        onNavigate={onNavigate}
        onReturnToPortal={onReturnToPortal}
        currentLang={currentLang}
        onSelectLang={onSelectLang}
      />

      {/* Main Container */}
      <main className="w-full py-6 sm:py-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-blue-600 px-6 py-6 sm:px-8 text-white">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Create Swasthya Wallet</h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">
                Digital Health Locker for Citizens
              </p>
            </div>
          </div>

          {/* Step 2: Dedicated Mobile SMS OTP Verification Screen */}
          {pendingOtp && !successAccount ? (
            <form onSubmit={handleVerifyOtpSubmit} className="p-6 sm:p-8 space-y-5 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">sms</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Verify Mobile Number</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Enter the 6-digit SMS verification code sent to{' '}
                    <strong className="font-mono text-slate-900">{pendingOtp.maskedPhone}</strong>
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl p-3.5 flex items-start gap-2.5 animate-fadeIn"
                >
                  <span className="material-symbols-outlined text-[20px] text-red-500 shrink-0">error</span>
                  <div className="font-medium">{errorMessage}</div>
                </div>
              )}

              {otpStatusNotice && !errorMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">
                    mark_chat_read
                  </span>
                  <span>{otpStatusNotice}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-otp-input" className="block text-xs font-semibold text-slate-700">
                    6-Digit Mobile OTP <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Attempts left: {Math.max(0, MAX_VERIFY_ATTEMPTS - verifyAttempts)}/{MAX_VERIFY_ATTEMPTS}
                  </span>
                </div>
                <input
                  id="reg-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="6-digit SMS verification code"
                  maxLength={6}
                  required
                  value={otpInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpInput(digits);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.45em] text-xl font-mono font-bold px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 text-center">
                  Your Swasthya Wallet account is created only after confirming this Supabase SMS OTP.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isVerifyingOtp || verifyAttempts >= MAX_VERIFY_ATTEMPTS || otpInput.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying OTP...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Verify OTP</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResendingOtp || !cooldownState.canResend}
                  className="sm:w-48 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-800 font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isResendingOtp ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin"></span>
                      <span>Sending...</span>
                    </>
                  ) : cooldownState.lockedOut ? (
                    <span>Resend Limit Reached</span>
                  ) : !cooldownState.canResend ? (
                    <span>Resend in {cooldownState.secondsRemaining}s</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      <span>Resend OTP ({MAX_RESENDS - resendCount} left)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPendingOtp(null);
                    setErrorMessage(null);
                    setOtpStatusNotice(null);
                  }}
                  className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Edit Mobile Number / Details</span>
                </button>
                <span className="text-[11px] text-slate-400">Supabase SMS Auth</span>
              </div>
            </form>
          ) : successAccount ? (
            <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Swasthya Wallet Created Successfully!</h2>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Your mobile number (+91 {successAccount.mobileNumber}) is verified and your encrypted health locker is active.
                </p>
              </div>

              {/* Account Credentials Summary Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                  Your Verified Citizen Account
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Full Legal Name:</span>
                    <span className="font-semibold text-slate-800">{successAccount.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Assigned Username:</span>
                    <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 inline-block">
                      {successAccount.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Verified Mobile:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <span>+91 {successAccount.mobileNumber}</span>
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Email Address:</span>
                    <span className="font-semibold text-slate-800">{successAccount.email}</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-blue-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">ABHA Health ID:</span>
                      <span className="font-mono font-semibold text-emerald-700">{successAccount.abhaId}</span>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                      Zero-Knowledge Enclave
                    </span>
                  </div>
                </div>
              </div>

              {emailLinkNotice && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  {emailLinkNotice}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onSuccessRegister(successAccount)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Swasthya Wallet</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Login</span>
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form with Exact 6 Fields in Order */
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3.5 flex items-start gap-2.5 animate-fadeIn">
                  <span className="material-symbols-outlined text-[20px] text-red-500 shrink-0">error</span>
                  <div className="text-xs sm:text-sm font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Aadhaar Information Note */}
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
                <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0 mt-0.5">info</span>
                <div>
                  Enter your name and date of birth exactly as printed on your Aadhaar card for medical record indexing. We do not store your Aadhaar number or claim automated UIDAI verification without authorized integration.
                </div>
              </div>

              {/* Exact 6 Fields in Strict Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Full Legal Name */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700">
                    1. Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onBlur={() => markTouched('fullName')}
                    placeholder="Enter name exactly as on Aadhaar"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Exact full legal name printed on your Aadhaar card
                  </p>
                </div>

                {/* 2. Date of Birth */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-dob" className="block text-xs font-semibold text-slate-700">
                    2. Date of Birth (DD/MM/YYYY) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-dob"
                      type="text"
                      required
                      value={dob}
                      onChange={handleDobChange}
                      onBlur={() => markTouched('dob')}
                      placeholder="DD/MM/YYYY (e.g. 15/08/1992)"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 material-symbols-outlined text-[18px]">
                      calendar_month
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Format: DD/MM/YYYY</p>
                </div>

                {/* 3. Mobile Number */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-mobile" className="block text-xs font-semibold text-slate-700">
                    3. Mobile Number (+91) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-xs font-semibold text-slate-600 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl">
                      +91
                    </span>
                    <input
                      id="reg-mobile"
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onBlur={() => markTouched('mobileNumber')}
                      placeholder="10-digit mobile number"
                      maxLength={14}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">Valid Indian 10 digits starting with 6-9</p>
                </div>

                {/* 4. Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                    4. Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onBlur={() => markTouched('email')}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">For account recovery and health updates</p>
                </div>

                {/* 5. Password */}
                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700">
                      5. Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onBlur={() => markTouched('password')}
                      placeholder="Minimum 12 characters"
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="pt-1.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Strength:</span>
                        <span className={`font-semibold ${passStrength.color}`}>
                          {passStrength.label} ({passStrength.score}/4)
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            passStrength.score >= 1 ? 'bg-orange-500' : 'bg-transparent'
                          }`}
                        ></div>
                        <div
                          className={`h-full rounded-full transition-all ${
                            passStrength.score >= 2 ? 'bg-amber-500' : 'bg-transparent'
                          }`}
                        ></div>
                        <div
                          className={`h-full rounded-full transition-all ${
                            passStrength.score >= 3 ? 'bg-blue-600' : 'bg-transparent'
                          }`}
                        ></div>
                        <div
                          className={`h-full rounded-full transition-all ${
                            passStrength.score >= 4 ? 'bg-emerald-600' : 'bg-transparent'
                          }`}
                        ></div>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <div className={passStrength.checks.minLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                          ✓ Minimum 12 characters
                        </div>
                        <div
                          className={
                            passStrength.checks.hasUpper && passStrength.checks.hasLower
                              ? 'text-emerald-600 font-medium'
                              : 'text-slate-400'
                          }
                        >
                          ✓ Upper &amp; lowercase letters
                        </div>
                        <div className={passStrength.checks.hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                          ✓ At least 1 number (0-9)
                        </div>
                        <div className={passStrength.checks.hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                          ✓ At least 1 special character (!@#$%^&*)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Confirm Password */}
                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-slate-700">
                      6. Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      onBlur={() => markTouched('confirmPassword')}
                      placeholder="Re-enter password"
                      className={`w-full px-3.5 py-2.5 pr-10 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        passwordsMismatch
                          ? 'border-red-400 focus:ring-red-400'
                          : passwordsMatch
                          ? 'border-emerald-400 focus:ring-emerald-400'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Match Status */}
                  {confirmPassword.length > 0 && (
                    <div className="text-[11px] pt-1">
                      {passwordsMatch ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Passwords match perfectly
                        </span>
                      ) : (
                        <span className="text-red-500 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Automatic Username Preview notice */}
              {suggestedUsername && (
                <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">badge</span>
                    <span>Your Swasthya Wallet Username will be:</span>
                  </div>
                  <span className="font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {suggestedUsername}
                  </span>
                </div>
              )}

              {/* Biometric Passkey Enrollment Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={enrollBiometrics}
                    onChange={(e) => setEnrollBiometrics(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">fingerprint</span>
                    <span className="font-medium">Enable Biometric / Fingerprint Unlock for quick sign-in</span>
                  </div>
                </label>
              </div>

              {/* Registration Button: Create Swasthya Wallet */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Creating Swasthya Wallet...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span>Create Swasthya Wallet</span>
                    </>
                  )}
                </button>

                {/* Below the Form: Already have an account? Login */}
                <div className="text-center text-xs text-slate-600 pt-1">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    Login
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
};
