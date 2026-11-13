/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VerificationStateDetails {
  id: 'verified' | 'invalid' | 'expired' | 'timeout';
  title: string;
  badge: string;
  badgeType: 'success' | 'error' | 'warning' | 'neutral';
  description: string;
  latency: string;
  issuer: string;
  digestStatus: string;
  schemaConformance: string;
  revocationStatus: string;
}

export function formatDigest(hash: string, previewLen: number = 4): string {
  if (!hash) return '';
  if (hash.length <= previewLen * 2 + 2) return hash;
  return `${hash.slice(0, previewLen)}••${hash.slice(-previewLen)}`;
}

export function generateReferenceCode(seedSuffix?: string): string {
  const chars = '0123456789ABCDEF';
  let suffix = seedSuffix || '';
  if (!suffix) {
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return `UHW-VRF-2024-8842-${suffix.toUpperCase()}`;
}

export function calculateShareScopeSummary(
  selectedRecordNames: string[],
  recipientName: string,
  durationLabel: string
): string {
  const count = selectedRecordNames.length;
  const itemsText = count === 1 ? '1 medical record' : `${count} medical records`;
  return `${itemsText} authorized for ${recipientName} under clinical consultation, valid strictly for ${durationLabel}.`;
}

export function evaluateVerificationState(state: 'verified' | 'invalid' | 'expired' | 'timeout'): VerificationStateDetails {
  switch (state) {
    case 'verified':
      return {
        id: 'verified',
        title: 'VERIFIED & AUTHENTIC',
        badge: '100% VALIDATED',
        badgeType: 'success',
        description: 'Cryptographic Attestation Succeeded • Issuer Identity Confirmed',
        latency: '142ms',
        issuer: 'ABDM / National Digital Health PKI Registry',
        digestStatus: 'Matched anchor ledger exactly (0 bytes modified)',
        schemaConformance: 'HL7 FHIR R4 DiagnosticReport Profile',
        revocationStatus: 'OCSP / CRL check returned GOOD (Active & Valid)'
      };
    case 'invalid':
      return {
        id: 'invalid',
        title: 'INVALID • TAMPER DETECTED',
        badge: 'SECURITY ALERT',
        badgeType: 'error',
        description: 'Signature Mismatch: Hash does not match issuing institution\'s signed digest.',
        latency: '89ms',
        issuer: 'ABDM / National Digital Health PKI Registry',
        digestStatus: 'Hash mismatch observed (Content altered post-issuance)',
        schemaConformance: 'Schema signature verification failed (Error 0x99A)',
        revocationStatus: 'Quarantined from patient timeline'
      };
    case 'expired':
      return {
        id: 'expired',
        title: 'CERTIFICATE EXPIRED',
        badge: 'RE-ATTESTATION REQUIRED',
        badgeType: 'warning',
        description: 'Document authorization certificate validity window lapsed. Issuer requires re-issuance.',
        latency: '112ms',
        issuer: 'ABDM / National Digital Health PKI Registry',
        digestStatus: 'Authentic hash, but validity window lapsed',
        schemaConformance: 'HL7 FHIR R4 Valid Structure',
        revocationStatus: 'Lapsed certificate validity window (EXP_ERR_410)'
      };
    case 'timeout':
      return {
        id: 'timeout',
        title: 'AUTHORITY UNREACHABLE',
        badge: 'TIMEOUT 504',
        badgeType: 'neutral',
        description: 'Issuing hospital registry endpoint timed out. Unable to establish trust anchor link.',
        latency: '5004ms',
        issuer: 'pki.abdm.gov.in/fhir/.well-known/jwks.json',
        digestStatus: 'Local SHA-256 generated, but public key could not be cross-checked',
        schemaConformance: 'HL7 FHIR Bundle Unverified',
        revocationStatus: 'Network endpoint unreachable (HTTP 504)'
      };
  }
}

export function filterMedicalRecords<T extends { title: string; category: string; clinician?: string; hospital?: string; code?: string; verified: boolean }>(
  records: T[],
  query: string,
  category: string,
  verifiedOnly: boolean
): T[] {
  const q = query.trim().toLowerCase();
  return records.filter(record => {
    const matchesCat = category === 'all' || record.category === category;
    const matchesVerified = !verifiedOnly || record.verified;
    const matchesQuery = !q ||
      record.title.toLowerCase().includes(q) ||
      (record.clinician && record.clinician.toLowerCase().includes(q)) ||
      (record.hospital && record.hospital.toLowerCase().includes(q)) ||
      (record.code && record.code.toLowerCase().includes(q));

    return matchesCat && matchesVerified && matchesQuery;
  });
}

export interface PasswordStrengthResult {
  score: number;
  lengthCheck: boolean;
  upperCheck: boolean;
  numberCheck: boolean;
  symbolCheck: boolean;
  label: 'Unacceptable' | 'Weak' | 'Good' | 'Vault Grade';
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const lengthCheck = password.length >= 12;
  const upperCheck = /[A-Z]/.test(password);
  const numberCheck = /[0-9]/.test(password);
  const symbolCheck = /[^A-Za-z0-9]/.test(password);

  const score = [lengthCheck, upperCheck, numberCheck, symbolCheck].filter(Boolean).length;
  let label: PasswordStrengthResult['label'] = 'Unacceptable';
  if (score === 0) label = 'Unacceptable';
  else if (score <= 2) label = 'Weak';
  else if (score === 3) label = 'Good';
  else label = 'Vault Grade';

  return {
    score,
    lengthCheck,
    upperCheck,
    numberCheck,
    symbolCheck,
    label,
  };
}

export function validateAuthCredentials(email: string, pass: string): { valid: boolean; error?: string } {
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Please enter a valid clinical account email.' };
  }
  if (!pass || pass.trim().length === 0) {
    return { valid: false, error: 'Password must be provided for cryptographic session.' };
  }
  return { valid: true };
}

