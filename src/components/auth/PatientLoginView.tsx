/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthHeader, AuthScreenType } from './AuthHeader.tsx';
import { AuthFooter } from './AuthFooter.tsx';
import {
  detectIdentifierType,
  getRateLimitState,
  IdentifierType,
  UserAccount,
  authenticateWithBiometrics,
  loginWithSupabaseOrLocal,
  signInWithGoogleSupabase,
} from '../../utils/auth.ts';
import { isSupabaseConfigured } from '../../utils/supabase.ts';
import { linkGoogleSignInIdentity } from '../../utils/googleDrive.ts';
import { SupportedLanguage } from '../../utils/i18n.ts';

interface PatientLoginViewProps {
  onSuccessLogin: (targetUser?: string, userAccount?: UserAccount) => void;
  onNavigate: (screen: AuthScreenType) => void;
  onReturnToPortal: () => void;
  currentLang?: SupportedLanguage;
  onSelectLang?: (lang: SupportedLanguage) => void;
}

export const PatientLoginView: React.FC<PatientLoginViewProps> = ({
  onSuccessLogin,
  onNavigate,
  onReturnToPortal,
  currentLang = 'en',
  onSelectLang,
}) => {
  // Single Unified Identity Field: Username, Mobile, or Email (starts empty)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Real-time detection of entered identifier type
  const detectedType: IdentifierType = detectIdentifierType(identifier);

  // Check rate limit lockout on identifier change
  useEffect(() => {
    if (identifier.trim()) {
      const state = getRateLimitState(identifier.trim().toLowerCase());
      if (state.isLocked) {
        setLockoutSeconds(state.secondsRemaining);
      } else {
        setLockoutSeconds(0);
      }
    }
  }, [identifier]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (lockoutSeconds > 0) {
      setErrorMessage(
        `Account temporarily locked due to too many failed attempts. Please wait ${lockoutSeconds} seconds.`
      );
      return;
    }

    if (!identifier.trim()) {
      setErrorMessage('Please enter your username, mobile number, or email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithSupabaseOrLocal(identifier, password, rememberMe);

      if (!result.success || !result.user) {
        setIsLoading(false);
        if (result.isLocked) {
          setLockoutSeconds(30);
        }
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
        return;
      }

      const typeLabel =
        result.identifierType === 'mobile'
          ? 'Indian Mobile (+91)'
          : result.identifierType === 'email'
          ? 'Email Address'
          : 'Username';

      linkGoogleSignInIdentity(null);
      setSuccessInfo(`Authenticated via ${typeLabel}! Welcome, ${result.user.fullName}.`);

      setTimeout(() => {
        setIsLoading(false);
        onSuccessLogin(result.user?.fullName, result.user);
      }, 450);
    } catch {
      setIsLoading(false);
      setErrorMessage('A secure authentication handshake error occurred. Please try again.');
    }
  };

  // Real Supabase Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessInfo(null);
    setIsGoogleLoading(true);

    try {
      const result = await signInWithGoogleSupabase();
      if (!result.success) {
        setIsGoogleLoading(false);
        setErrorMessage(result.error || 'Google Sign-In requires Supabase Auth configuration.');
        return;
      }
      setSuccessInfo('Redirecting to Google Account verification...');
    } catch {
      setIsGoogleLoading(false);
      setErrorMessage('Google OAuth authentication service encountered an error.');
    }
  };

  // Biometric / Fingerprint Unlock (WebAuthn / Passkeys)
  const handleBiometricUnlock = async () => {
    setErrorMessage(null);
    setSuccessInfo(null);
    setIsBiometricLoading(true);

    try {
      const result = await authenticateWithBiometrics(identifier.trim() || undefined);

      if (!result.success || !result.user) {
        setIsBiometricLoading(false);
        setErrorMessage(
          result.error ||
            'Fingerprint / Biometric authentication not available on this device. Please log in with password.'
        );
        return;
      }

      setSuccessInfo(`Biometric Passkey Verified! Welcome, ${result.user.fullName}.`);

      setTimeout(() => {
        setIsBiometricLoading(false);
        onSuccessLogin(result.user?.fullName, result.user);
      }, 600);
    } catch {
      setIsBiometricLoading(false);
      setErrorMessage('Biometric sensor timed out or was cancelled. Please try password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between selection:bg-blue-100">
      {/* Top Header */}
      <AuthHeader
        currentScreen="login"
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
              <span className="material-symbols-outlined text-[28px]">health_and_safety</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Securely access your Swasthya Wallet.
            </p>
          </div>

          {/* Connection Mode Notice */}
          {!isSupabaseConfigured() && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-[11px] text-amber-900 flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">info</span>
              <span>
                Supabase environment variables are not configured. Local encrypted vault login works for accounts you register on this device.
              </span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-7 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl p-3 flex items-start gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">error</span>
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Lockout Warning */}
            {lockoutSeconds > 0 && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600">timer</span>
                <span>
                  Too many failed attempts. Try again in <strong>{lockoutSeconds} seconds</strong>.
                </span>
              </div>
            )}

            {/* Success Feedback */}
            {successInfo && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl p-3 flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span className="font-medium">{successInfo}</span>
              </div>
            )}

            {/* Input 1: Unified Identity Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-identity" className="block text-xs font-semibold text-slate-700">
                  Username / Mobile Number / Email ID <span className="text-red-500">*</span>
                </label>
                {/* Real-time Identifier Type Detection Badge */}
                {identifier.trim().length > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                      detectedType === 'mobile'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : detectedType === 'email'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {detectedType === 'mobile' ? 'smartphone' : detectedType === 'email' ? 'mail' : 'person'}
                    </span>
                    <span>
                      {detectedType === 'mobile'
                        ? 'Indian Mobile (+91)'
                        : detectedType === 'email'
                        ? 'Email Address'
                        : 'Username'}
                    </span>
                  </span>
                )}
              </div>

              <input
                id="login-identity"
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter username, mobile number or email"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Input 2: Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Below Password: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => onNavigate('recovery')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline underline-offset-2"
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Button: Login to Swasthya Wallet */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || lockoutSeconds > 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Login to Swasthya Wallet</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider: OR */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2.5 text-slate-400 font-bold">OR</span>
              </div>
            </div>

            {/* Secondary Authentication Options: Continue with Google & Unlock with Fingerprint */}
            <div className="space-y-2.5">
              {/* Option A: Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer"
                title="Sign in with your verified Google Account (OAuth 2.0)"
              >
                {isGoogleLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin"></span>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Option B: Unlock with Fingerprint */}
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isBiometricLoading}
                className="w-full bg-blue-50/80 hover:bg-blue-100/80 text-blue-800 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm border border-blue-200 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                title="Authenticate with device biometric sensor (WebAuthn / Passkeys)"
              >
                {isBiometricLoading ? (
                  <span className="w-4 h-4 border-2 border-blue-400 border-t-blue-800 rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[20px] text-blue-700">fingerprint</span>
                )}
                <span>Unlock with Fingerprint</span>
              </button>
            </div>

            {/* Bottom Link: Create Swasthya Wallet */}
            <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline underline-offset-2"
              >
                Create Swasthya Wallet
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
};
