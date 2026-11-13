/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Google Drive Cloud Backup Integration
 * Official Slogan: Digital Health Locker for Citizens
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Least privilege: drive.file allows app to create/read its own created files/folders
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedDriveToken: string | null = null;
let driveUser: User | null = null;

export interface DriveFolderMap {
  rootFolderId: string;
  subfolders: {
    healthRecordsId: string;
    prescriptionsId: string;
    labReportsId: string;
    medicalDocumentsId: string;
    backupsId: string;
  };
}

export interface DriveBackupMeta {
  id: string;
  name: string;
  createdTime: string;
  sizeBytes: string;
  recordsCount: number;
  mimeType: string;
}

export interface DriveStatus {
  isConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  signedInGoogleEmail: string | null;
  lastBackupTime: string | null;
  totalBackupsCount: number;
  folderReady: boolean;
}

export interface EncryptedDriveEnvelope {
  app: 'Swasthya Wallet';
  slogan: 'Digital Health Locker for Citizens';
  version: '2.1.0';
  encrypted: true;
  algorithm: 'AES-GCM-256';
  iv: string;
  ciphertext: string;
  exportedAt: string;
  recordsCount: number;
  digest: string;
}

const LAST_BACKUP_KEY = 'swasthya_drive_last_backup';
const DRIVE_FILE_MAP_KEY = 'swasthya_drive_file_map';
const DRIVE_DIGEST_MAP_KEY = 'swasthya_drive_digest_map';
const GOOGLE_IDENTITY_KEY = 'swasthya_google_login_identity';

const memoryFileMap = new Map<string, string>();
const memoryDigestMap = new Map<string, { sha256: string; version: number }>();

function readStorageJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorageJson(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Remember Google account email from Google Sign-In without granting Drive OAuth scope.
 * Email/password login calls this with null so Drive is never falsely marked connected.
 */
export function linkGoogleSignInIdentity(email: string | null, name?: string | null): void {
  if (!email) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(GOOGLE_IDENTITY_KEY);
    } catch {
      // ignore
    }
    return;
  }
  writeStorageJson(GOOGLE_IDENTITY_KEY, { email, name: name || null });
}

export function getSignedInGoogleIdentity(): { email: string; name: string | null } | null {
  return readStorageJson<{ email: string; name: string | null } | null>(GOOGLE_IDENTITY_KEY, null);
}

export function getDriveFileId(recordId: string): string | null {
  if (memoryFileMap.has(recordId)) {
    return memoryFileMap.get(recordId) || null;
  }
  const map = readStorageJson<Record<string, string>>(DRIVE_FILE_MAP_KEY, {});
  return map[recordId] || null;
}

export function setDriveFileId(recordId: string, fileId: string | null): void {
  const map = readStorageJson<Record<string, string>>(DRIVE_FILE_MAP_KEY, {});
  if (fileId) {
    memoryFileMap.set(recordId, fileId);
    map[recordId] = fileId;
  } else {
    memoryFileMap.delete(recordId);
    delete map[recordId];
    memoryDigestMap.delete(recordId);
    const dMap = readStorageJson<Record<string, { sha256: string; version: number }>>(DRIVE_DIGEST_MAP_KEY, {});
    delete dMap[recordId];
    writeStorageJson(DRIVE_DIGEST_MAP_KEY, dMap);
  }
  writeStorageJson(DRIVE_FILE_MAP_KEY, map);
}

export function recordUploadedDigest(recordId: string, sha256: string, version: number): void {
  memoryDigestMap.set(recordId, { sha256, version });
  const dMap = readStorageJson<Record<string, { sha256: string; version: number }>>(DRIVE_DIGEST_MAP_KEY, {});
  dMap[recordId] = { sha256, version };
  writeStorageJson(DRIVE_DIGEST_MAP_KEY, dMap);
}

export function isDuplicateDriveUpload(record: { id: string; sha256?: string; version?: number }): boolean {
  const fileId = getDriveFileId(record.id);
  if (!fileId) return false;
  const cached = memoryDigestMap.get(record.id) ||
    readStorageJson<Record<string, { sha256: string; version: number }>>(DRIVE_DIGEST_MAP_KEY, {})[record.id];
  if (!cached) return false;
  return cached.sha256 === (record.sha256 || '') && cached.version === (record.version || 1);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(seed: string): Promise<CryptoKey> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API unavailable');
  }
  const encoder = new TextEncoder();
  const hash = await subtle.digest('SHA-256', encoder.encode(`swasthya-locker:${seed}`));
  return subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptBackupEnvelope(
  records: any[],
  seed: string
): Promise<EncryptedDriveEnvelope> {
  const plaintext = JSON.stringify(records);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Zero-knowledge encryption requires Web Crypto subtle support');
  }
  const key = await deriveAesKey(seed);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const digestBuf = await subtle.digest('SHA-256', encoded);
  const digestHex = Array.from(new Uint8Array(digestBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return {
    app: 'Swasthya Wallet',
    slogan: 'Digital Health Locker for Citizens',
    version: '2.1.0',
    encrypted: true,
    algorithm: 'AES-GCM-256',
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer)),
    exportedAt: new Date().toISOString(),
    recordsCount: records.length,
    digest: digestHex,
  };
}

