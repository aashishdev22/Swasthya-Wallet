/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  initialPatient,
  initialMedicalRecords,
  initialVaccines,
  initialActiveDelegations,
  initialAuditEvents,
  MedicalRecord,
  ActiveDelegation,
} from './data/mockData.ts';
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
import { AuthScreenType } from './components/auth/AuthHeader.tsx';
import { PatientLoginView } from './components/auth/PatientLoginView.tsx';
import { PatientRegistrationView } from './components/auth/PatientRegistrationView.tsx';
import { PasswordRecoveryView } from './components/auth/PasswordRecoveryView.tsx';
import { BiometricChallengeModal } from './components/BiometricChallengeModal.tsx';
import { LandingPageView } from './components/LandingPageView.tsx';
import { getCurrentSessionUser, destroySession } from './utils/auth.ts';
import { FullScreenQrShareView } from './components/FullScreenQrShareView.tsx';
import { RecipientVerificationView } from './components/RecipientVerificationView.tsx';
import { PrescriptionAssistantView } from './components/PrescriptionAssistantView.tsx';
import { MedicineSearchView } from './components/MedicineSearchView.tsx';
import { MedicineAlternativesView } from './components/MedicineAlternativesView.tsx';
import { RecordDetailsView } from './components/RecordDetailsView.tsx';
import { MedicineDetailsView } from './components/MedicineDetailsView.tsx';
import { syncEngine } from './utils/syncEngine.ts';
import { localVaultDB } from './utils/indexedDb.ts';
import { linkGoogleSignInIdentity } from './utils/googleDrive.ts';
import { INDIAN_MEDICINE_CATALOG, MedicineItem } from './data/medicineDatabase.ts';

const DELETED_RECORDS_KEY = 'swasthya_deleted_record_ids';

function getDeletedRecordIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_RECORDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addDeletedRecordId(id: string): void {
  try {
    const current = getDeletedRecordIds();
    current.add(id);
    localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

export default function App() {
  const [patient, setPatient] = useState(initialPatient);
  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    const deleted = getDeletedRecordIds();
    return initialMedicalRecords.filter((r) => !deleted.has(r.id));
  });
  const [vaccines] = useState(initialVaccines);
  const [delegations, setDelegations] = useState<ActiveDelegation[]>(initialActiveDelegations);
  const [auditLogs, setAuditLogs] = useState(initialAuditEvents);

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentAuthScreen, setCurrentAuthScreen] = useState<AuthScreenType | null>(() => {
    const user = getCurrentSessionUser();
    return user ? null : 'landing';
  });

  // Centralized 12-Language Support State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(getStoredLanguage());
  const t = getTranslation(currentLang);

  const handleSelectLang = (newLang: SupportedLanguage) => {
    setCurrentLang(newLang);
    setStoredLanguage(newLang);
    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === newLang);
    showToast(`Language: ${langObj?.nativeName || newLang} (${langObj?.name})`);
  };

  const handleLogout = () => {
    destroySession();
    linkGoogleSignInIdentity(null);
    setCurrentAuthScreen('landing');
    showToast('Logged out securely from Swasthya Wallet.');
  };

  // Biometric Unlock hardware authentication state
  const [biometricUnlockEnabled, setBiometricUnlockEnabled] = useState<boolean>(true);
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
  const [selectedMedicineForAlternatives, setSelectedMedicineForAlternatives] = useState<MedicineItem | null>(
    INDIAN_MEDICINE_CATALOG[0]
  );
  const [findMedicineQuery, setFindMedicineQuery] = useState<string>('');
  const [findMedicineSystem, setFindMedicineSystem] = useState<string>('all');
  const [recipientPreviewData, setRecipientPreviewData] = useState<{
    isOpen: boolean;
    shareUrl: string;
    scopeName: string;
    records: MedicalRecord[];
  }>({
    isOpen: false,
    shareUrl: '',
    scopeName: 'complete',
    records: [],
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dedicated Detail Page States + Preserved Scroll Position & Filters
  const [selectedRecordForDedicatedView, setSelectedRecordForDedicatedView] = useState<MedicalRecord | null>(null);
  const [selectedMedicineForDedicatedView, setSelectedMedicineForDedicatedView] = useState<MedicineItem | null>(null);
  const [recordCategoryFilter, setRecordCategoryFilter] = useState<string>('all');
  const [recordSortBy, setRecordSortBy] = useState<'date_desc' | 'date_asc' | 'alpha'>('date_desc');
  const [recordRecentOnly, setRecordRecentOnly] = useState<boolean>(false);
  const [medicinePrescribedOnly, setMedicinePrescribedOnly] = useState<boolean>(false);
  const [medicineRecentOnly, setMedicineRecentOnly] = useState<boolean>(false);
  const savedScrollYRef = useRef<number>(0);

  // Hydrate encrypted records from local IndexedDB vault on startup (or seed initial vault)
  useEffect(() => {
    const deleted = getDeletedRecordIds();
    localVaultDB
      .getHealthRecords()
      .then(async (persisted) => {
        if (persisted && persisted.length > 0) {
          const mergedMap = new Map<string, MedicalRecord>();
          for (const rec of initialMedicalRecords) {
            if (!deleted.has(rec.id)) mergedMap.set(rec.id, rec);
          }
          for (const rec of persisted) {
            if (rec?.id && !deleted.has(rec.id)) mergedMap.set(rec.id, rec);
          }
          setRecords(Array.from(mergedMap.values()));
        } else {
          for (const rec of initialMedicalRecords) {
            if (!deleted.has(rec.id)) {
              await localVaultDB.saveHealthRecord(rec, 'synced');
            }
          }
        }
        syncEngine.init();
      })
      .catch(() => {
        syncEngine.init();
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Protected Record Access Interceptor: opens dedicated Record Details page
  const handleOpenRecordDetail = (record: MedicalRecord) => {
    const openRecord = () => {
      savedScrollYRef.current = window.scrollY;
      setSelectedRecordForDedicatedView(record);
      setCurrentTab('medical-records');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      showToast(`Viewing details for ${record.title}.`);
    };

    if (biometricUnlockEnabled) {
      setBiometricChallenge({
        isOpen: true,
        title: currentLang === 'hi' ? 'बायोमेट्रिक सत्यापन आवश्यक' : 'Biometric Record Verification Challenge',
        subtitle:
          currentLang === 'hi'
            ? `गोपनीय स्वास्थ्य रिपोर्ट देखने के लिए कृपया सेंसर पर उंगली रखें या फेस अनलॉक करें (${record.title})`
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

  const handleOpenMedicineDetail = (med: MedicineItem) => {
    savedScrollYRef.current = window.scrollY;
    setSelectedMedicineForDedicatedView(med);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleBackFromMedicineDetails = () => {
    setSelectedMedicineForDedicatedView(null);
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
            : `Radiological studies contain protected health information. Authenticate with your device sensor to view full scan series.`,
        recordTitle: `${record.title} (${record.code})`,
        enforceMode: 'record_view',
        onSuccessAction: () => {
          setSelectedRecordForDicom(record);
          showToast(`Biometric verified. Scan viewer authorized for ${record.title}.`);
        },
      });
    } else {
      setSelectedRecordForDicom(record);
    }
  };

  const handleAddRecord = async (newRec: MedicalRecord) => {
    setRecords((prev) => [newRec, ...prev]);
    const res = await syncEngine.autoSaveRecord(newRec, patient.name);
    if (res.cloudSuccess) {
      setRecords((prev) => prev.map((r) => (r.id === newRec.id ? res.versionedRecord : r)));
      showToast(`"${newRec.title}" saved on device & synced to cloud.`);
    } else {
      showToast(`"${newRec.title}" encrypted & saved on device.`);
    }
  };

  const handleDeleteRecord = (id: string, policy: 'delete_everywhere' | 'local_only' | 'archive' = 'delete_everywhere') => {
    addDeletedRecordId(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    syncEngine.autoDeleteRecord(id, policy);
    showToast(`Record deleted applying policy: ${policy.replace('_', ' ')}.`);
  };

  const handleUpdateRecordMetadata = (id: string, newTitle: string, newCategory: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated: MedicalRecord = {
            ...r,
            title: newTitle,
            category: newCategory as any,
            version: (r.version || 1) + 1,
            updatedAt: Date.now(),
          };
          if (selectedRecordForDedicatedView?.id === id) {
            setSelectedRecordForDedicatedView(updated);
          }
          syncEngine.autoSaveRecord(updated, patient.name);
          return updated;
        }
        return r;
      })
    );
  };

  const handleRestoreRecordsFromDrive = (restored: MedicalRecord[]) => {
    setRecords((prev) => {
      const merged = new Map<string, MedicalRecord>();
      prev.forEach((r) => merged.set(r.id, r));
      restored.forEach((r) => {
        if (r?.id) merged.set(r.id, r);
      });
      return Array.from(merged.values());
    });
  };

  const handleRevokeDelegation = (id: string) => {
    setDelegations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, revoked: true } : d))
    );
  };

  const handleAddDelegation = (newDel: ActiveDelegation) => {
    setDelegations((prev) => [newDel, ...prev]);
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
    }
    setCurrentTab(tab);
  };

  // Content for the active tab
  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            patient={patient}
            records={records}
            vaccines={vaccines}
            delegations={delegations}
            auditLogs={auditLogs}
            isMobileShell={viewMode === 'mobile'}
            onNavigateTab={(tab) => handleSelectNavTab(tab)}
            onSelectRecord={(rec) => handleOpenRecordDetail(rec)}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenDicomViewer={(rec) => handleOpenDicomViewer(rec)}
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
            isMobileShell={viewMode === 'mobile'}
            onNavigateTab={(tab) => {
              setSelectedRecordForDedicatedView(null);
              setSelectedMedicineForDedicatedView(null);
              setCurrentTab(tab as any);
            }}
            onOpenScanPaperModal={() => showToast('CoWIN / Digital QR scanning active')}
            currentLang={currentLang}
          />
        );
      case 'reminders-and-appointments':
        return (
          <RemindersScheduleView
            patient={patient}
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
            onAddAuditLog={(log) => setAuditLogs((prev) => [log, ...prev])}
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
            onAddPrescriptionRecord={handleAddRecord}
          />
        );
      case 'find-medicines':
        if (selectedMedicineForDedicatedView) {
          return (
            <MedicineDetailsView
              medicine={selectedMedicineForDedicatedView}
              currentLang={currentLang}
              onBack={handleBackFromMedicineDetails}
              onViewOriginalPrescription={(recordId) => {
                const rec = records.find((r) => r.id === recordId) || records.find((r) => r.category === 'prescription');
                if (rec) {
                  setSelectedRecordForDedicatedView(rec);
                  setCurrentTab('medical-records');
                } else {
                  showToast('Prescription record loaded.');
                }
              }}
              onFindAlternatives={(med) => {
                setSelectedMedicineForAlternatives(med);
                setCurrentTab('medicine-alternatives');
              }}
            />
          );
        }
        return (
          <MedicineSearchView
            currentLang={currentLang}
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
            onPreviewRecipientView={(shareUrl, scopeName, recs) => {
              setRecipientPreviewData({
                isOpen: true,
                shareUrl,
                scopeName,
                records: recs,
              });
            }}
          />
        );
      case 'document-verification':
        return <DocumentVerificationView currentLang={currentLang} />;
      case 'security-and-audit':
        return <SecurityAuditView auditLogs={auditLogs} currentLang={currentLang} />;
      case 'settings':
        return (
          <SettingsView
            patient={patient}
            allRecords={records}
            onRestoreRecords={handleRestoreRecordsFromDrive}
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

  if (currentAuthScreen === 'landing') {
    return (
      <>
        <LandingPageView
          onGoToLogin={() => setCurrentAuthScreen('login')}
          onGoToRegister={() => setCurrentAuthScreen('register')}
          onDemoLogin={() => {
            linkGoogleSignInIdentity(null);
            setCurrentAuthScreen(null);
            showToast('Logged into Swasthya Wallet Demo as Aarav Sharma.');
          }}
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
          onSuccessLogin={(targetUser, userAccount) => {
            setCurrentAuthScreen(null);
            if (userAccount) {
              setPatient((prev) => ({
                ...prev,
                name: userAccount.fullName,
                synthMrn: userAccount.abhaId || prev.synthMrn,
                dob: userAccount.dob,
                email: userAccount.email || prev.email,
              }));
            }
            showToast(`Welcome back, ${targetUser || patient.name}! Health locker unlocked.`);
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
          onSuccessRegister={(userData) => {
            linkGoogleSignInIdentity(null);
            setCurrentAuthScreen(null);
            setPatient((prev) => ({
              ...prev,
              name: userData.name,
              email: userData.email,
            }));
            showToast(`Health ID generated for ${userData.name}. Welcome!`);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100">
      {/* Universal Topmost Header & Nav */}
      <Header
        patient={patient}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenAuthGate={() => setCurrentAuthScreen('login')}
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
        onLogout={handleLogout}
        onOpenStorageSettings={() => handleSelectNavTab('settings')}
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
            <div className="max-w-7xl mx-auto w-full">
              {renderActiveView()}
            </div>
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
                {patient.synthMrn}
              </span>
            </div>

            <div className="flex-1 w-full px-4 pt-3 pb-24 overflow-y-auto">
              {renderActiveView()}
            </div>

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
        onSuccess={(vax) => showToast(`${vax} certificate added to CoWIN wallet.`)}
        currentLang={currentLang}
      />

      {/* DICOM PACS Radiology Viewer Modal */}
      {selectedRecordForDicom && (
        <DicomViewerModal
          record={selectedRecordForDicom}
          onClose={() => setSelectedRecordForDicom(null)}
        />
      )}

      {/* Notifications Drawer Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onClearAll={() => {
            setIsNotificationsOpen(false);
            showToast('All notifications marked as read.');
          }}
          currentLang={currentLang}
        />
      )}

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