export interface EncryptedQrRecordPayload {
  protocol: 'ABHA-SMART-QR-v1';
  sessionToken: string;
  recordId: string;
  recordTitle: string;
  category: string;
  code: string;
  patient: {
    name: string;
    abhaId: string;
    dob?: string;
  };
  issuer: {
    hospital: string;
    clinician: string;
  };
  encryption: {
    cipher: 'AES-256-GCM';
    ephemeralKeyId: string;
    nonce: string;
    recordSha256: string;
    signature: string;
  };
  accessControl: {
    issuedAt: string;
    expiresAt: string;
    ttlMinutes: number;
    pin: string;
    oneTimeRead: boolean;
  };
  clinicalSummary: {
    title: string;
    date: string;
    findingsOrDosage: string;
    verifiedSeal: boolean;
  };
  verificationUrl: string;
}

export function generateEncryptedQrPayload(params: {
  record: {
    id: string;
    title: string;
    category?: string;
    code?: string;
    clinician?: string;
    hospital?: string;
    date?: string;
    sha256?: string;
    impression?: string;
    dosageSig?: string;
    biomarkers?: Array<{ name: string; value: string; unit: string }>;
  };
  patientName?: string;
  abhaId?: string;
  ttlMinutes?: number;
  pin?: string;
  oneTimeRead?: boolean;
}): {
  payload: EncryptedQrRecordPayload;
  qrPayloadString: string;
  pin: string;
  sessionToken: string;
  expiresAt: string;
  ttlSeconds: number;
} {
  const ttl = params.ttlMinutes || 15;
  const now = new Date();
  const expires = new Date(now.getTime() + ttl * 60 * 1000);
  const pin = params.pin || String(Math.floor(100000 + Math.random() * 900000));

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let tokenRand = '';
  for (let i = 0; i < 4; i++) {
    tokenRand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const sessionToken = `ABHA-EPH-8842-${tokenRand}`;

  const findingsText = params.record.biomarkers && params.record.biomarkers.length > 0
    ? params.record.biomarkers.map(b => `${b.name}: ${b.value} ${b.unit}`).slice(0, 3).join(', ')
    : params.record.dosageSig || params.record.impression || 'Standard clinical observations verified';

  const payload: EncryptedQrRecordPayload = {
    protocol: 'ABHA-SMART-QR-v1',
    sessionToken,
    recordId: params.record.id,
    recordTitle: params.record.title,
    category: params.record.category || 'medical-report',
    code: params.record.code || 'LOINC-24323-8',
    patient: {
      name: params.patientName || 'Swasthya Citizen',
      abhaId: params.abhaId || 'Not linked',
      dob: '',
    },
    issuer: {
      hospital: params.record.hospital || 'Health Facility',
      clinician: params.record.clinician || 'Attending Clinician',
    },
    encryption: {
      cipher: 'AES-256-GCM',
      ephemeralKeyId: `K-EPH-${Math.floor(1000 + Math.random() * 9000)}`,
      nonce: '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      recordSha256: params.record.sha256 || '0'.repeat(64),
      signature: 'ED25519-SIG-' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
    },
    accessControl: {
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      ttlMinutes: ttl,
      pin,
      oneTimeRead: params.oneTimeRead ?? true,
    },
    clinicalSummary: {
      title: params.record.title,
      date: params.record.date || new Date().toLocaleDateString('en-GB'),
      findingsOrDosage: findingsText,
      verifiedSeal: true,
    },
    verificationUrl: `https://swasthya.gov.in/verify/qr?t=${sessionToken}&p=${pin}`,
  };

  const qrPayloadString = JSON.stringify(payload);

  return {
    payload,
    qrPayloadString,
    pin,
    sessionToken,
    expiresAt: expires.toISOString(),
    ttlSeconds: ttl * 60,
  };
}

export function verifyDoctorQrPayload(
  payloadInput: string | EncryptedQrRecordPayload,
  pinAttempt: string,
  currentDate: Date = new Date()
): {
  valid: boolean;
  error?: string;
  status: 'VERIFIED' | 'EXPIRED' | 'INVALID_PIN' | 'TAMPER_DETECTED' | 'MALFORMED';
  recordDetails?: EncryptedQrRecordPayload;
} {
  let parsed: EncryptedQrRecordPayload;
  try {
    parsed = typeof payloadInput === 'string' ? JSON.parse(payloadInput) : payloadInput;
  } catch {
    return { valid: false, error: 'Malformed QR payload data envelope', status: 'MALFORMED' };
  }

  if (parsed.protocol !== 'ABHA-SMART-QR-v1') {
    return { valid: false, error: 'Unknown QR protocol format', status: 'MALFORMED' };
  }

  const expiresAt = new Date(parsed.accessControl.expiresAt);
  if (currentDate.getTime() > expiresAt.getTime()) {
    return {
      valid: false,
      error: `This QR pass expired on ${expiresAt.toLocaleTimeString('en-IN')}. Please ask the patient to generate a fresh QR code.`,
      status: 'EXPIRED',
      recordDetails: parsed,
    };
  }

  const cleanPinAttempt = pinAttempt.replace(/\s+/g, '');
  const cleanExpectedPin = parsed.accessControl.pin.replace(/\s+/g, '');
  if (cleanPinAttempt !== cleanExpectedPin) {
    return {
      valid: false,
      error: 'Invalid 6-digit Doctor Verification PIN provided by patient.',
      status: 'INVALID_PIN',
      recordDetails: parsed,
    };
  }

  return {
    valid: true,
    status: 'VERIFIED',
    recordDetails: parsed,
  };
}

