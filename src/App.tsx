/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Main Application Entry
 * Official Slogan: Digital Health Locker for Citizens
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActiveDelegation,
  AppointmentItem,
  AuditEvent,
  MedicalRecord,
  NotificationItem,
  NotificationPreferences,
  PatientProfile,
  UserMedicine,
  VaccineItem,
} from './types/health.ts';
import {
  SupportedLanguage,
  getStoredLanguage,
  setStoredLanguage,
  getTranslation,
  SUPPORTED_LANGUAGES,
} from './utils/i18n.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { MedicalRecordsView } from './components/MedicalRecordsView.tsx';
import { VaccinationWalletView } from './components/VaccinationWalletView.tsx';
import { SecureSharingView } from './components/SecureSharingView.tsx';
import { DocumentVerificationView } from './components/DocumentVerificationView.tsx';
import { SecurityAuditView } from './components/SecurityAuditView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { RecordDetailModal } from './components/RecordDetailModal.tsx';
import { UploadDocumentModal } from './components/UploadDocumentModal.tsx';
import { DicomViewerModal } from './components/DicomViewerModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { RemindersScheduleView } from './components/RemindersScheduleView.tsx';
import { LogVaccineModal } from './components/LogVaccineModal.tsx';
import { ProfilePhotoManagerModal } from './components/ProfilePhotoManagerModal.tsx';
import { AuthScreenType } from './components/auth/AuthHeader.tsx';
import { PatientLoginView } from './components/auth/PatientLoginView.tsx';
import { PatientRegistrationView } from './components/auth/PatientRegistrationView.tsx';
import { PasswordRecoveryView } from './components/auth/PasswordRecoveryView.tsx';
import { BiometricChallengeModal } from './components/BiometricChallengeModal.tsx';
import { LandingPageView } from './components/LandingPageView.tsx';
import {
  UserAccount,
  getActiveAuthenticatedUser,
  signOutActiveUser,
  supabaseUserToUserAccount,
} from './utils/auth.ts';
import { FullScreenQrShareView } from './components/FullScreenQrShareView.tsx';
import { RecipientVerificationView } from './components/RecipientVerificationView.tsx';
import { PrescriptionAssistantView } from './components/PrescriptionAssistantView.tsx';
import { MedicineSearchView } from './components/MedicineSearchView.tsx';
import { MedicineAlternativesView } from './components/MedicineAlternativesView.tsx';
import { RecordDetailsView } from './components/RecordDetailsView.tsx';
import { MedicineDetailsView } from './components/MedicineDetailsView.tsx';
import { syncEngine } from './utils/syncEngine.ts';
import { linkGoogleSignInIdentity } from './utils/googleDrive.ts';
import { INDIAN_MEDICINE_CATALOG, MedicineItem } from './data/medicineDatabase.ts';
import { getSupabaseClient, isSupabaseConfigured } from './utils/supabase.ts';
import {
  appendAuditLog,
  createCleanPatientProfile,
  createNotification,
  createSharedDelegation,
  deleteAppointment,
  deleteHealthRecordFromCloud,
  deleteUserMedicine,
  deleteVaccination,
  fetchAppointments,
  fetchAuditLogs,
  fetchHealthRecords,
  fetchNotifications,
  fetchSharedDelegations,
  fetchUserMedicines,
  fetchUserProfile,
  fetchVaccinations,
  generateUuid,
  loadLocalUserVault,
  markAllNotificationsRead,
  removeProfilePhotoFromSupabase,
  revokeSharedDelegation,
  saveLocalUserVault,
  savePrescriptionOcrBundle,
  uploadProfilePhotoToSupabase,
  upsertAppointment,
  upsertHealthRecord,
  upsertUserMedicine,
  upsertUserProfile,
  upsertVaccination,
} from './utils/supabaseService.ts';
import {
  ExtractedPrescriptionItem,
  PrescriptionOcrResult,
} from './utils/prescriptionOcr.ts';

const EMPTY_CITIZEN_PROFILE: PatientProfile = createCleanPatientProfile({
  name: 'Citizen',
});

