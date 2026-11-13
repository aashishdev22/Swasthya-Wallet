/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectIdentifierType,
  normalizeMobile,
  validateDob,
  validateEmail,
  validatePasswordStrength,
  registerUser,
  authenticateUser,
  DEFAULT_DEMO_USER,
  signInWithGoogle,
  authenticateWithBiometrics,
  requestPasswordReset,
  verifyResetTokenOrOtp,
  completePasswordReset,
  createSession,
  getCurrentSessionUser,
  destroySession,
} from './auth.ts';

describe('Swasthya Wallet Authentication Engine Tests', () => {
  test('detectIdentifierType correctly identifies username, mobile, and email', () => {
    // Email detection
    assert.equal(detectIdentifierType('aarav.sharma@health.in'), 'email');
    assert.equal(detectIdentifierType('user@example.com'), 'email');

    // Indian mobile detection
    assert.equal(detectIdentifierType('9876543210'), 'mobile');
    assert.equal(detectIdentifierType('+91 98765 43210'), 'mobile');
    assert.equal(detectIdentifierType('+919876543210'), 'mobile');
    assert.equal(detectIdentifierType('09876543210'), 'mobile');
    assert.equal(detectIdentifierType('919876543210'), 'mobile');

    // Username detection
    assert.equal(detectIdentifierType('aaravsharma'), 'username');
    assert.equal(detectIdentifierType('patient_rajesh'), 'username');
    assert.equal(detectIdentifierType('aarav123'), 'username');

    // Empty
    assert.equal(detectIdentifierType(''), 'empty');
    assert.equal(detectIdentifierType('   '), 'empty');
  });

  test('normalizeMobile handles standard Indian phone variations and rejects invalid', () => {
    assert.equal(normalizeMobile('9876543210'), '9876543210');
    assert.equal(normalizeMobile('+91 98765 43210'), '9876543210');
    assert.equal(normalizeMobile('+919876543210'), '9876543210');
    assert.equal(normalizeMobile('09876543210'), '9876543210');
    assert.equal(normalizeMobile('919876543210'), '9876543210');

    // Numbers starting with 1, 2, 3, 4, 5 are invalid for Indian mobiles
    assert.equal(normalizeMobile('1234567890'), null);
    assert.equal(normalizeMobile('5552348901'), null);

    // Incorrect lengths
    assert.equal(normalizeMobile('987654321'), null);
    assert.equal(normalizeMobile('98765432100'), null);
  });

  test('validateDob enforces DD/MM/YYYY format and valid dates', () => {
    assert.equal(validateDob('15/08/1992').valid, true);
    assert.equal(validateDob('29/02/2020').valid, true); // Leap year
    assert.equal(validateDob('31/12/1985').valid, true);

    // Invalid dates
    assert.equal(validateDob('32/01/1990').valid, false);
    assert.equal(validateDob('15/13/1990').valid, false);
    assert.equal(validateDob('29/02/2021').valid, false); // Non-leap year
    assert.equal(validateDob('15/08/2099').valid, false); // Future year
    assert.equal(validateDob('invalid-date').valid, false);
  });

  test('validateEmail validates proper email addresses', () => {
    assert.equal(validateEmail('aarav.sharma@health.in'), true);
    assert.equal(validateEmail('user@domain.co.in'), true);
    assert.equal(validateEmail('invalid-email'), false);
    assert.equal(validateEmail('user@'), false);
    assert.equal(validateEmail('@domain.com'), false);
  });

  test('validatePasswordStrength checks all 5 security criteria', () => {
    const strong = validatePasswordStrength('SwasthyaKey_2024!Aarav');
    assert.equal(strong.valid, true);
    assert.equal(strong.checks.minLength, true);
    assert.equal(strong.checks.hasUpper, true);
    assert.equal(strong.checks.hasLower, true);
    assert.equal(strong.checks.hasNumber, true);
    assert.equal(strong.checks.hasSpecial, true);

    // Too short (< 12 chars)
    const short = validatePasswordStrength('Short1!Aa');
    assert.equal(short.valid, false);
    assert.equal(short.checks.minLength, false);

    // Missing special character
    const noSpecial = validatePasswordStrength('SwasthyaKey2024Aarav');
    assert.equal(noSpecial.valid, false);
    assert.equal(noSpecial.checks.hasSpecial, false);

    // Missing number
    const noNumber = validatePasswordStrength('SwasthyaKey!AaravTest');
    assert.equal(noNumber.valid, false);
    assert.equal(noNumber.checks.hasNumber, false);
  });

  test('Default demo account can authenticate via Username, Mobile, and Email', async () => {
    const password = 'SwasthyaKey_2024!Aarav';

    // 1. Authenticate with Username
    const authByUsername = await authenticateUser('aaravsharma', password);
    assert.equal(authByUsername.success, true);
    assert.equal(authByUsername.identifierType, 'username');
    assert.equal(authByUsername.user?.fullName, 'Aarav Sharma');

    // 2. Authenticate with Mobile
    const authByMobile = await authenticateUser('9876543210', password);
    assert.equal(authByMobile.success, true);
    assert.equal(authByMobile.identifierType, 'mobile');
    assert.equal(authByMobile.user?.id, authByUsername.user?.id);

    // With +91
    const authByMobilePlus91 = await authenticateUser('+91 98765 43210', password);
    assert.equal(authByMobilePlus91.success, true);
    assert.equal(authByMobilePlus91.identifierType, 'mobile');

    // 3. Authenticate with Email
    const authByEmail = await authenticateUser('aarav.sharma@health.in', password);
    assert.equal(authByEmail.success, true);
    assert.equal(authByEmail.identifierType, 'email');
    assert.equal(authByEmail.user?.id, authByUsername.user?.id);

    // Rejects incorrect password
    const failedAuth = await authenticateUser('aaravsharma', 'WrongPassword123!');
    assert.equal(failedAuth.success, false);
  });

  test('registerUser creates account with generated username and prevents duplicates', async () => {
    const res = await registerUser({
      fullName: 'Priya Sharma',
      dob: '24/09/1996',
      mobileNumber: '+91 98234 56789',
      email: 'priya.sharma@swasthya.in',
      password: 'SwasthyaPass_2024!Priya',
      confirmPassword: 'SwasthyaPass_2024!Priya',
      enrollBiometrics: true,
    });

    assert.equal(res.success, true);
    assert.ok(res.user);
    assert.equal(res.user.fullName, 'Priya Sharma');
    assert.equal(res.user.mobileNumber, '9823456789');
    assert.ok(res.user.username.startsWith('priyasharma'));
    assert.equal(res.user.biometricEnrolled, true);

    // Duplicate mobile prevention
    const duplicateMobile = await registerUser({
      fullName: 'Another Person',
      dob: '10/01/1990',
      mobileNumber: '9823456789',
      email: 'another@example.com',
      password: 'SwasthyaPass_2024!Priya',
      confirmPassword: 'SwasthyaPass_2024!Priya',
    });
    assert.equal(duplicateMobile.success, false);
    assert.match(duplicateMobile.error || '', /mobile number is already registered/i);

    // Duplicate email prevention
    const duplicateEmail = await registerUser({
      fullName: 'Third Person',
      dob: '10/01/1990',
      mobileNumber: '9811122233',
      email: 'priya.sharma@swasthya.in',
      password: 'SwasthyaPass_2024!Priya',
      confirmPassword: 'SwasthyaPass_2024!Priya',
    });
    assert.equal(duplicateEmail.success, false);
    assert.match(duplicateEmail.error || '', /email address is already associated/i);
  });

  test('Google Sign-In integrates securely and links existing user or creates verified account', async () => {
    // 1. Existing user linking with Google email
    const googleLogin = await signInWithGoogle({
      googleId: 'g_sub_123456',
      email: 'aarav.sharma@health.in',
      name: 'Aarav Sharma',
    });
    assert.equal(googleLogin.success, true);
    assert.equal(googleLogin.user?.id, DEFAULT_DEMO_USER.id);
    assert.equal(googleLogin.isNewUser, false);

    // 2. New citizen joining via Google
    const newGoogleCitizen = await signInWithGoogle({
      googleId: 'g_sub_998877',
      email: 'kavita.deshmukh@gmail.com',
      name: 'Kavita Deshmukh',
    });
    assert.equal(newGoogleCitizen.success, true);
    assert.equal(newGoogleCitizen.isNewUser, true);
    assert.ok(newGoogleCitizen.user?.username.startsWith('kavitadeshmukh'));
  });

  test('WebAuthn / Passkeys biometric unlock authenticates enrolled citizen', async () => {
    const bioResult = await authenticateWithBiometrics('aaravsharma');
    assert.equal(bioResult.success, true);
    assert.equal(bioResult.user?.fullName, 'Aarav Sharma');
  });

  test('Password recovery generates single-use expiring token and invalidates after completion', async () => {
    // 1. Request reset
    const req = requestPasswordReset('aaravsharma');
    assert.equal(req.success, true);
    assert.ok(req.token);
    assert.ok(req.previewOtp);

    // 2. Verify with valid OTP
    const verifyValid = verifyResetTokenOrOtp('aaravsharma', req.previewOtp!);
    assert.equal(verifyValid.success, true);

    // Verify with invalid OTP
    const verifyInvalid = verifyResetTokenOrOtp('aaravsharma', '000000');
    assert.equal(verifyInvalid.success, false);

    // 3. Complete password reset with new strong password
    const resetRes = await completePasswordReset('aaravsharma', req.previewOtp!, 'NewSwasthya_2025!Key');
    assert.equal(resetRes.success, true);
    assert.ok(resetRes.vaultRecoveryNote);

    // 4. Token must now be invalidated (single-use)
    const secondAttempt = verifyResetTokenOrOtp('aaravsharma', req.previewOtp!);
    assert.equal(secondAttempt.success, false);

    // 5. Authenticate with newly set password
    const newLogin = await authenticateUser('aaravsharma', 'NewSwasthya_2025!Key');
    assert.equal(newLogin.success, true);
  });

  test('Session management creates, retrieves, and destroys session', () => {
    createSession(DEFAULT_DEMO_USER, true);
    const current = getCurrentSessionUser();
    assert.ok(current);
    assert.equal(current?.id, DEFAULT_DEMO_USER.id);

    destroySession();
    const afterLogout = getCurrentSessionUser();
    assert.equal(afterLogout, null);
  });
});