export async function decryptBackupEnvelope(
  envelope: any,
  seed: string
): Promise<any[]> {
  if (!envelope) return [];
  if (Array.isArray(envelope)) return envelope;
  if (envelope.encrypted && envelope.ciphertext && envelope.iv) {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
      throw new Error('Web Crypto subtle support required to decrypt Drive backup');
    }
    const key = await deriveAesKey(seed);
    const iv = base64ToBytes(envelope.iv) as BufferSource;
    const cipherBytes = base64ToBytes(envelope.ciphertext) as BufferSource;
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
    const jsonStr = new TextDecoder().decode(decrypted);
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  }
  if (Array.isArray(envelope.payload)) {
    return envelope.payload;
  }
  return [];
}

export function getCachedDriveToken(): string | null {
  return cachedDriveToken;
}

export function getDriveStatus(): DriveStatus {
  const lastTime = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_BACKUP_KEY) : null;
  const googleIdentity = getSignedInGoogleIdentity();
  const isConnected = Boolean(cachedDriveToken && driveUser);
  return {
    isConnected,
    userEmail: isConnected ? driveUser?.email || null : null,
    userName: isConnected ? driveUser?.displayName || null : null,
    signedInGoogleEmail: googleIdentity?.email || driveUser?.email || null,
    lastBackupTime: lastTime,
    totalBackupsCount: lastTime ? 1 : 0,
    folderReady: isConnected,
  };
}

/**
 * Connect to Google Drive via Google OAuth 2.0 with drive.file scope
 */
export async function connectGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google OAuth authorization did not return an access token.');
    }

    cachedDriveToken = credential.accessToken;
    driveUser = result.user;
    if (result.user.email) {
      linkGoogleSignInIdentity(result.user.email, result.user.displayName);
    }

    // Verify or create Swasthya Wallet folder structure
    await ensureSwasthyaWalletFolders(cachedDriveToken);

    return { user: result.user, accessToken: cachedDriveToken };
  } catch (err: any) {
    cachedDriveToken = null;
    console.error('[Google Drive] Connection error:', err);
    throw err;
  }
}

export async function disconnectGoogleDrive(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  cachedDriveToken = null;
  driveUser = null;
}

/**
 * Initialize auth listener to detect existing session
 */
export function initGoogleDriveListener(onStateChange: (status: DriveStatus) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    driveUser = user;
    onStateChange(getDriveStatus());
  });
}

/**
 * Ensure the Swasthya Wallet dedicated folder and 5 subfolders exist in Google Drive
 */
export async function ensureSwasthyaWalletFolders(token: string): Promise<DriveFolderMap> {
  const rootFolderId = await getOrCreateFolder(token, 'Swasthya Wallet', null);

  const [healthRecordsId, prescriptionsId, labReportsId, medicalDocumentsId, backupsId] = await Promise.all([
    getOrCreateFolder(token, 'Health Records', rootFolderId),
    getOrCreateFolder(token, 'Prescriptions', rootFolderId),
    getOrCreateFolder(token, 'Lab Reports', rootFolderId),
    getOrCreateFolder(token, 'Medical Documents', rootFolderId),
    getOrCreateFolder(token, 'Backups', rootFolderId),
  ]);

  return {
    rootFolderId,
    subfolders: {
      healthRecordsId,
      prescriptionsId,
      labReportsId,
      medicalDocumentsId,
      backupsId,
    },
  };
}

async function getOrCreateFolder(token: string, folderName: string, parentId: string | null): Promise<string> {
  let q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  } else {
    q += ` and 'root' in parents`;
  }

  const queryUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
  const res = await fetch(queryUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Drive folder ${folderName}: ${errorText}`);
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

function getEncryptionSeed(patientName: string): string {
  return driveUser?.uid || driveUser?.email || patientName || 'swasthya-citizen';
}

function selectTargetFolderForCategory(category: string, folders: DriveFolderMap): string {
  if (category === 'prescription') return folders.subfolders.prescriptionsId;
  if (category === 'lab') return folders.subfolders.labReportsId;
  if (category === 'imaging' || category === 'discharge') return folders.subfolders.medicalDocumentsId;
  return folders.subfolders.healthRecordsId;
}

async function multipartDriveUpload(
  token: string,
  metadata: Record<string, any>,
  fileContent: string,
  existingFileId?: string | null
): Promise<{ id: string }> {
  const boundary = 'swasthya_drive_boundary_8842';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const res = await fetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Drive upload failed: ${errTxt}`);
  }

  return res.json();
}