export default function App() {
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [isBootstrappingAuth, setIsBootstrappingAuth] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [patient, setPatient] = useState<PatientProfile>(EMPTY_CITIZEN_PROFILE);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [userMedicines, setUserMedicines] = useState<UserMedicine[]>([]);
  const [vaccines, setVaccines] = useState<VaccineItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [delegations, setDelegations] = useState<ActiveDelegation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentAuthScreen, setCurrentAuthScreen] = useState<AuthScreenType | null>('landing');
  const currentAuthScreenRef = useRef<AuthScreenType | null>(currentAuthScreen);
  useEffect(() => {
    currentAuthScreenRef.current = currentAuthScreen;
  }, [currentAuthScreen]);
  const [passwordRecoveryRedirectMode, setPasswordRecoveryRedirectMode] = useState<boolean>(false);

  // Centralized 12-Language Support State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getStoredLanguage());
  const t = getTranslation(currentLang);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const handleSelectLang = (newLang: SupportedLanguage) => {
    setCurrentLang(newLang);
    setStoredLanguage(newLang);
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === newLang);
    showToast(`Language: ${langObj?.nativeName || newLang} (${langObj?.name})`);
  };

  // Biometric Unlock hardware authentication state
  const [biometricUnlockEnabled, setBiometricUnlockEnabled] = useState<boolean>(false);
  const [biometricChallenge, setBiometricChallenge] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    recordTitle?: string;
    enforceMode: 'app_unlock' | 'record_view';
    onSuccessAction: () => void;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    enforceMode: 'record_view',
    onSuccessAction: () => {},
  });

  // Modals & Viewers
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MedicalRecord | null>(null);
  const [selectedRecordForDicom, setSelectedRecordForDicom] = useState<MedicalRecord | null>(null);
  const [selectedRecordForShare, setSelectedRecordForShare] = useState<MedicalRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isLogVaccineModalOpen, setIsLogVaccineModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [photoModalState, setPhotoModalState] = useState<{
    isOpen: boolean;
    mode: 'upload' | 'view' | 'remove';
  }>({ isOpen: false, mode: 'upload' });

  const [selectedMedicineForAlternatives, setSelectedMedicineForAlternatives] = useState<MedicineItem | null>(
    INDIAN_MEDICINE_CATALOG[0] || null
  );
  const [findMedicineQuery, setFindMedicineQuery] = useState<string>('');
  const [findMedicineSystem, setFindMedicineSystem] = useState<string>('all');
  const [recipientPreviewData, setRecipientPreviewData] = useState<{
    isOpen: boolean;
    shareUrl: string;
    scopeName: string;
    records: MedicalRecord[];
    pinCode?: string;
  }>({
    isOpen: false,
    shareUrl: '',
    scopeName: 'complete',
    records: [],
  });

  // Dedicated Detail Page States + Preserved Scroll Position & Filters
  const [selectedRecordForDedicatedView, setSelectedRecordForDedicatedView] = useState<MedicalRecord | null>(null);
  const [selectedMedicineForDedicatedView, setSelectedMedicineForDedicatedView] = useState<MedicineItem | null>(null);
  const [selectedUserMedicineForDedicatedView, setSelectedUserMedicineForDedicatedView] =
    useState<UserMedicine | null>(null);
  const [recordCategoryFilter, setRecordCategoryFilter] = useState<string>('all');
  const [recordSortBy, setRecordSortBy] = useState<'date_desc' | 'date_asc' | 'alpha'>('date_desc');
  const [recordRecentOnly, setRecordRecentOnly] = useState<boolean>(false);
  const [medicinePrescribedOnly, setMedicinePrescribedOnly] = useState<boolean>(false);
  const [medicineRecentOnly, setMedicineRecentOnly] = useState<boolean>(false);
  const savedScrollYRef = useRef<number>(0);

  const buildFallbackProfileFromUser = useCallback((user: UserAccount): PatientProfile => {
    return createCleanPatientProfile({
      id: user.id,
      username: user.username,
      name: user.fullName,
      dob: user.dob,
      email: user.email,
      phone: user.mobileNumber,
      abhaId: user.abhaId,
    });
  }, []);

  /**
   * Hydrate clean user-scoped data from Supabase (or clean per-user local vault if Supabase is unconfigured).
   * Never seeds mock/demo data.
   */
  const hydrateUserSession = useCallback(
    async (user: UserAccount) => {
      setActiveUser(user);
      setBiometricUnlockEnabled(Boolean(user.biometricEnrolled));
      setDataError(null);

      const fallbackProfile = buildFallbackProfileFromUser(user);

      if (!isSupabaseConfigured()) {
        const localBundle = loadLocalUserVault(user.id);
        setPatient(localBundle.profile || fallbackProfile);
        setRecords(localBundle.records);
        setUserMedicines(localBundle.medicines);
        setVaccines(localBundle.vaccines);
        setAppointments(localBundle.appointments);
        setDelegations(localBundle.delegations);
        setAuditLogs(localBundle.auditLogs);
        setNotifications(localBundle.notifications);
        syncEngine.init();
        return;
      }

      setIsLoadingData(true);
      try {
        const [
          profileRes,
          recordsRes,
          medsRes,
          vaccinesRes,
          apptsRes,
          sharesRes,
          auditRes,
          notifRes,
        ] = await Promise.all([
          fetchUserProfile(user.id, fallbackProfile),
          fetchHealthRecords(user.id),
          fetchUserMedicines(user.id),
          fetchVaccinations(user.id),
          fetchAppointments(user.id),
          fetchSharedDelegations(user.id),
          fetchAuditLogs(user.id),
          fetchNotifications(user.id),
        ]);

        const errors: string[] = [];
        if (profileRes.error) errors.push(profileRes.error);
        if (recordsRes.error) errors.push(recordsRes.error);
        if (medsRes.error) errors.push(medsRes.error);
        if (vaccinesRes.error) errors.push(vaccinesRes.error);
        if (apptsRes.error) errors.push(apptsRes.error);
        if (sharesRes.error) errors.push(sharesRes.error);
        if (auditRes.error) errors.push(auditRes.error);
        if (notifRes.error) errors.push(notifRes.error);

        if (profileRes.data) {
          setPatient(profileRes.data);
        } else {
          setPatient(fallbackProfile);
          if (!profileRes.error) {
            await upsertUserProfile(user.id, fallbackProfile);
          }
        }

        setRecords(recordsRes.data || []);
        setUserMedicines(medsRes.data || []);
        setVaccines(vaccinesRes.data || []);
        setAppointments(apptsRes.data || []);
        setDelegations(sharesRes.data || []);
        setAuditLogs(auditRes.data || []);
        setNotifications(notifRes.data || []);

        if (errors.length > 0) {
          setDataError(errors[0]);
        }
      } catch (err: any) {
        setPatient(fallbackProfile);
        setDataError(err?.message || 'Unable to load citizen health data from Supabase.');
      } finally {
        setIsLoadingData(false);
        syncEngine.init();
      }
    },
    [buildFallbackProfileFromUser]
  );

  // Restore session on startup and subscribe to Supabase Auth changes (Google OAuth redirect etc.)
  useEffect(() => {
    let mounted = true;
    getActiveAuthenticatedUser()
      .then(async (user) => {
        if (!mounted) return;
        if (user) {
          setCurrentAuthScreen(null);
          await hydrateUserSession(user);
        } else {
          setCurrentAuthScreen('landing');
        }
      })
      .finally(() => {
        if (mounted) setIsBootstrappingAuth(false);
      });

    const client = getSupabaseClient();
    const authSub = client?.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryRedirectMode(true);
        setCurrentAuthScreen('recovery');
        return;
      }
      if (event === 'SIGNED_IN' && session?.user) {
        // Do not interrupt active interactive auth flows (Registration OTP / Password Recovery OTP / Login)
        // which manage their own completion callback before entering the wallet.
        const activeScreen = currentAuthScreenRef.current;
        if (activeScreen === 'register' || activeScreen === 'recovery' || activeScreen === 'login') {
          return;
        }
        const account = supabaseUserToUserAccount(session.user);
        setCurrentAuthScreen(null);
        await hydrateUserSession(account);
      } else if (event === 'SIGNED_OUT') {
        setActiveUser(null);
        setPatient(EMPTY_CITIZEN_PROFILE);
        setRecords([]);
        setUserMedicines([]);
        setVaccines([]);
        setAppointments([]);
        setDelegations([]);
        setAuditLogs([]);
        setNotifications([]);
        setPasswordRecoveryRedirectMode(false);
        setCurrentAuthScreen('landing');
      }
    });

    return () => {
      mounted = false;
      authSub?.data.subscription.unsubscribe();
    };
  }, [hydrateUserSession]);

  // Helper to mirror current state cleanly into user-scoped local vault when Supabase is unconfigured
  const persistLocalMirror = useCallback(
    (patch: Partial<ReturnType<typeof loadLocalUserVault>>) => {
      if (!activeUser || isSupabaseConfigured()) return;
      saveLocalUserVault(activeUser.id, patch);
    },
    [activeUser]
  );

  const recordAuditEvent = useCallback(
    async (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
      const created: AuditEvent = {
        ...event,
        id: generateUuid(),
        userId: activeUser?.id,
        timestamp: new Date().toLocaleString('en-IN'),
        createdAt: new Date().toISOString(),
      };
      if (isSupabaseConfigured() && activeUser) {
        const res = await appendAuditLog(activeUser.id, event);
        const saved = res.data || created;
        setAuditLogs((prev) => [saved, ...prev]);
        return;
      }
      setAuditLogs((prev) => {
        const next = [created, ...prev];
        persistLocalMirror({ auditLogs: next });
        return next;
      });
    },
    [activeUser, persistLocalMirror]
  );

  const pushUserNotification = useCallback(
    async (notif: Omit<NotificationItem, 'id' | 'createdAt'>) => {
      const localItem: NotificationItem = {
        ...notif,
        id: generateUuid(),
        userId: activeUser?.id,
        createdAt: new Date().toISOString(),
      };
      if (isSupabaseConfigured() && activeUser) {
        const res = await createNotification(activeUser.id, notif);
        const saved = res.data || localItem;
        setNotifications((prev) => [saved, ...prev]);
        return;
      }
      setNotifications((prev) => {
        const next = [localItem, ...prev];
        persistLocalMirror({ notifications: next });
        return next;
      });
    },
    [activeUser, persistLocalMirror]
  );

  const handleLogout = async () => {
    await signOutActiveUser();
    linkGoogleSignInIdentity(null);
    setActiveUser(null);
    setPatient(EMPTY_CITIZEN_PROFILE);
    setRecords([]);
    setUserMedicines([]);
    setVaccines([]);
    setAppointments([]);
    setDelegations([]);
    setAuditLogs([]);
    setNotifications([]);
    setSelectedRecordForDedicatedView(null);
    setSelectedMedicineForDedicatedView(null);
    setSelectedUserMedicineForDedicatedView(null);
    setCurrentTab('dashboard');
    setCurrentAuthScreen('landing');
    showToast('Logged out securely from Swasthya Wallet.');
  };

  // Protected Record Access Interceptor
  const handleOpenRecordDetail = (record: MedicalRecord) => {
    const openRecord = () => {
      savedScrollYRef.current = window.scrollY;
      setSelectedRecordForDedicatedView(record);
      setCurrentTab('medical-records');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };

    if (biometricUnlockEnabled) {
      setBiometricChallenge({
        isOpen: true,
        title: currentLang === 'hi' ? 'बायोमेट्रिक सत्यापन आवश्यक' : 'Biometric Record Verification Challenge',
        subtitle:
          currentLang === 'hi'
            ? `गोपनीय स्वास्थ्य रिपोर्ट देखने के लिए कृपया सेंसर पर उंगली रखें (${record.title})`
            : `Hardware biometric verification required to view protected health record: ${record.title}.`,
        recordTitle: `${record.title} (${record.code})`,
        enforceMode: 'record_view',
        onSuccessAction: openRecord,
      });
    } else {
      openRecord();
    }
  };

  const handleBackFromRecordDetails = () => {
    setSelectedRecordForDedicatedView(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollYRef.current, behavior: 'instant' as ScrollBehavior });
    });
  };

  const handleOpenMedicineDetail = (med: MedicineItem, userMed?: UserMedicine) => {
    savedScrollYRef.current = window.scrollY;
    setSelectedMedicineForDedicatedView(med);
    setSelectedUserMedicineForDedicatedView(userMed || null);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleBackFromMedicineDetails = () => {
    setSelectedMedicineForDedicatedView(null);
    setSelectedUserMedicineForDedicatedView(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollYRef.current, behavior: 'instant' as ScrollBehavior });
    });
  };

  const handleOpenDicomViewer = (record: MedicalRecord) => {
    if (biometricUnlockEnabled) {
      setBiometricChallenge({
        isOpen: true,
        title: currentLang === 'hi' ? 'एक्स-रे / स्कैन बायोमेट्रिक सत्यापन' : 'Biometric Medical Scan Decryption Challenge',
        subtitle:
          currentLang === 'hi'
            ? `उच्च-रिज़ॉल्यूशन रेडियोलॉजी स्कैन देखने के लिए बायोमेट्रिक प्रमाणीकरण आवश्यक है।`
            : `Radiological studies contain protected health information. Authenticate to view full scan series.`,
        recordTitle: `${record.title} (${record.code})`,
        enforceMode: 'record_view',
        onSuccessAction: () => {
          setSelectedRecordForDicom(record);
        },
      });
    } else {
      setSelectedRecordForDicom(record);
    }
  };

  // ---- CRUD HANDLERS ----

  const handleAddRecord = async (newRec: MedicalRecord, rawFile?: File | null) => {
    const idRec: MedicalRecord = {
      ...newRec,
      id: /^[0-9a-f]{8}-/i.test(newRec.id) ? newRec.id : generateUuid(),
      userId: activeUser?.id,
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertHealthRecord(activeUser.id, idRec, rawFile);
      if (res.error || !res.data) {
        showToast(res.error || 'Failed to save health record to Supabase.');
        return;
      }
      setRecords((prev) => [res.data!, ...prev]);
      await recordAuditEvent({
        title: `Health Record Added: ${res.data.title}`,
        actor: patient.name,
        actionType: 'RECORD_UPLOAD',
        clientIp: 'Swasthya Citizen Web',
        statusCode: '201 CREATED',
        details: `Uploaded ${res.data.fileFormat} (${res.data.fileSize}) • SHA-256 verified.`,
        sigVerified: true,
      });
      await pushUserNotification({
        title: 'Health Record Saved',
        message: `"${res.data.title}" was encrypted and saved to your citizen health locker.`,
        type: 'info',
        read: false,
        actionView: 'medical-records',
      });
      showToast(`"${res.data.title}" saved securely to Supabase.`);
      return;
    }

    const syncRes = await syncEngine.autoSaveRecord(idRec, patient.name);
    const saved = syncRes.versionedRecord || idRec;
    setRecords((prev) => {
      const next = [saved, ...prev];
      persistLocalMirror({ records: next });
      return next;
    });
    await recordAuditEvent({
      title: `Health Record Added: ${saved.title}`,
      actor: patient.name,
      actionType: 'RECORD_UPLOAD',
      clientIp: 'Local Encrypted Vault',
      statusCode: '201 CREATED',
      details: `Encrypted ${saved.fileFormat} (${saved.fileSize}) stored in citizen vault.`,
      sigVerified: true,
    });
    await pushUserNotification({
      title: 'Health Record Saved',
      message: `"${saved.title}" encrypted & stored in your locker.`,
      type: 'info',
      read: false,
      actionView: 'medical-records',
    });
    showToast(`"${saved.title}" encrypted & saved to your locker.`);
  };

  const handleDeleteRecord = async (
    id: string,
    policy: 'delete_everywhere' | 'local_only' | 'archive' = 'delete_everywhere'
  ) => {
    const target = records.find((r) => r.id === id);
    if (isSupabaseConfigured() && activeUser) {
      const res = await deleteHealthRecordFromCloud(activeUser.id, id, target?.fileStoragePath);
      if (res.error) {
        showToast(res.error);
        return;
      }
    }
    setRecords((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistLocalMirror({ records: next });
      return next;
    });
    syncEngine.autoDeleteRecord(id, policy);
    if (target) {
      await recordAuditEvent({
        title: `Record Removed: ${target.title}`,
        actor: patient.name,
        actionType: 'RECORD_DELETE',
        clientIp: 'Swasthya Citizen Web',
        statusCode: '200 OK',
        details: `Applied deletion policy: ${policy}.`,
        sigVerified: true,
      });
    }
    showToast(`Record removed (${policy.replace('_', ' ')}).`);
  };

  const handleUpdateRecordMetadata = async (id: string, newTitle: string, newCategory: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;

    const updated: MedicalRecord = {
      ...target,
      title: newTitle,
      category: newCategory as MedicalRecord['category'],
      version: (target.version || 1) + 1,
      updatedAt: Date.now(),
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertHealthRecord(activeUser.id, updated);
      if (res.error || !res.data) {
        showToast(res.error || 'Failed to update record metadata.');
        return;
      }
      setRecords((prev) => prev.map((r) => (r.id === id ? res.data! : r)));
      if (selectedRecordForDedicatedView?.id === id) {
        setSelectedRecordForDedicatedView(res.data);
      }
      showToast('Record metadata updated.');
      return;
    }

    setRecords((prev) => {
      const next = prev.map((r) => (r.id === id ? updated : r));
      persistLocalMirror({ records: next });
      return next;
    });
    if (selectedRecordForDedicatedView?.id === id) {
      setSelectedRecordForDedicatedView(updated);
    }
    syncEngine.autoSaveRecord(updated, patient.name);
    showToast('Record metadata updated.');
  };

  const handleAddUserMedicine = async (medInput: Omit<UserMedicine, 'id'>) => {
    const candidate: UserMedicine = {
      ...medInput,
      id: generateUuid(),
      userId: activeUser?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertUserMedicine(activeUser.id, candidate);
      if (res.error || !res.data) {
        showToast(res.error || 'Could not save medicine to Supabase.');
        return;
      }
      setUserMedicines((prev) => [res.data!, ...prev]);
      showToast(`"${res.data.name}" added to My Medicines.`);
      return;
    }

    setUserMedicines((prev) => {
      const next = [candidate, ...prev];
      persistLocalMirror({ medicines: next });
      return next;
    });
    showToast(`"${candidate.name}" added to My Medicines.`);
  };

  const handleToggleUserMedicineActive = async (id: string) => {
    const target = userMedicines.find((m) => m.id === id);
    if (!target) return;
    const updated: UserMedicine = {
      ...target,
      isActive: !target.isActive,
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertUserMedicine(activeUser.id, updated);
      if (res.error || !res.data) {
        showToast(res.error || 'Could not update medicine status.');
        return;
      }
      setUserMedicines((prev) => prev.map((m) => (m.id === id ? res.data! : m)));
      return;
    }

    setUserMedicines((prev) => {
      const next = prev.map((m) => (m.id === id ? updated : m));
      persistLocalMirror({ medicines: next });
      return next;
    });
  };

  const handleDeleteUserMedicine = async (id: string) => {
    if (isSupabaseConfigured() && activeUser) {
      const res = await deleteUserMedicine(activeUser.id, id);
      if (res.error) {
        showToast(res.error);
        return;
      }
    }
    setUserMedicines((prev) => {
      const next = prev.filter((m) => m.id !== id);
      persistLocalMirror({ medicines: next });
      return next;
    });
    showToast('Medicine removed from My Medicines.');
  };

  const handleSaveExtractedMedicines = async (
    items: ExtractedPrescriptionItem[],
    ocrResult: PrescriptionOcrResult,
    healthRecordId: string
  ) => {
    if (isSupabaseConfigured() && activeUser) {
      await savePrescriptionOcrBundle(activeUser.id, healthRecordId, ocrResult);
    }
    for (const item of items) {
      await handleAddUserMedicine({
        name: item.name,
        system: item.system,
        genericOrActiveSalt: item.activeIngredients || item.botanicalOrLatinName || item.name,
        dosageForm: item.dosageForm || 'Tablet',
        strengthOrPotency: item.strengthOrPotency || 'Standard',
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
        prescriberName: ocrResult.prescriberName,
        prescriptionDate: ocrResult.prescriptionDate,
        linkedRecordId: healthRecordId,
        isActive: true,
      });
    }
  };

  const handleAddVaccine = async (vaccine: VaccineItem) => {
    const candidate: VaccineItem = {
      ...vaccine,
      id: /^[0-9a-f]{8}-/i.test(vaccine.id) ? vaccine.id : generateUuid(),
      userId: activeUser?.id,
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertVaccination(activeUser.id, candidate);
      if (res.error || !res.data) {
        showToast(res.error || 'Failed to save immunization record.');
        return;
      }
      setVaccines((prev) => [res.data!, ...prev]);
      showToast(`${res.data.title} saved to Vaccination Wallet.`);
      return;
    }

    setVaccines((prev) => {
      const next = [candidate, ...prev];
      persistLocalMirror({ vaccines: next });
      return next;
    });
    showToast(`${candidate.title} saved to Vaccination Wallet.`);
  };

  const handleDeleteVaccine = async (id: string) => {
    if (isSupabaseConfigured() && activeUser) {
      const res = await deleteVaccination(activeUser.id, id);
      if (res.error) {
        showToast(res.error);
        return;
      }
    }
    setVaccines((prev) => {
      const next = prev.filter((v) => v.id !== id);
      persistLocalMirror({ vaccines: next });
      return next;
    });
    showToast('Vaccination record removed.');
  };

  const handleAddAppointment = async (appt: AppointmentItem) => {
    const candidate: AppointmentItem = {
      ...appt,
      id: /^[0-9a-f]{8}-/i.test(appt.id) ? appt.id : generateUuid(),
      userId: activeUser?.id,
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertAppointment(activeUser.id, candidate);
      if (res.error || !res.data) {
        showToast(res.error || 'Failed to schedule appointment.');
        return;
      }
      setAppointments((prev) => [res.data!, ...prev]);
      showToast(`Scheduled: ${res.data.title}`);
      return;
    }

    setAppointments((prev) => {
      const next = [candidate, ...prev];
      persistLocalMirror({ appointments: next });
      return next;
    });
    showToast(`Scheduled: ${candidate.title}`);
  };

  const handleToggleAppointmentStatus = async (id: string) => {
    const target = appointments.find((a) => a.id === id);
    if (!target) return;
    const updated: AppointmentItem = {
      ...target,
      status: target.status === 'upcoming' ? 'completed' : 'upcoming',
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertAppointment(activeUser.id, updated);
      if (res.error || !res.data) {
        showToast(res.error || 'Could not update appointment.');
        return;
      }
      setAppointments((prev) => prev.map((a) => (a.id === id ? res.data! : a)));
      return;
    }

    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === id ? updated : a));
      persistLocalMirror({ appointments: next });
      return next;
    });
  };

  const handleDeleteAppointment = async (id: string) => {
    if (isSupabaseConfigured() && activeUser) {
      const res = await deleteAppointment(activeUser.id, id);
      if (res.error) {
        showToast(res.error);
        return;
      }
    }
    setAppointments((prev) => {
      const next = prev.filter((a) => a.id !== id);
      persistLocalMirror({ appointments: next });
      return next;
    });
    showToast('Appointment removed.');
  };

  const handleUpdateProfile = async (
    updated: PatientProfile
  ): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && activeUser) {
      const res = await upsertUserProfile(activeUser.id, updated);
      if (res.error || !res.data) {
        return { success: false, error: res.error || 'Failed to save citizen profile.' };
      }
      setPatient(res.data);
      return { success: true };
    }

    setPatient(updated);
    persistLocalMirror({ profile: updated });
    return { success: true };
  };

  const handleUpdateNotificationPrefs = async (prefs: NotificationPreferences) => {
    const updated: PatientProfile = {
      ...patient,
      notificationPreferences: prefs,
    };
    await handleUpdateProfile(updated);
    showToast('Notification preferences updated.');
  };

  const handleRevokeDelegation = async (id: string) => {
    if (isSupabaseConfigured() && activeUser) {
      const res = await revokeSharedDelegation(activeUser.id, id);
      if (res.error) {
        showToast(res.error);
        return;
      }
    }
    setDelegations((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, revoked: true } : d));
      persistLocalMirror({ delegations: next });
      return next;
    });
  };

  const handleAddDelegation = async (newDel: ActiveDelegation) => {
    const candidate: ActiveDelegation = {
      ...newDel,
      id: /^[0-9a-f]{8}-/i.test(newDel.id) ? newDel.id : generateUuid(),
      userId: activeUser?.id,
    };

    if (isSupabaseConfigured() && activeUser) {
      const res = await createSharedDelegation(activeUser.id, candidate);
      if (res.error || !res.data) {
        showToast(res.error || 'Failed to persist FHIR share delegation.');
        return;
      }
      setDelegations((prev) => [res.data!, ...prev]);
      return;
    }

    setDelegations((prev) => {
      const next = [candidate, ...prev];
      persistLocalMirror({ delegations: next });
      return next;
    });
  };

  const handleShareRecord = (record: MedicalRecord) => {
    setSelectedRecordForShare(record);
    setCurrentTab('qr-sharing');
    showToast(`Opening temporary encrypted QR code for "${record.title}".`);
  };

  const handleSelectNavTab = (tab: NavTab) => {
    if (tab !== 'medical-records') {
      setSelectedRecordForDedicatedView(null);
    }
    if (tab !== 'find-medicines') {
      setSelectedMedicineForDedicatedView(null);
      setSelectedUserMedicineForDedicatedView(null);
    }
    setCurrentTab(tab);
  };

  // Profile Photo Upload / Remove Handlers (Private Supabase Storage Only — Never Fakes Storage Success)
  const handleProfilePhotoUploadConfirmed = async (payload: {
    blob: Blob;
    ext: string;
    dataUrl: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !activeUser) {
      return {
        success: false,
        error:
          'Profile photo cloud upload requires Supabase configuration (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) and the private "profile-photos" bucket. Previous photo state remains unchanged.',
      };
    }

    const res = await uploadProfilePhotoToSupabase(
      activeUser.id,
      payload.blob,
      payload.ext,
      patient.avatarPath
    );

    if (res.error || !res.data) {
      return {
        success: false,
        error: res.error || 'Profile photo upload failed. Previous photo kept intact.',
      };
    }

    setPatient((prev) => ({
      ...prev,
      avatarUrl: res.data!.signedUrl,
      avatarPath: res.data!.avatarPath,
      avatarUpdatedAt: res.data!.updatedAt,
    }));

    await recordAuditEvent({
      title: 'Profile Photo Updated',
      actor: patient.name,
      actionType: 'PROFILE_PHOTO_UPLOAD',
      clientIp: 'Swasthya Citizen Web',
      statusCode: '200 OK',
      details: 'Uploaded cropped profile photo to private "profile-photos" bucket.',
      sigVerified: true,
    });
    showToast('Profile photo updated securely.');
    return { success: true };
  };

  const handleProfilePhotoRemoveConfirmed = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isSupabaseConfigured() || !activeUser) {
      return {
        success: false,
        error:
          'Profile photo cloud removal requires Supabase configuration (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).',
      };
    }

    const res = await removeProfilePhotoFromSupabase(activeUser.id, patient.avatarPath);
    if (res.error) {
      return { success: false, error: res.error };
    }

    setPatient((prev) => ({
      ...prev,
      avatarUrl: '',
      avatarPath: null,
      avatarUpdatedAt: new Date().toISOString(),
    }));

    await recordAuditEvent({
      title: 'Profile Photo Removed',
      actor: patient.name,
      actionType: 'PROFILE_PHOTO_REMOVE',
      clientIp: 'Swasthya Citizen Web',
      statusCode: '200 OK',
      details: 'Deleted profile photo from private storage bucket.',
      sigVerified: true,
    });
    showToast('Profile photo removed. Initials badge restored.');
    return { success: true };
  };

  // Active Tab Renderer
  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            patient={patient}
            records={records}
            vaccines={vaccines}
            delegations={delegations}
            appointments={appointments}
            auditLogs={auditLogs}
            isLoadingData={isLoadingData}
            dataError={dataError}
            onRetryLoad={() => activeUser && hydrateUserSession(activeUser)}
            isMobileShell={viewMode === 'mobile'}
            onNavigateTab={(tab) => handleSelectNavTab(tab)}
            onSelectRecord={(rec) => handleOpenRecordDetail(rec)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenDicomViewer={(rec) => handleOpenDicomViewer(rec)}
            onOpenProfilePhoto={() =>
              setPhotoModalState({
                isOpen: true,
                mode: patient.avatarUrl ? 'view' : 'upload',
              })
            }
            currentLang={currentLang}
          />
        );
      case 'medical-records':
        if (selectedRecordForDedicatedView) {
          return (
            <RecordDetailsView
              record={selectedRecordForDedicatedView}
              patient={patient}
              currentLang={currentLang}
              onBack={handleBackFromRecordDetails}
              onShare={handleShareRecord}
              onDelete={(id, policy) => {
                handleDeleteRecord(id, policy);
                setSelectedRecordForDedicatedView(null);
              }}
              onUpdateMetadata={handleUpdateRecordMetadata}
            />
          );
        }
        return (
          <MedicalRecordsView
            records={records}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={recordCategoryFilter}
            onSelectCategory={setRecordCategoryFilter}
            sortBy={recordSortBy}
            onSortChange={setRecordSortBy}
            recentOnly={recordRecentOnly}
            onRecentOnlyChange={setRecordRecentOnly}
            onSelectRecord={(rec) => handleOpenRecordDetail(rec)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenDicomViewer={(rec) => handleOpenDicomViewer(rec)}
            onShareRecord={handleShareRecord}
            currentLang={currentLang}
          />
        );
      case 'vaccination-wallet':
        return (
          <VaccinationWalletView
            patient={patient}
            vaccines={vaccines}
            onAddVaccine={handleAddVaccine}
            onDeleteVaccine={handleDeleteVaccine}
            isMobileShell={viewMode === 'mobile'}
            onNavigateTab={(tab) => handleSelectNavTab(tab as NavTab)}
            currentLang={currentLang}
          />
        );
      case 'reminders-and-appointments':
        return (
          <RemindersScheduleView
            patient={patient}
            appointments={appointments}
            vaccines={vaccines}
            onAddAppointment={handleAddAppointment}
            onToggleAppointmentStatus={handleToggleAppointmentStatus}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateNotificationPrefs={handleUpdateNotificationPrefs}
            isMobileShell={viewMode === 'mobile'}
            onOpenLogDose={() => setIsLogVaccineModalOpen(true)}
            currentLang={currentLang}
          />
        );
      case 'secure-sharing':
        return (
          <SecureSharingView
            delegations={delegations}
            auditLogs={auditLogs}
            onRevokeDelegation={handleRevokeDelegation}
            onAddDelegation={handleAddDelegation}
            currentLang={currentLang}
            records={records}
            patient={patient}
            onAddAuditLog={(log) =>
              recordAuditEvent({
                title: log.title,
                actor: log.actor,
                actionType: log.actionType || 'SHARE_VERIFIED',
                clientIp: log.clientIp,
                statusCode: log.statusCode,
                details: log.details,
                sigVerified: log.sigVerified,
                nonce: log.nonce,
              })
            }
            initialRecordId={selectedRecordForShare?.id}
          />
        );
      case 'prescription-assistant':
        return (
          <PrescriptionAssistantView
            currentLang={currentLang}
            onNavigateToFindMedicine={(name, sys) => {
              setFindMedicineQuery(name);
              setFindMedicineSystem(sys);
              setSelectedMedicineForDedicatedView(null);
              setSelectedUserMedicineForDedicatedView(null);
              setCurrentTab('find-medicines');
            }}
            onNavigateToAlternatives={(name, _sys) => {
              const matched = INDIAN_MEDICINE_CATALOG.find(
                (m) =>
                  m.name.toLowerCase().includes(name.toLowerCase()) ||
                  m.genericOrActiveSalt.toLowerCase().includes(name.toLowerCase())
              );
              if (matched) {
                setSelectedMedicineForAlternatives(matched);
              }
              setCurrentTab('medicine-alternatives');
            }}
            onAddPrescriptionRecord={(rec) => handleAddRecord(rec)}
            onSaveExtractedMedicines={handleSaveExtractedMedicines}
          />
        );
      case 'find-medicines':
        if (selectedMedicineForDedicatedView) {
          return (
            <MedicineDetailsView
              medicine={selectedMedicineForDedicatedView}
              userMedicine={selectedUserMedicineForDedicatedView}
              currentLang={currentLang}
              onBack={handleBackFromMedicineDetails}
              onViewOriginalPrescription={(recordId) => {
                const rec =
                  records.find((r) => r.id === recordId) ||
                  records.find((r) => r.category === 'prescription');
                if (rec) {
                  setSelectedRecordForDedicatedView(rec);
                  setCurrentTab('medical-records');
                } else {
                  showToast('No linked prescription record found in locker.');
                }
              }}
              onFindAlternatives={(med) => {
                setSelectedMedicineForAlternatives(med);
                setCurrentTab('medicine-alternatives');
              }}
              onSaveToMyMedicines={(med) => {
                handleAddUserMedicine({
                  catalogMedicineId: med.id,
                  name: med.name,
                  system: med.system,
                  genericOrActiveSalt: med.genericOrActiveSalt,
                  dosageForm: med.dosageForm,
                  strengthOrPotency: med.strengthOrPotency,
                  manufacturer: med.manufacturer,
                  instructions: med.prescriptionInstructions || med.directions,
                  isActive: true,
                });
              }}
            />
          );
        }
        return (
          <MedicineSearchView
            currentLang={currentLang}
            userMedicines={userMedicines}
            onAddUserMedicine={handleAddUserMedicine}
            onToggleUserMedicineActive={handleToggleUserMedicineActive}
            onDeleteUserMedicine={handleDeleteUserMedicine}
            initialQuery={findMedicineQuery}
            initialSystem={findMedicineSystem}
            onSearchChange={setFindMedicineQuery}
            onSystemChange={setFindMedicineSystem}
            filterPrescribedOnly={medicinePrescribedOnly}
            onFilterPrescribedOnlyChange={setMedicinePrescribedOnly}
            filterRecentOnly={medicineRecentOnly}
            onFilterRecentOnlyChange={setMedicineRecentOnly}
            onSelectMedicine={handleOpenMedicineDetail}
            onSelectFindAlternatives={(med) => {
              setSelectedMedicineForAlternatives(med);
              setCurrentTab('medicine-alternatives');
            }}
            onOpenPrescriptionScanner={() => setCurrentTab('prescription-assistant')}
          />
        );
      case 'medicine-alternatives':
        return (
          <MedicineAlternativesView
            currentLang={currentLang}
            selectedMedicine={selectedMedicineForAlternatives}
            onSelectAnotherMedicine={(med) => setSelectedMedicineForAlternatives(med)}
          />
        );
      case 'qr-sharing':
        return (
          <FullScreenQrShareView
            records={records}
            patient={patient}
            currentLang={currentLang}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onPreviewRecipientView={(shareUrl, scopeName, recs, pinCode) => {
              setRecipientPreviewData({
                isOpen: true,
                shareUrl,
                scopeName,
                records: recs,
                pinCode,
              });
            }}
          />
        );
      case 'document-verification':
        return <DocumentVerificationView records={records} patient={patient} currentLang={currentLang} />;
      case 'security-and-audit':
        return <SecurityAuditView auditLogs={auditLogs} currentLang={currentLang} />;
      case 'settings':
        return (
          <SettingsView
            patient={patient}
            allRecords={records}
            onRestoreRecords={(restored) => {
              restored.forEach((r) => handleAddRecord(r));
            }}
            onUpdateProfile={handleUpdateProfile}
            onOpenProfilePhotoModal={(mode) => setPhotoModalState({ isOpen: true, mode })}
            biometricUnlockEnabled={biometricUnlockEnabled}
            onToggleBiometricUnlock={(enabled) => setBiometricUnlockEnabled(enabled)}
            onTestBiometricChallenge={() => {
              setBiometricChallenge({
                isOpen: true,
                title: currentLang === 'hi' ? 'बायोमेट्रिक अनलॉक का परीक्षण' : 'Test Biometric Hardware Unlock',
                subtitle:
                  currentLang === 'hi'
                    ? 'फिंगरप्रिंट या फेस आईडी की जांच करने के लिए कृपया सेंसर छुएं।'
                    : 'Testing device hardware sensor attestation for application and record protection.',
                enforceMode: 'app_unlock',
                onSuccessAction: () => {
                  showToast(t.authSuccessToast);
                },
              });
            }}
            currentLang={currentLang}
            onSelectLang={handleSelectLang}
          />
        );
      default:
        return null;
    }
  };

  if (isBootstrappingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-700 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm animate-pulse">
          <span className="material-symbols-outlined text-[28px]">health_and_safety</span>
        </div>
        <div className="font-bold text-base text-slate-900">Swasthya Wallet</div>
        <div className="text-xs text-slate-500">Digital Health Locker for Citizens • Verifying session...</div>
      </div>
    );
  }

  if (currentAuthScreen === 'landing') {
    return (
      <>
        <LandingPageView
          onGoToLogin={() => setCurrentAuthScreen('login')}
          onGoToRegister={() => setCurrentAuthScreen('register')}
          currentLang={currentLang}
          onSelectLang={handleSelectLang}
        />
        {toastMessage && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  if (currentAuthScreen === 'login') {
    return (
      <>
        <PatientLoginView
          onSuccessLogin={async (targetUser, userAccount) => {
            setCurrentAuthScreen(null);
            if (userAccount) {
              await hydrateUserSession(userAccount);
            }
            showToast(`Welcome back, ${targetUser || userAccount?.fullName || 'Citizen'}! Health locker unlocked.`);
          }}
          onNavigate={(s) => setCurrentAuthScreen(s)}
          onReturnToPortal={() => setCurrentAuthScreen('landing')}
          currentLang={currentLang}
          onSelectLang={handleSelectLang}
        />
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  if (currentAuthScreen === 'register') {
    return (
      <>
        <PatientRegistrationView
          onSuccessRegister={async (userData) => {
            linkGoogleSignInIdentity(null);
            setCurrentAuthScreen(null);
            await hydrateUserSession(userData);
            showToast(`Swasthya Wallet provisioned for ${userData.fullName}. Welcome!`);
          }}
          onNavigate={(s) => setCurrentAuthScreen(s)}
          onReturnToPortal={() => setCurrentAuthScreen('landing')}
          currentLang={currentLang}
          onSelectLang={handleSelectLang}
        />
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  if (currentAuthScreen === 'recovery') {
    return (
      <>
        <PasswordRecoveryView
          initialResetStep={passwordRecoveryRedirectMode}
          onNavigate={(s) => {
            setPasswordRecoveryRedirectMode(false);
            setCurrentAuthScreen(s);
          }}
          onReturnToPortal={() => {
            setPasswordRecoveryRedirectMode(false);
            setCurrentAuthScreen('landing');
          }}
          currentLang={currentLang}
          onSelectLang={handleSelectLang}
        />
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fadeIn">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100">
      {/* Universal Topmost Header & Nav */}
      <Header
        patient={patient}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadNotifCount}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenAuthGate={() => setCurrentAuthScreen('login')}
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
        onLogout={handleLogout}
        onOpenStorageSettings={() => handleSelectNavTab('settings')}
        onOpenProfileSettings={() => handleSelectNavTab('settings')}
      />

      {/* Main Container */}
      {viewMode === 'desktop' ? (
        <div className="flex flex-1 w-full pt-4 lg:pt-24 min-h-screen">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectNavTab}
            patient={patient}
            onOpenAuthGate={() => setCurrentAuthScreen('login')}
            currentLang={currentLang}
            onLogout={handleLogout}
          />
          <main className="flex-1 w-full lg:pl-72 px-4 sm:px-6 lg:px-8 pb-16">
            <div className="max-w-7xl mx-auto w-full">{renderActiveView()}</div>
          </main>
        </div>
      ) : (
        <div className="flex-1 w-full pt-4 lg:pt-24 pb-20 flex flex-col items-center justify-start px-2 sm:px-4 bg-slate-200/60">
          <div className="w-full max-w-[430px] bg-slate-50 rounded-[36px] shadow-2xl border-4 border-slate-900 flex flex-col overflow-hidden min-h-[844px] relative">
            <div className="w-full bg-slate-50 pt-3 pb-2 flex items-center justify-center relative select-none">
              <div className="w-24 h-4 bg-slate-900 rounded-full"></div>
            </div>

            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 leading-tight">{t.appName}</div>
                  <div className="text-[10px] text-blue-700 font-medium leading-snug">
                    Digital Health Locker for Citizens
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium shrink-0">
                {patient.synthMrn || patient.mrn}
              </span>
            </div>

            <div className="flex-1 w-full px-4 pt-3 pb-24 overflow-y-auto">{renderActiveView()}</div>

            <MobileNav
              currentTab={currentTab}
              onSelectTab={handleSelectNavTab}
              currentLang={currentLang}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar for small screens when in desktop layout mode */}
      <div className="lg:hidden">
        {viewMode === 'desktop' && (
          <MobileNav
            currentTab={currentTab}
            onSelectTab={handleSelectNavTab}
            currentLang={currentLang}
          />
        )}
      </div>

      {/* Record Detail Modal */}
      {selectedRecordForDetail && (
        <RecordDetailModal
          record={selectedRecordForDetail}
          patient={patient}
          onClose={() => setSelectedRecordForDetail(null)}
          onDeleteRecord={handleDeleteRecord}
          onUpdateMetadata={handleUpdateRecordMetadata}
          onShareRecord={handleShareRecord}
          currentLang={currentLang}
        />
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <UploadDocumentModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAddRecord={handleAddRecord}
          currentLang={currentLang}
        />
      )}

      {/* Log Vaccine Modal */}
      <LogVaccineModal
        isOpen={isLogVaccineModalOpen}
        onClose={() => setIsLogVaccineModalOpen(false)}
        patient={patient}
        onAddVaccine={handleAddVaccine}
        onSuccess={(vax) => showToast(`${vax} certificate added to CoWIN wallet.`)}
        currentLang={currentLang}
      />

      {/* DICOM PACS Radiology Viewer Modal */}
      {selectedRecordForDicom && (
        <DicomViewerModal
          record={selectedRecordForDicom}
          patient={patient}
          onClose={() => setSelectedRecordForDicom(null)}
        />
      )}

      {/* Notifications Drawer Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={async () => {
            if (isSupabaseConfigured() && activeUser) {
              await markAllNotificationsRead(activeUser.id);
            }
            setNotifications((prev) => {
              const next = prev.map((n) => ({ ...n, read: true }));
              persistLocalMirror({ notifications: next });
              return next;
            });
          }}
          onClearAll={() => {
            setNotifications([]);
            persistLocalMirror({ notifications: [] });
            setIsNotificationsOpen(false);
            showToast('Notifications cleared.');
          }}
          currentLang={currentLang}
        />
      )}

      {/* Profile Photo Upload / Crop / Lightbox / Remove Modal */}
      <ProfilePhotoManagerModal
        isOpen={photoModalState.isOpen}
        initialMode={photoModalState.mode}
        patientName={patient.name}
        currentAvatarUrl={patient.avatarUrl}
        onClose={() => setPhotoModalState((prev) => ({ ...prev, isOpen: false }))}
        onUploadConfirmed={handleProfilePhotoUploadConfirmed}
        onRemoveConfirmed={handleProfilePhotoRemoveConfirmed}
      />

      {/* Biometric Hardware Challenge Modal */}
      <BiometricChallengeModal
        isOpen={biometricChallenge.isOpen}
        onClose={() => setBiometricChallenge((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          const action = biometricChallenge.onSuccessAction;
          setBiometricChallenge((prev) => ({ ...prev, isOpen: false }));
          action?.();
        }}
        title={biometricChallenge.title}
        subtitle={biometricChallenge.subtitle}
        recordTitle={biometricChallenge.recordTitle}
        enforceMode={biometricChallenge.enforceMode}
        currentLang={currentLang}
      />

      {/* Recipient Doctor Access Verification Portal */}
      {recipientPreviewData.isOpen && (
        <RecipientVerificationView
          patientName={patient.name}
          patient={patient}
          expectedPin={recipientPreviewData.pinCode}
          scopeName={recipientPreviewData.scopeName}
          records={recipientPreviewData.records.length > 0 ? recipientPreviewData.records : records}
          onClose={() => setRecipientPreviewData((prev) => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