/**
 * Encrypt and upload/update a single record in its Swasthya Wallet Drive subfolder,
 * preventing duplicate uploads and maintaining Drive file IDs.
 */
export async function upsertRecordToDrive(
  record: any,
  patientName: string
): Promise<{ success: boolean; fileId?: string; skippedDuplicate?: boolean; error?: string }> {
  if (!cachedDriveToken || !driveUser) {
    return {
      success: false,
      error: 'Google Drive is not authorized. Please connect Google Drive in Settings.',
    };
  }

  if (isDuplicateDriveUpload(record)) {
    return {
      success: true,
      fileId: getDriveFileId(record.id) || undefined,
      skippedDuplicate: true,
    };
  }

  try {
    const folders = await ensureSwasthyaWalletFolders(cachedDriveToken);
    const parentId = selectTargetFolderForCategory(record.category, folders);
    const existingFileId = record.driveFileId || getDriveFileId(record.id);
    const envelope = await encryptBackupEnvelope([record], getEncryptionSeed(patientName));
    const fileName = `Swasthya_${record.id}.enc.json`;

    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: 'application/json',
      description: `Swasthya Wallet Encrypted Record (${record.category})`,
    };
    if (!existingFileId) {
      metadata.parents = [parentId];
    }

    const uploaded = await multipartDriveUpload(
      cachedDriveToken,
      metadata,
      JSON.stringify(envelope, null, 2),
      existingFileId
    );

    setDriveFileId(record.id, uploaded.id);
    recordUploadedDigest(record.id, record.sha256 || '', record.version || 1);

    const nowIso = new Date().toISOString();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_BACKUP_KEY, nowIso);
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      fileId: uploaded.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Google Drive upload failed',
    };
  }
}

/**
 * Delete a synced record file from Google Drive when deleted with delete_everywhere policy.
 */
export async function deleteDriveFileForRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
  const fileId = getDriveFileId(recordId);
  if (!fileId) {
    setDriveFileId(recordId, null);
    return { success: true };
  }
  if (!cachedDriveToken || !driveUser) {
    return { success: false, error: 'Google Drive is not authorized.' };
  }
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cachedDriveToken}` },
    });
    if (!res.ok && res.status !== 404) {
      const errTxt = await res.text();
      throw new Error(`Drive delete failed: ${errTxt}`);
    }
    setDriveFileId(recordId, null);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove file from Google Drive' };
  }
}

/**
 * Backup Encrypted Health Locker archive to Google Drive in Swasthya Wallet/Backups
 */
export async function backupRecordsToDrive(
  records: any[],
  patientName: string
): Promise<{ success: boolean; fileId?: string; fileName?: string; error?: string }> {
  if (!cachedDriveToken || !driveUser) {
    return {
      success: false,
      error: 'Google Drive is not connected. Please connect your Google account first.',
    };
  }

  try {
    const folders = await ensureSwasthyaWalletFolders(cachedDriveToken);
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Swasthya_Locker_Backup_${timestampStr}.enc.json`;
    const envelope = await encryptBackupEnvelope(records, getEncryptionSeed(patientName));

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folders.subfolders.backupsId],
      description: 'Swasthya Wallet Encrypted Health Locker Backup',
    };

    const fileData = await multipartDriveUpload(
      cachedDriveToken,
      metadata,
      JSON.stringify(envelope, null, 2)
    );

    const nowIso = new Date().toISOString();
    try {
      localStorage.setItem(LAST_BACKUP_KEY, nowIso);
    } catch {
      // ignore
    }

    return {
      success: true,
      fileId: fileData.id,
      fileName,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to complete Google Drive backup',
    };
  }
}

/**
 * List existing Swasthya Wallet backups from Google Drive
 */
export async function listDriveBackups(): Promise<DriveBackupMeta[]> {
  if (!cachedDriveToken || !driveUser) {
    return [];
  }

  try {
    const folders = await ensureSwasthyaWalletFolders(cachedDriveToken);
    const q = `'${folders.subfolders.backupsId}' in parents and trashed=false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,createdTime,size,mimeType)&orderBy=createdTime desc`,
      {
        headers: { Authorization: `Bearer ${cachedDriveToken}` },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
      sizeBytes: f.size || '0',
      recordsCount: 0,
      mimeType: f.mimeType,
    }));
  } catch {
    return [];
  }
}

/**
 * Restore and decrypt health records from an existing Google Drive backup file
 */
export async function restoreFromDrive(
  fileId: string,
  patientName: string = 'Swasthya Citizen'
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  if (!cachedDriveToken || !driveUser) {
    return { success: false, error: 'Google Drive is not connected.' };
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${cachedDriveToken}` },
    });

    if (!res.ok) {
      throw new Error('Failed to download backup file from Google Drive');
    }

    const backupJson = await res.json();
    const restored = await decryptBackupEnvelope(backupJson, getEncryptionSeed(patientName));
    return {
      success: true,
      data: restored,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Restoration failed.' };
  }
}
