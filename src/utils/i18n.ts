/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SupportedLanguage =
  | 'en' // English
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'or' // Odia
  | 'ur'; // Urdu

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'All India' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'North / Central India' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'West Bengal & Tripura' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Maharashtra' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Tamil Nadu & Puducherry' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra Pradesh & Telangana' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Gujarat' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'Kerala' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'Punjab & Chandigarh' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'Odisha' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'All India' },
];

export const STORAGE_KEY_LANG = 'swasthya_lang_pref';

export function getStoredLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // ignore
  }
  return 'en';
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  } catch {
    // ignore
  }
}

// Indian Date formatting (DD/MM/YYYY)
export function formatIndianDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  try {
    // Handle already DD/MM/YYYY
    if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // If unparseable string, return as is
      return String(dateStr);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
}

// Indian Currency formatting (₹ INR)
export function formatIndianCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

// Indian Time in IST
export function formatIndianTime(dateStr?: string | Date): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) return 'IST';
    return (
      d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST'
    );
  } catch {
    return 'IST';
  }
}

// Indian Number format (1,00,000)
export function formatIndianNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

export interface TranslationDictionary {
  // App Header & Branding
  appName: string;
  appSubtitle: string;
  searchPlaceholder: string;
  authGate: string;
  notifications: string;
  verifiedBadge: string;
  desktopView: string;
  mobileView: string;
  selectLanguage: string;
  changeLanguage: string;

  // Navigation
  dashboard: string;
  medicalRecords: string;
  vaccinationWallet: string;
  remindersSchedule: string;
  secureSharing: string;
  documentVerification: string;
  securityAudit: string;
  settings: string;

  // Common Buttons & Actions
  addRecord: string;
  uploadFile: string;
  viewDetails: string;
  downloadPdf: string;
  share: string;
  verify: string;
  cancel: string;
  save: string;
  close: string;
  delete: string;
  filter: string;
  all: string;
  back: string;
  search: string;
  clear: string;
  copy: string;
  copied: string;
  success: string;
  error: string;

  // Patient Card & Metrics
  patientId: string;
  abhaId: string;
  age: string;
  years: string;
  bloodGroup: string;
  emergencyContact: string;
  primaryHospital: string;
  primaryDoctor: string;
  insuranceCard: string;
  activeRecordsCount: string;
  vaccinesGivenCount: string;
  upcomingVisitsCount: string;
  activeSharesCount: string;

  // Quick Action Buttons
  quickAddRecord: string;
  quickViewVaccines: string;
  quickShareDoctor: string;
  quickVerifyReport: string;

  // Medical Records View
  recordsTitle: string;
  recordsSubtitle: string;
  allCategories: string;
  labTest: string;
  imagingXray: string;
  doctorNotes: string;
  prescriptions: string;
  dischargeSummary: string;
  consultation: string;
  other: string;
  testName: string;
  doctorHospital: string;
  reportDate: string;
  integritySeal: string;
  tamperProof: string;
  viewImage: string;
  dicomViewer: string;

  // Vaccination Wallet
  vaccinesTitle: string;
  vaccinesSubtitle: string;
  completedDoses: string;
  upcomingVaccine: string;
  seasonalFlu: string;
  certificateNo: string;
  beneficiaryName: string;
  vaccineDose: string;
  administeredBy: string;
  vaccinationCenter: string;
  logNewVaccine: string;
  cowinVerified: string;

  // Reminders & Visits
  remindersTitle: string;
  remindersSubtitle: string;
  scheduledVisits: string;
  medicineTimings: string;
  consultationFee: string;
  clinicHospital: string;
  bookVisit: string;
  markDone: string;
  snooze: string;

  // Secure Sharing
  sharingTitle: string;
  sharingSubtitle: string;
  shareWithDoctor: string;
  shareWithFamily: string;
  accessDuration: string;
  oneHour: string;
  twentyFourHours: string;
  sevenDays: string;
  thirtyDays: string;
  generateAccessPin: string;
  activeShares: string;
  revokeAccess: string;
  accessCode: string;

  // Document Verification
  verificationTitle: string;
  verificationSubtitle: string;
  verifyInstructions: string;
  checkTamperSeal: string;
  documentHash: string;
  verificationSuccess: string;
  authenticReport: string;

  // Security & Audit
  auditTitle: string;
  auditSubtitle: string;
  activityHistory: string;
  deviceLocation: string;
  tamperProtection: string;
  actionDetails: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  languageSection: string;
  biometricSection: string;
  biometricToggleLabel: string;
  biometricToggleDesc: string;
  biometricEnforced: string;
  biometricOptional: string;
  testBiometric: string;
  abhaSection: string;
  abhaDesc: string;
  emergencyDetails: string;
  notificationPreferences: string;
  smsAlerts: string;
  whatsappAlerts: string;

  // Biometric Challenge Modal
  biometricPromptTitle: string;
  biometricPromptSubtitle: string;
  touchSensor: string;
  faceUnlock: string;
  securityKey: string;
  scanSensorButton: string;
  passphraseFallback: string;
  authSuccessToast: string;

  // Auth Gate
  signInTitle: string;
  signInSubtitle: string;
  mobileOrAbha: string;
  enterPassword: string;
  loginButton: string;
  createAccount: string;
  forgotPassword: string;
  simpleTechnologyNote: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'Swasthya Wallet',
    appSubtitle: 'Digital Health Locker for Citizens',
    searchPlaceholder: 'Search tests, doctors, medicines, vaccines...',
    authGate: 'Auth Gate / Sign In',
    notifications: 'Notifications',
    verifiedBadge: 'Verified & Secure',
    desktopView: 'Desktop',
    mobileView: 'Mobile Tab',
    selectLanguage: 'Select Language',
    changeLanguage: 'Language',

    dashboard: 'Home Dashboard',
    medicalRecords: 'Health Records',
    vaccinationWallet: 'Vaccine Certificates',
    remindersSchedule: 'Appointments & Medicines',
    secureSharing: 'Share with Doctor',
    documentVerification: 'Verify Document',
    securityAudit: 'Security & History',
    settings: 'Settings',

    addRecord: 'Add Record',
    uploadFile: 'Upload Report (PDF/Image)',
    viewDetails: 'View Details',
    downloadPdf: 'Download PDF',
    share: 'Share',
    verify: 'Verify',
    cancel: 'Cancel',
    save: 'Save Changes',
    close: 'Close',
    delete: 'Delete',
    filter: 'Filter',
    all: 'All',
    back: 'Back',
    search: 'Search',
    clear: 'Clear',
    copy: 'Copy',
    copied: 'Copied!',
    success: 'Success',
    error: 'Error',

    patientId: 'Health ID',
    abhaId: 'ABHA Number',
    age: 'Age',
    years: 'Years',
    bloodGroup: 'Blood Group',
    emergencyContact: 'Emergency Contact',
    primaryHospital: 'Preferred Hospital',
    primaryDoctor: 'Primary Doctor',
    insuranceCard: 'Health Insurance',
    activeRecordsCount: 'Health Records',
    vaccinesGivenCount: 'Vaccine Doses',
    upcomingVisitsCount: 'Upcoming Visits',
    activeSharesCount: 'Active Shares',

    quickAddRecord: 'Add Health Record',
    quickViewVaccines: 'Vaccine Certificates',
    quickShareDoctor: 'Share with Doctor',
    quickVerifyReport: 'Verify Any Report',

    recordsTitle: 'Digital Health Records',
    recordsSubtitle: 'All your lab reports, prescriptions, and scans in one secure place',
    allCategories: 'All Categories',
    labTest: 'Lab Test / Blood Report',
    imagingXray: 'X-Ray & Scans',
    doctorNotes: 'Doctor Notes',
    prescriptions: 'Prescription',
    dischargeSummary: 'Discharge Summary',
    consultation: 'Doctor Consultation',
    other: 'Other Documents',
    testName: 'Test / Record Name',
    doctorHospital: 'Doctor & Hospital',
    reportDate: 'Report Date',
    integritySeal: 'Digital Seal',
    tamperProof: 'Tamper-Proof & Genuine',
    viewImage: 'View Image',
    dicomViewer: 'Open Medical Scan Viewer',

    vaccinesTitle: 'Vaccination Certificates',
    vaccinesSubtitle: 'Verified vaccination history and universal immunization certificates',
    completedDoses: 'Completed Doses',
    upcomingVaccine: 'Due for Vaccination',
    seasonalFlu: 'Seasonal Preventive',
    certificateNo: 'Certificate Number',
    beneficiaryName: 'Beneficiary Name',
    vaccineDose: 'Vaccine Dose',
    administeredBy: 'Administered By',
    vaccinationCenter: 'Vaccination Center',
    logNewVaccine: 'Add Vaccine Record',
    cowinVerified: 'CoWIN / Digital India Verified',

    remindersTitle: 'Appointments & Medicine Reminders',
    remindersSubtitle: 'Never miss a doctor appointment, lab test, or daily medicine dose',
    scheduledVisits: 'Doctor Appointments',
    medicineTimings: 'Daily Medicine Schedule',
    consultationFee: 'Consultation Fee',
    clinicHospital: 'Clinic / Hospital',
    bookVisit: 'Book New Appointment',
    markDone: 'Mark as Taken',
    snooze: 'Remind Later',

    sharingTitle: 'Share Records with Doctor',
    sharingSubtitle: 'Grant temporary, secure access to your doctor, clinic, or family member',
    shareWithDoctor: 'Share with Doctor / Clinic',
    shareWithFamily: 'Share with Family Member',
    accessDuration: 'Access Validity',
    oneHour: '1 Hour',
    twentyFourHours: '24 Hours',
    sevenDays: '7 Days',
    thirtyDays: '30 Days',
    generateAccessPin: 'Generate Secure PIN & QR',
    activeShares: 'Active Shared Links',
    revokeAccess: 'Revoke Access',
    accessCode: 'Access PIN',

    verificationTitle: 'Verify Health Document',
    verificationSubtitle: 'Check if a lab report, prescription, or vaccine certificate is genuine and unmodified',
    verifyInstructions: 'Upload document or enter QR code to check the tamper-proof digital signature',
    checkTamperSeal: 'Check Authenticity',
    documentHash: 'Digital Signature (SHA-256)',
    verificationSuccess: 'Document Verified: 100% Genuine & Authentic',
    authenticReport: 'Officially certified by authorized medical facility',

    auditTitle: 'Security & Access History',
    auditSubtitle: 'Complete log of who viewed, shared, or downloaded your health records',
    activityHistory: 'Recent Activity',
    deviceLocation: 'Device & Location',
    tamperProtection: 'End-to-End Cryptographic Security',
    actionDetails: 'Activity Details',

    settingsTitle: 'Settings & Security',
    settingsSubtitle: 'Manage your language, biometric security, and health account preferences',
    languageSection: 'App Language (भाषा)',
    biometricSection: 'Biometric Unlock (Fingerprint / Face ID)',
    biometricToggleLabel: 'Biometric Unlock Requirement',
    biometricToggleDesc: 'Require Fingerprint, Face ID, or PIN to open the app or view sensitive health reports',
    biometricEnforced: 'ENFORCED',
    biometricOptional: 'OPTIONAL',
    testBiometric: 'Test Biometric Unlock',
    abhaSection: 'Ayushman Bharat Health Account (ABHA)',
    abhaDesc: 'Your 14-digit national health identity linking all healthcare providers across India',
    emergencyDetails: 'Emergency Medical Information',
    notificationPreferences: 'Alerts & Reminders',
    smsAlerts: 'SMS Notifications',
    whatsappAlerts: 'WhatsApp Reminders',

    biometricPromptTitle: 'Biometric Hardware Authentication',
    biometricPromptSubtitle: 'Please authenticate with your device sensor to verify your identity',
    touchSensor: 'Fingerprint / Touch Sensor',
    faceUnlock: 'Face Unlock',
    securityKey: 'Security Passkey',
    scanSensorButton: 'Scan Sensor / Enter PIN',
    passphraseFallback: 'Use Master Passphrase',
    authSuccessToast: 'Biometric verified successfully.',

    signInTitle: 'Welcome to Swasthya Wallet',
    signInSubtitle: 'Simple and secure digital health locker for every Indian citizen',
    mobileOrAbha: 'Mobile Number or ABHA ID',
    enterPassword: 'Enter Password or OTP',
    loginButton: 'Sign In / Verify OTP',
    createAccount: 'Create New Account',
    forgotPassword: 'Forgot Password?',
    simpleTechnologyNote: 'Built for ease of use across India • Available in 12 Indian languages',
  },

  hi: {
    appName: 'स्वास्थ्य वॉलेट',
    appSubtitle: 'प्रत्येक भारतीय नागरिक के लिए डिजिटल हेल्थ लॉकर',
    searchPlaceholder: 'जांच रिपोर्ट, डॉक्टर, दवाइयां, टीके खोजें...',
    authGate: 'लॉग इन / खाता',
    notifications: 'सूचनाएं',
    verifiedBadge: 'प्रमाणित एवं सुरक्षित',
    desktopView: 'कंप्यूटर व्यू',
    mobileView: 'मोबाइल व्यू',
    selectLanguage: 'भाषा चुनें',
    changeLanguage: 'भाषा',

    dashboard: 'होम डैशबोर्ड',
    medicalRecords: 'स्वास्थ्य रिकॉर्ड',
    vaccinationWallet: 'टीकाकरण प्रमाणपत्र',
    remindersSchedule: 'अपॉइंटमेंट और दवाएं',
    secureSharing: 'डॉक्टर से शेयर करें',
    documentVerification: 'दस्तावेज़ सत्यापन',
    securityAudit: 'सुरक्षा और इतिहास',
    settings: 'सेटिंग्स',

    addRecord: 'रिकॉर्ड जोड़ें',
    uploadFile: 'रिपोर्ट अपलोड करें (PDF/फोटो)',
    viewDetails: 'विवरण देखें',
    downloadPdf: 'PDF डाउनलोड करें',
    share: 'शेयर करें',
    verify: 'सत्यापित करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    close: 'बंद करें',
    delete: 'हटाएं',
    filter: 'फ़िल्टर',
    all: 'सभी',
    back: 'वापस',
    search: 'खोजें',
    clear: 'साफ़ करें',
    copy: 'कॉपी करें',
    copied: 'कॉपी हो गया!',
    success: 'सफल',
    error: 'त्रुटि',

    patientId: 'स्वास्थ्य पहचान',
    abhaId: 'आभा (ABHA) संख्या',
    age: 'आयु',
    years: 'वर्ष',
    bloodGroup: 'रक्त समूह',
    emergencyContact: 'आपातकालीन संपर्क',
    primaryHospital: 'प्राथमिक अस्पताल',
    primaryDoctor: 'मुख्य डॉक्टर',
    insuranceCard: 'स्वास्थ्य बीमा',
    activeRecordsCount: 'कुल स्वास्थ्य रिकॉर्ड',
    vaccinesGivenCount: 'टीके की खुराक',
    upcomingVisitsCount: 'आगामी मुलाकातें',
    activeSharesCount: 'सक्रिय शेयर',

    quickAddRecord: 'नया रिकॉर्ड जोड़ें',
    quickViewVaccines: 'टीकाकरण देखें',
    quickShareDoctor: 'डॉक्टर से साझा करें',
    quickVerifyReport: 'रिपोर्ट जांचें',

    recordsTitle: 'डिजिटल स्वास्थ्य रिकॉर्ड',
    recordsSubtitle: 'आपकी सभी लैब रिपोर्ट, पर्चियां और एक्स-रे एक ही सुरक्षित स्थान पर',
    allCategories: 'सभी श्रेणियां',
    labTest: 'खून / लैब जांच रिपोर्ट',
    imagingXray: 'एक्स-रे और स्कैन',
    doctorNotes: 'डॉक्टर की सलाह',
    prescriptions: 'दवा की पर्ची (प्रिस्क्रिप्शन)',
    dischargeSummary: 'छुट्टी का सारांश (डिस्चार्ज)',
    consultation: 'परामर्श',
    other: 'अन्य दस्तावेज़',
    testName: 'जांच / रिपोर्ट का नाम',
    doctorHospital: 'डॉक्टर और अस्पताल',
    reportDate: 'रिपोर्ट की तारीख',
    integritySeal: 'डिजिटल मुहर',
    tamperProof: 'पूर्णतः प्रामाणिक और सुरक्षित',
    viewImage: 'फोटो देखें',
    dicomViewer: 'एक्स-रे / स्कैन व्यूअर खोलें',

    vaccinesTitle: 'टीकाकरण प्रमाणपत्र',
    vaccinesSubtitle: 'प्रमाणित टीकाकरण इतिहास और राष्ट्रीय प्रतिरक्षण प्रमाणपत्र',
    completedDoses: 'पूर्ण खुराक',
    upcomingVaccine: 'आगामी टीका',
    seasonalFlu: 'मौसमी फ्लू टीका',
    certificateNo: 'प्रमाणपत्र संख्या',
    beneficiaryName: 'लाभार्थी का नाम',
    vaccineDose: 'टीके की खुराक',
    administeredBy: 'टीका लगाने वाले का नाम',
    vaccinationCenter: 'टीकाकरण केंद्र',
    logNewVaccine: 'नया टीका जोड़ें',
    cowinVerified: 'कोविन / डिजिटल इंडिया द्वारा सत्यापित',

    remindersTitle: 'अपॉइंटमेंट और दवा रिमाइंडर',
    remindersSubtitle: 'डॉक्टर की मुलाकात, जांच या रोज़ाना दवा का समय कभी न भूलें',
    scheduledVisits: 'डॉक्टर की अपॉइंटमेंट',
    medicineTimings: 'दवाइयों का समय',
    consultationFee: 'परामर्श शुल्क',
    clinicHospital: 'क्लिनिक / अस्पताल',
    bookVisit: 'नई अपॉइंटमेंट लें',
    markDone: 'दवा ले ली',
    snooze: 'बाद में याद दिलाएं',

    sharingTitle: 'डॉक्टर के साथ रिकॉर्ड साझा करें',
    sharingSubtitle: 'अपने डॉक्टर, क्लिनिक या परिवार को सीमित समय के लिए सुरक्षित पहुंच दें',
    shareWithDoctor: 'डॉक्टर / क्लिनिक से साझा करें',
    shareWithFamily: 'परिवार के सदस्य से साझा करें',
    accessDuration: 'पहुंच की अवधि',
    oneHour: '1 घंटा',
    twentyFourHours: '24 घंटे',
    sevenDays: '7 दिन',
    thirtyDays: '30 दिन',
    generateAccessPin: 'सुरक्षित पिन और क्यूआर बनाएं',
    activeShares: 'सक्रिय साझा लिंक',
    revokeAccess: 'पहुंच समाप्त करें',
    accessCode: 'सुरक्षा पिन',

    verificationTitle: 'स्वास्थ्य दस्तावेज़ सत्यापन',
    verificationSubtitle: 'जांचें कि क्या लैब रिपोर्ट, पर्ची या टीका प्रमाणपत्र असली है और उसमें कोई छेड़छाड़ नहीं हुई है',
    verifyInstructions: 'डिजिटल हस्ताक्षर जांचने के लिए फ़ाइल अपलोड करें या क्यूआर कोड दर्ज करें',
    checkTamperSeal: 'प्रामाणिकता जांचें',
    documentHash: 'डिजिटल हस्ताक्षर (SHA-256)',
    verificationSuccess: 'सत्यापन सफल: दस्तावेज़ 100% असली और सुरक्षित है',
    authenticReport: 'अधिकृत चिकित्सा केंद्र द्वारा डिजिटल रूप से प्रमाणित',

    auditTitle: 'सुरक्षा और गतिविधि इतिहास',
    auditSubtitle: 'आपके स्वास्थ्य रिकॉर्ड को किसने देखा, साझा किया या डाउनलोड किया इसका पूरा विवरण',
    activityHistory: 'हाल की गतिविधियां',
    deviceLocation: 'उपकरण एवं स्थान',
    tamperProtection: 'पूर्ण एन्क्रिप्टेड सुरक्षा',
    actionDetails: 'गतिविधि का विवरण',

    settingsTitle: 'सेटिंग्स और सुरक्षा',
    settingsSubtitle: 'अपनी भाषा, बायोमेट्रिक सुरक्षा और स्वास्थ्य खाता प्राथमिकताओं को प्रबंधित करें',
    languageSection: 'ऐप की भाषा (Language)',
    biometricSection: 'बायोमेट्रिक अनलॉक (फिंगरप्रिंट / फेस आईडी)',
    biometricToggleLabel: 'बायोमेट्रिक लॉक अनिवार्य करें',
    biometricToggleDesc: 'ऐप खोलने या संवेदनशील स्वास्थ्य रिपोर्ट देखने के लिए फिंगरप्रिंट, फेस आईडी या पिन आवश्यक करें',
    biometricEnforced: 'लागू है',
    biometricOptional: 'वैकल्पिक',
    testBiometric: 'बायोमेट्रिक अनलॉक की जांच करें',
    abhaSection: 'आयुष्मान भारत स्वास्थ्य खाता (ABHA)',
    abhaDesc: 'आपकी 14 अंकों की राष्ट्रीय स्वास्थ्य पहचान जो देश भर के अस्पतालों को जोड़ती है',
    emergencyDetails: 'आपातकालीन चिकित्सा जानकारी',
    notificationPreferences: 'सूचना प्राथमिकताएं',
    smsAlerts: 'एसएमएस अलर्ट',
    whatsappAlerts: 'व्हाट्सएप रिमाइंडर',

    biometricPromptTitle: 'बायोमेट्रिक हार्डवेयर प्रमाणीकरण',
    biometricPromptSubtitle: 'अपनी पहचान सत्यापित करने के लिए कृपया सेंसर पर उंगली रखें या फेस अनलॉक करें',
    touchSensor: 'फिंगरप्रिंट सेंसर',
    faceUnlock: 'फेस अनलॉक',
    securityKey: 'सुरक्षा पास-की',
    scanSensorButton: 'सेंसर स्कैन करें / पिन दर्ज करें',
    passphraseFallback: 'मास्टर पासवर्ड का उपयोग करें',
    authSuccessToast: 'बायोमेट्रिक सफलतापूर्वक सत्यापित हुआ।',

    signInTitle: 'स्वास्थ्य वॉलेट में आपका स्वागत है',
    signInSubtitle: 'हर भारतीय नागरिक के लिए सरल, सुगम और सुरक्षित डिजिटल हेल्थ लॉकर',
    mobileOrAbha: 'मोबाइल नंबर या आभा (ABHA) आईडी',
    enterPassword: 'पासवर्ड या ओटीपी दर्ज करें',
    loginButton: 'लॉग इन करें / ओटीपी सत्यापित करें',
    createAccount: 'नया खाता बनाएं',
    forgotPassword: 'पासवर्ड भूल गए?',
    simpleTechnologyNote: 'सभी भारतीयों के लिए सरल तकनीक • 12 भारतीय भाषाओं में उपलब्ध',
  },

  bn: {
    appName: 'স্বাস্থ্য ওয়ালেট',
    appSubtitle: 'প্রত্যেক ভারতীয় নাগরিকের জন্য ডিজিটাল হেলথ লকার',
    searchPlaceholder: 'রিপোর্ট, ডাক্তার, ওষুধ, টিকা খুঁজুন...',
    authGate: 'লগ ইন / অ্যাকাউন্ট',
    notifications: 'বিজ্ঞপ্তি',
    verifiedBadge: 'যাচাইকৃত ও নিরাপদ',
    desktopView: 'ডেস্কটপ',
    mobileView: 'মোবাইল',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    changeLanguage: 'ভাষা',

    dashboard: 'হোম ড্যাশবোর্ড',
    medicalRecords: 'স্বাস্থ্য রেকর্ড',
    vaccinationWallet: 'টিকা সার্টিফিকেট',
    remindersSchedule: 'অ্যাপয়েন্টমেন্ট ও ওষুধ',
    secureSharing: 'ডাক্তারের সাথে শেয়ার',
    documentVerification: 'নথি যাচাইকরণ',
    securityAudit: 'নিরাপত্তা ও ইতিহাস',
    settings: 'সেটিংস',

    addRecord: 'রেকর্ড যোগ করুন',
    uploadFile: 'রিপোর্ট আপলোড করুন',
    viewDetails: 'বিস্তারিত দেখুন',
    downloadPdf: 'PDF ডাউনলোড',
    share: 'শেয়ার করুন',
    verify: 'যাচাই করুন',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ করুন',
    close: 'বন্ধ করুন',
    delete: 'মুছুন',
    filter: 'ফিল্টার',
    all: 'সব',
    back: 'ফিরে যান',
    search: 'অনুসন্ধান',
    clear: 'মুছুন',
    copy: 'কপি করুন',
    copied: 'কপি হয়েছে!',
    success: 'সফল',
    error: 'ত্রুটি',

    patientId: 'স্বাস্থ্য পরিচয়',
    abhaId: 'আভা (ABHA) নম্বর',
    age: 'বয়স',
    years: 'বছর',
    bloodGroup: 'রক্তের গ্রুপ',
    emergencyContact: 'জরুরি যোগাযোগ',
    primaryHospital: 'হাসপাতাল',
    primaryDoctor: 'প্রধান ডাক্তার',
    insuranceCard: 'স্বাস্থ্য বীমা',
    activeRecordsCount: 'মোট রেকর্ড',
    vaccinesGivenCount: 'টিকার ডোজ',
    upcomingVisitsCount: 'আসন্ন ভিজিট',
    activeSharesCount: 'সক্রিয় শেয়ার',

    quickAddRecord: 'নতুন রেকর্ড যোগ',
    quickViewVaccines: 'টিকা সার্টিফিকেট',
    quickShareDoctor: 'ডাক্তারকে পাঠান',
    quickVerifyReport: 'রিপোর্ট যাচাই',

    recordsTitle: 'ডিজিটাল স্বাস্থ্য রেকর্ড',
    recordsSubtitle: 'আপনার সমস্ত ল্যাব রিপোর্ট ও প্রেসক্রিপশন এক জায়গায় সুরক্ষিত',
    allCategories: 'সমস্ত বিভাগ',
    labTest: 'রক্ত / ল্যাব রিপোর্ট',
    imagingXray: 'এক্স-রে ও স্ক্যান',
    doctorNotes: 'ডাক্তারের নোট',
    prescriptions: 'প্রেসক্রিপশন',
    dischargeSummary: 'ডিসচার্জ সারাংশ',
    consultation: 'পরামর্শ',
    other: 'অন্যান্য নথি',
    testName: 'পরীক্ষার নাম',
    doctorHospital: 'ডাক্তার ও হাসপাতাল',
    reportDate: 'রিপোর্টের তারিখ',
    integritySeal: 'ডিজিটাল সিল',
    tamperProof: 'সম্পূর্ণ খাঁটি ও সুরক্ষিত',
    viewImage: 'ছবি দেখুন',
    dicomViewer: 'স্ক্যান ভিউয়ার খুলুন',

    vaccinesTitle: 'টিকা সার্টিফিকেট ওয়ালেট',
    vaccinesSubtitle: 'যাচাইকৃত টিকাদানের ইতিহাস ও সনদপত্র',
    completedDoses: 'সম্পূর্ণ ডোজ',
    upcomingVaccine: 'টিকা বাকি আছে',
    seasonalFlu: 'ফ্লু টিকা',
    certificateNo: 'সার্টিফিকেট নম্বর',
    beneficiaryName: 'সুবিধাভোগীর নাম',
    vaccineDose: 'টিকার ডোজ',
    administeredBy: 'প্রদানকারী',
    vaccinationCenter: 'টিকা কেন্দ্র',
    logNewVaccine: 'নতুন টিকা যোগ করুন',
    cowinVerified: 'কোউইন / ডিজিটাল ইন্ডিয়া যাচাইকৃত',

    remindersTitle: 'অ্যাপয়েন্টমেন্ট ও ওষুধের সময়',
    remindersSubtitle: 'ডাক্তারের সাথে দেখা বা ওষুধের সময় কখনোই ভুলে যাবেন না',
    scheduledVisits: 'ডাক্তারের অ্যাপয়েন্টমেন্ট',
    medicineTimings: 'ওষুধের সময়সূচি',
    consultationFee: 'পরামর্শ ফি',
    clinicHospital: 'ক্লিনিক / হাসপাতাল',
    bookVisit: 'নতুন বুকিং করুন',
    markDone: 'ওষুধ নেওয়া হয়েছে',
    snooze: 'পরে মনে করান',

    sharingTitle: 'ডাক্তারের সাথে শেয়ার করুন',
    sharingSubtitle: 'সীমিত সময়ের জন্য ডাক্তার বা পরিবারকে নিরাপদ প্রবেশাধিকার দিন',
    shareWithDoctor: 'ডাক্তারের সাথে শেয়ার',
    shareWithFamily: 'পরিবারের সাথে শেয়ার',
    accessDuration: 'মেয়াদ',
    oneHour: '১ ঘণ্টা',
    twentyFourHours: '২৪ ঘণ্টা',
    sevenDays: '৭ দিন',
    thirtyDays: '৩০ দিন',
    generateAccessPin: 'পিন ও কিউআর তৈরি করুন',
    activeShares: 'সক্রিয় শেয়ারিং',
    revokeAccess: 'অনুমতি বাতিল করুন',
    accessCode: 'নিরাপত্তা পিন',

    verificationTitle: 'নথি যাচাইকরণ',
    verificationSubtitle: 'ল্যাব রিপোর্ট বা টিকার শংসাপত্র আসল কিনা পরীক্ষা করুন',
    verifyInstructions: 'ডিজিটাল স্বাক্ষর যাচাই করতে ফাইল আপলোড করুন বা কোড লিখুন',
    checkTamperSeal: 'যাচাই করুন',
    documentHash: 'ডিজিটাল স্বাক্ষর (SHA-256)',
    verificationSuccess: 'যাচাইকরণ সফল: নথি ১০০% খাঁটি',
    authenticReport: 'অনুমোদিত মেডিকেল সেন্টার দ্বারা প্রত্যয়িত',

    auditTitle: 'নিরাপত্তা ও নিরীক্ষা লগ',
    auditSubtitle: 'আপনার রেকর্ড কখন কে দেখেছেন তার সম্পূর্ণ ইতিহাস',
    activityHistory: 'সাম্প্রতিক কার্যকলাপ',
    deviceLocation: 'ডিভাইস ও অবস্থান',
    tamperProtection: 'সম্পূর্ণ সুরক্ষিত ও এনক্রিপ্ট করা',
    actionDetails: 'কার্যকলাপের বিবরণ',

    settingsTitle: 'সেটিংস ও নিরাপত্তা',
    settingsSubtitle: 'আপনার ভাষা, বায়োমেট্রিক ও অ্যাকাউন্টের সেটিংস পরিচালনা করুন',
    languageSection: 'অ্যাপের ভাষা (Language)',
    biometricSection: 'বায়োমেট্রিক আনলক (ফিঙ্গারপ্রিন্ট / ফেস আইডি)',
    biometricToggleLabel: 'বায়োমেট্রিক আনলক বাধ্যতামূলক করুন',
    biometricToggleDesc: 'অ্যাপ খুলতে বা সংবেদনশীল রিপোর্ট দেখতে ফিঙ্গারপ্রিন্ট বা ফেস আইডি ব্যবহার করুন',
    biometricEnforced: 'সক্রিয়',
    biometricOptional: 'ঐচ্ছিক',
    testBiometric: 'বায়োমেট্রিক পরীক্ষা করুন',
    abhaSection: 'আয়ুষ্মান ভারত হেলথ অ্যাকাউন্ট (ABHA)',
    abhaDesc: 'আপনার ১৪ সংখ্যার জাতীয় স্বাস্থ্য পরিচয় নম্বর',
    emergencyDetails: 'জরুরি তথ্য',
    notificationPreferences: 'বিজ্ঞপ্তি সেটিংস',
    smsAlerts: 'এসএমএস বিজ্ঞপ্তি',
    whatsappAlerts: 'হোয়াটসঅ্যাপ বার্তা',

    biometricPromptTitle: 'বায়োমেট্রিক প্রমাণীকরণ',
    biometricPromptSubtitle: 'অনুগ্রহ করে সেন্সরে আঙুল রাখুন বা ফেস আনলক করুন',
    touchSensor: 'ফিঙ্গারপ্রিন্ট সেন্সর',
    faceUnlock: 'ফেস আনলক',
    securityKey: 'সিকিউরিটি পাসকি',
    scanSensorButton: 'সেন্সর স্ক্যান করুন / পিন দিন',
    passphraseFallback: 'মাস্টার পাসওয়ার্ড ব্যবহার করুন',
    authSuccessToast: 'বায়োমেট্রিক যাচাই সফল হয়েছে।',

    signInTitle: 'স্বাস্থ্য ওয়ালেটে স্বাগতম',
    signInSubtitle: 'প্রতিটি ভারতীয় নাগরিকের জন্য সহজ ও নিরাপদ ডিজিটাল স্বাস্থ্য খাতা',
    mobileOrAbha: 'মোবাইল নম্বর বা আভা আইডি',
    enterPassword: 'পাসওয়ার্ড বা ওটিপি দিন',
    loginButton: 'সাইন ইন করুন',
    createAccount: 'নতুন অ্যাকাউন্ট তৈরি করুন',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    simpleTechnologyNote: 'ভারতের প্রতিটি নাগরিকের জন্য সহজ প্রযুক্তি • ১২টি ভারতীয় ভাষায় উপলব্ধ',
  },

  mr: {
    appName: 'स्वास्थ्य वॉलेट',
    appSubtitle: 'प्रत्येक भारतीय नागरिकासाठी डिजिटल हेल्थ लॉकर',
    searchPlaceholder: 'तपासणी, डॉक्टर, औषधे, लस शोधा...',
    authGate: 'लॉग इन / खाते',
    notifications: 'सूचना',
    verifiedBadge: 'प्रमाणित व सुरक्षित',
    desktopView: 'डेस्कटॉप',
    mobileView: 'मोबाईल',
    selectLanguage: 'भाषा निवडा',
    changeLanguage: 'भाषा',

    dashboard: 'मुख्य डॅशबोर्ड',
    medicalRecords: 'आरोग्य नोंदी',
    vaccinationWallet: 'लसीकरण प्रमाणपत्र',
    remindersSchedule: 'भेटी व औषधे',
    secureSharing: 'डॉक्टरांशी शेअर करा',
    documentVerification: 'कागदपत्र पडताळणी',
    securityAudit: 'सुरक्षा व इतिहास',
    settings: 'सेटिंग्ज',

    addRecord: 'नोंद जोडा',
    uploadFile: 'अहवाल अपलोड करा',
    viewDetails: 'तपशील पहा',
    downloadPdf: 'PDF डाउनलोड करा',
    share: 'शेअर करा',
    verify: 'पडताळा',
    cancel: 'रद्द करा',
    save: 'जतन करा',
    close: 'बंद करा',
    delete: 'हटवा',
    filter: 'फिल्टर',
    all: 'सर्व',
    back: 'मागे',
    search: 'शोधा',
    clear: 'साफ करा',
    copy: 'कॉपी करा',
    copied: 'कॉपी झाले!',
    success: 'यशस्वी',
    error: 'त्रुटी',

    patientId: 'आरोग्य ओळख',
    abhaId: 'आभा (ABHA) क्रमांक',
    age: 'वय',
    years: 'वर्षे',
    bloodGroup: 'रक्तगट',
    emergencyContact: 'आपत्कालीन संपर्क',
    primaryHospital: 'रुग्णालय',
    primaryDoctor: 'प्रमुख डॉक्टर',
    insuranceCard: 'आरोग्य विमा',
    activeRecordsCount: 'एकूण नोंदी',
    vaccinesGivenCount: 'लस डोस',
    upcomingVisitsCount: 'पुढील भेटी',
    activeSharesCount: 'सक्रिय शेअर',

    quickAddRecord: 'नवीन नोंद जोडा',
    quickViewVaccines: 'लसीकरण प्रमाणपत्रे',
    quickShareDoctor: 'डॉक्टरांना पाठवा',
    quickVerifyReport: 'अहवाल पडताळा',

    recordsTitle: 'डिजिटल आरोग्य नोंदी',
    recordsSubtitle: 'आपले सर्व लॅब अहवाल व प्रिस्क्रिप्शन एकाच सुरक्षित ठिकाणी',
    allCategories: 'सर्व श्रेणी',
    labTest: 'रक्त / लॅब तपासणी',
    imagingXray: 'क्ष-किरण (X-Ray) व स्कॅन',
    doctorNotes: 'डॉक्टरांचा सल्ला',
    prescriptions: 'औषध प्रिस्क्रिप्शन',
    dischargeSummary: 'डिस्चार्ज सारांश',
    consultation: 'सल्लामसलत',
    other: 'इतर कागदपत्रे',
    testName: 'तपासणीचे नाव',
    doctorHospital: 'डॉक्टर व रुग्णालय',
    reportDate: 'अहवालाची तारीख',
    integritySeal: 'डिजिटल शिक्का',
    tamperProof: 'अस्सल व सुरक्षित',
    viewImage: 'फोटो पहा',
    dicomViewer: 'स्कॅन व्ह्यूअर उघडा',

    vaccinesTitle: 'लसीकरण पाकीट',
    vaccinesSubtitle: 'प्रमाणित लसीकरण इतिहास आणि राष्ट्रीय प्रमाणपत्र',
    completedDoses: 'पूर्ण डोस',
    upcomingVaccine: 'आगामी लस',
    seasonalFlu: 'फ्लू लस',
    certificateNo: 'प्रमाणपत्र क्रमांक',
    beneficiaryName: 'लाभार्थ्याचे नाव',
    vaccineDose: 'लस डोस',
    administeredBy: 'लस देणारे',
    vaccinationCenter: 'लसीकरण केंद्र',
    logNewVaccine: 'नवीन लस नोंदवा',
    cowinVerified: 'कोविन / डिजिटल इंडिया प्रमाणित',

    remindersTitle: 'भेटी व औषधांचे स्मरणपत्र',
    remindersSubtitle: 'डॉक्टरांची भेट किंवा रोजच्या औषधांची वेळ विसरू नका',
    scheduledVisits: 'डॉक्टर भेटी',
    medicineTimings: 'औषधांची वेळ',
    consultationFee: 'सल्ला शुल्क',
    clinicHospital: 'दवाखाना / रुग्णालय',
    bookVisit: 'नवीन भेट नोंदवा',
    markDone: 'औषध घेतले',
    snooze: 'नंतर आठवण करा',

    sharingTitle: 'डॉक्टरांशी सुरक्षित शेअर करा',
    sharingSubtitle: 'मर्यादित वेळेसाठी डॉक्टर किंवा कुटुंबाला सुरक्षित प्रवेश द्या',
    shareWithDoctor: 'डॉक्टरांशी शेअर करा',
    shareWithFamily: 'कुटुंबाशी शेअर करा',
    accessDuration: 'प्रवेश मुदत',
    oneHour: '१ तास',
    twentyFourHours: '२४ तास',
    sevenDays: '७ दिवस',
    thirtyDays: '३० दिवस',
    generateAccessPin: 'पिन व क्यूआर कोड बनवा',
    activeShares: 'सक्रिय शेअर लिंक्स',
    revokeAccess: 'प्रवेश रद्द करा',
    accessCode: 'प्रवेश पिन',

    verificationTitle: 'कागदपत्र पडताळणी',
    verificationSubtitle: 'अहवाल किंवा लस प्रमाणपत्र अस्सल आहे का ते तपासा',
    verifyInstructions: 'डिजिटल स्वाक्षरी तपासण्यासाठी फाईल अपलोड करा किंवा कोड टाका',
    checkTamperSeal: 'अस्सलता तपासा',
    documentHash: 'डिजिटल स्वाक्षरी (SHA-256)',
    verificationSuccess: 'पडताळणी यशस्वी: कागदपत्र १००% अस्सल आहे',
    authenticReport: 'अधिकृत वैद्यकीय केंद्राद्वारे प्रमाणित',

    auditTitle: 'सुरक्षा आणि इतिहास',
    auditSubtitle: 'आपल्या नोंदी कोणी पाहिल्या व शेअर केल्या याचा तपशील',
    activityHistory: 'अलीकडील हालचाली',
    deviceLocation: 'डिव्हाइस व स्थान',
    tamperProtection: 'पूर्णपणे एनक्रिप्टेड सुरक्षा',
    actionDetails: 'तपशील',

    settingsTitle: 'सेटिंग्ज व सुरक्षा',
    settingsSubtitle: 'भाषा, बायोमेट्रिक सुरक्षा व आरोग्य खाते व्यवस्थापित करा',
    languageSection: 'अॅपची भाषा (Language)',
    biometricSection: 'बायोमेट्रिक अनलॉक (फिंगरप्रिंट / फेस आयडी)',
    biometricToggleLabel: 'बायोमेट्रिक अनलॉक अनिवार्य करा',
    biometricToggleDesc: 'अॅप उघडण्यासाठी किंवा अहवाल पाहण्यासाठी फिंगरप्रिंट किंवा फेस आयडी वापरा',
    biometricEnforced: 'लागू',
    biometricOptional: 'ऐच्छिक',
    testBiometric: 'बायोमेट्रिक तपासा',
    abhaSection: 'आयुष्मान भारत हेल्थ अकाउंट (ABHA)',
    abhaDesc: 'आपला १४ अंकी राष्ट्रीय आरोग्य ओळख क्रमांक',
    emergencyDetails: 'आपत्कालीन माहिती',
    notificationPreferences: 'सूचना प्राधान्ये',
    smsAlerts: 'एसएमएस सूचना',
    whatsappAlerts: 'व्हॉट्सअॅप आठवण',

    biometricPromptTitle: 'बायोमेट्रिक प्रमाणीकरण',
    biometricPromptSubtitle: 'कृपया सेन्सरवर बोट ठेवा किंवा फेस अनलॉक वापरा',
    touchSensor: 'फिंगरप्रिंट सेन्सर',
    faceUnlock: 'फेस अनलॉक',
    securityKey: 'सुरक्षा पास-की',
    scanSensorButton: 'सेन्सर स्कॅन करा / पिन टाका',
    passphraseFallback: 'मास्टर पासवर्ड वापरा',
    authSuccessToast: 'बायोमेट्रिक यशस्वीरित्या प्रमाणित झाले.',

    signInTitle: 'स्वास्थ्य वॉलेटमध्ये आपले स्वागत आहे',
    signInSubtitle: 'प्रत्येक भारतीय नागरिकासाठी सुलभ व सुरक्षित डिजिटल आरोग्य लॉकर',
    mobileOrAbha: 'मोबाईल क्रमांक किंवा आभा आयडी',
    enterPassword: 'पासवर्ड किंवा ओटीपी टाका',
    loginButton: 'लॉग इन करा',
    createAccount: 'नवीन खाते तयार करा',
    forgotPassword: 'पासवर्ड विसरलात?',
    simpleTechnologyNote: 'प्रत्येक भारतीयासाठी साधे तंत्रज्ञान • १२ भारतीय भाषांमध्ये उपलब्ध',
  },

  ta: {
    appName: 'சுவாஸ்திய வாலட்',
    appSubtitle: 'ஒவ்வொரு இந்தியக் குடிமகனுக்கான டிஜிட்டல் ஹெல்த் லாக்கர்',
    searchPlaceholder: 'மருத்துவ சோதனைகள், மருத்துவர்கள், மருந்துகள்...',
    authGate: 'உள்நுழைவு / கணக்கு',
    notifications: 'அறிவிப்புகள்',
    verifiedBadge: 'சரிபார்க்கப்பட்டது & பாதுகாப்பானது',
    desktopView: 'டெஸ்க்டாப்',
    mobileView: 'மொபைல்',
    selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    changeLanguage: 'மொழி',

    dashboard: 'முகப்பு பலகை',
    medicalRecords: 'மருத்துவ ஆவணங்கள்',
    vaccinationWallet: 'தடுப்பூசி சான்றிதழ்கள்',
    remindersSchedule: 'மருத்துவ சந்திப்புகள் & மருந்துகள்',
    secureSharing: 'மருத்துவருடன் பகிரவும்',
    documentVerification: 'ஆவண சரிபார்ப்பு',
    securityAudit: 'பாதுகாப்பு & வரலாறு',
    settings: 'அமைப்புகள்',

    addRecord: 'ஆவணம் சேர்',
    uploadFile: 'கோப்பைப் பதிவேற்று',
    viewDetails: 'விவரங்களைப் பார்க்க',
    downloadPdf: 'PDF பதிவிறக்க',
    share: 'பகிர்',
    verify: 'சரிபார்',
    cancel: 'ரத்து செய்',
    save: 'சேமி',
    close: 'மூடு',
    delete: 'நீக்கு',
    filter: 'வடிகட்டி',
    all: 'அனைத்தும்',
    back: 'பின்செல்',
    search: 'தேடு',
    clear: 'அழி',
    copy: 'நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    success: 'வெற்றி',
    error: 'பிழை',

    patientId: 'சுகாதார அடையாளம்',
    abhaId: 'ஆபா (ABHA) எண்',
    age: 'வயது',
    years: 'ஆண்டுகள்',
    bloodGroup: 'இரத்த வகை',
    emergencyContact: 'அவசர தொடர்பு',
    primaryHospital: 'மருத்துவமனை',
    primaryDoctor: 'முதன்மை மருத்துவர்',
    insuranceCard: 'மருத்துவக் காப்பீடு',
    activeRecordsCount: 'மொத்த ஆவணங்கள்',
    vaccinesGivenCount: 'தடுப்பூசி அளவுகள்',
    upcomingVisitsCount: 'அடுத்த சந்திப்புகள்',
    activeSharesCount: 'பகிர்வு இணைப்புகள்',

    quickAddRecord: 'புதிய ஆவணம் சேர்',
    quickViewVaccines: 'தடுப்பூசி சான்றிதழ்',
    quickShareDoctor: 'மருத்துவரிடம் பகிர்',
    quickVerifyReport: 'அறிக்கையை சரிபார்',

    recordsTitle: 'டிஜிட்டல் மருத்துவ ஆவணங்கள்',
    recordsSubtitle: 'உங்கள் அனைத்து பரிசோதனை முடிவுகளும் ஒரே பாதுகாப்பான இடத்தில்',
    allCategories: 'அனைத்து பிரிவுகள்',
    labTest: 'இரத்த / ஆய்வக சோதனை',
    imagingXray: 'எக்ஸ்-ரே & ஸ்கேன்',
    doctorNotes: 'மருத்துவர் குறிப்புகள்',
    prescriptions: 'மருந்துச் சீட்டு',
    dischargeSummary: 'வெளியேற்ற சுருக்கம்',
    consultation: 'ஆலோசனை',
    other: 'பிற ஆவணங்கள்',
    testName: 'சோதனையின் பெயர்',
    doctorHospital: 'மருத்துவர் & மருத்துவமனை',
    reportDate: 'அறிக்கை தேதி',
    integritySeal: 'டிஜிட்டல் முத்திரை',
    tamperProof: 'உண்மையானது & பாதுகாப்பானது',
    viewImage: 'படத்தைப் பார்',
    dicomViewer: 'ஸ்கேன் வியூவரைத் திறக்கவும்',

    vaccinesTitle: 'தடுப்பூசி சான்றிதழ் பை',
    vaccinesSubtitle: 'சரிபார்க்கப்பட்ட தடுப்பூசி வரலாறு & தேசிய சான்றிதழ்கள்',
    completedDoses: 'செலுத்தப்பட்ட அளவுகள்',
    upcomingVaccine: 'செலுத்த வேண்டிய தடுப்பூசி',
    seasonalFlu: 'பருவக்கால காய்ச்சல் தடுப்பூசி',
    certificateNo: 'சான்றிதழ் எண்',
    beneficiaryName: 'பயனாளியின் பெயர்',
    vaccineDose: 'தடுப்பூசி அளவு',
    administeredBy: 'செலுத்தியவர்',
    vaccinationCenter: 'தடுப்பூசி மையம்',
    logNewVaccine: 'புதிய தடுப்பூசி சேர்',
    cowinVerified: 'கோவின் / டிஜிட்டல் இந்தியா சரிபார்க்கப்பட்டது',

    remindersTitle: 'சந்திப்புகள் & மருந்து நினைவூட்டல்',
    remindersSubtitle: 'மருத்துவ சந்திப்பு அல்லது மருந்து நேரத்தை தவறவிடாதீர்கள்',
    scheduledVisits: 'மருத்துவ சந்திப்புகள்',
    medicineTimings: 'தினசரி மருந்து நேரம்',
    consultationFee: 'ஆலோசனை கட்டணம்',
    clinicHospital: 'மருத்துவமனை',
    bookVisit: 'புதிய சந்திப்பு பதிவு',
    markDone: 'மருந்து எடுத்தாச்சு',
    snooze: 'பிறகு நினைவூட்டு',

    sharingTitle: 'மருத்துவருடன் பாதுகாப்பாகப் பகிரவும்',
    sharingSubtitle: 'வரையறுக்கப்பட்ட நேரத்திற்கு உங்கள் மருத்துவருக்கு அணுகல் வழங்கவும்',
    shareWithDoctor: 'மருத்துவருடன் பகிர்',
    shareWithFamily: 'குடும்பத்தினருடன் பகிர்',
    accessDuration: 'அணுகல் காலம்',
    oneHour: '1 மணி நேரம்',
    twentyFourHours: '24 மணி நேரம்',
    sevenDays: '7 நாட்கள்',
    thirtyDays: '30 நாட்கள்',
    generateAccessPin: 'பின் & QR குறியீட்டை உருவாக்கு',
    activeShares: 'செயலில் உள்ள பகிர்வுகள்',
    revokeAccess: 'அணுகலை ரத்து செய்',
    accessCode: 'பாதுகாப்பு பின்',

    verificationTitle: 'ஆவண சரிபார்ப்பு',
    verificationSubtitle: 'மருத்துவ அறிக்கை உண்மையானதா என உடனே சரிபார்க்கவும்',
    verifyInstructions: 'டிஜிட்டல் முத்திரையை சரிபார்க்க கோப்பைப் பதிவேற்றவும்',
    checkTamperSeal: 'உண்மையானதா என பார்',
    documentHash: 'டிஜிட்டல் கையொப்பம் (SHA-256)',
    verificationSuccess: 'சரிபார்ப்பு வெற்றி: ஆவணம் 100% உண்மையானது',
    authenticReport: 'அங்கீகரிக்கப்பட்ட மருத்துவ மையத்தால் சான்றளிக்கப்பட்டது',

    auditTitle: 'பாதுகாப்பு & வரலாற்றுப் பதிவு',
    auditSubtitle: 'உங்கள் ஆவணங்களை யார் பார்த்தார்கள் என்ற முழு விவரம்',
    activityHistory: 'சமீபத்திய செயல்பாடுகள்',
    deviceLocation: 'சாதனம் & இடம்',
    tamperProtection: 'முழுமையான மறைகுறியாக்க பாதுகாப்பு',
    actionDetails: 'செயல்பாட்டு விவரங்கள்',

    settingsTitle: 'அமைப்புகள் & பாதுகாப்பு',
    settingsSubtitle: 'மொழி, பயோமெட்ரிக் பாதுகாப்பு & கணக்கு அமைப்புகளை நிர்வகிக்கவும்',
    languageSection: 'செயலி மொழி (Language)',
    biometricSection: 'பயோமெட்ரிக் பூட்டு (கைரேகை / முக அடையாளம்)',
    biometricToggleLabel: 'பயோமெட்ரிக் பூட்டை கட்டாயமாக்கு',
    biometricToggleDesc: 'செயலியைத் திறக்க அல்லது அறிக்கைகளைப் பார்க்க கைரேகை அல்லது முக அடையாளத்தைப் பயன்படுத்தவும்',
    biometricEnforced: 'செயலில் உள்ளது',
    biometricOptional: 'விருப்பத்திற்குரியது',
    testBiometric: 'பயோமெட்ரிக்கை சோதிக்கவும்',
    abhaSection: 'ஆயுஷ்மான் பாரத் சுகாதார கணக்கு (ABHA)',
    abhaDesc: 'நாடு முழுவதும் மருத்துவமனைகளை இணைக்கும் 14 இலக்க தேசிய சுகாதார அடையாளம்',
    emergencyDetails: 'அவசர சிகிச்சை தகவல்',
    notificationPreferences: 'அறிவிப்பு அமைப்புகள்',
    smsAlerts: 'எஸ்எம்எஸ் எச்சரிக்கைகள்',
    whatsappAlerts: 'வாட்ஸ்அப் நினைவூட்டல்கள்',

    biometricPromptTitle: 'பயோமெட்ரிக் அங்கீகாரம்',
    biometricPromptSubtitle: 'உங்கள் அடையாளத்தை சரிபார்க்க விரலை வைக்கவும் அல்லது முகத்தைக் காட்டவும்',
    touchSensor: 'கைரேகை சென்சார்',
    faceUnlock: 'முக அங்கீகாரம்',
    securityKey: 'பாதுகாப்பு பாஸ்கீ',
    scanSensorButton: 'சென்சாரை ஸ்கேன் செய் / பின் உள்ளிடவும்',
    passphraseFallback: 'முதன்மை கடவுச்சொல்லைப் பயன்படுத்து',
    authSuccessToast: 'பயோமெட்ரிக் வெற்றிகரமாக சரிபார்க்கப்பட்டது.',

    signInTitle: 'சுவாஸ்திய வாலட்டுக்கு வரவேற்கிறோம்',
    signInSubtitle: 'ஒவ்வொரு இந்தியக் குடிமகனுக்கான எளிமையான மற்றும் பாதுகாப்பான டிஜிட்டல் ஹெல்த் லாக்கர்',
    mobileOrAbha: 'மொபைல் எண் அல்லது ஆபா ஐடி',
    enterPassword: 'கடவுச்சொல் அல்லது OTP உள்ளிடவும்',
    loginButton: 'உள்நுழைக / OTP சரிபார்',
    createAccount: 'புதிய கணக்கை உருவாக்கவும்',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    simpleTechnologyNote: 'அனைத்து இந்தியர்களுக்கும் எளிய தொழில்நுட்பம் • 12 இந்திய மொழிகளில் கிடைக்கிறது',
  },

  te: {
    appName: 'స్వాస్థ్య వాలెట్',
    appSubtitle: 'ప్రతి భారతీయ పౌరుడి కోసం డిజిటల్ హెల్త్ లాకర్',
    searchPlaceholder: 'పరీక్షలు, వైద్యులు, మందులు, టీకాలు వెతకండి...',
    authGate: 'లాగిన్ / ఖాతా',
    notifications: 'నోటిఫికేషన్లు',
    verifiedBadge: 'ధృవీకరించబడింది & సురక్షితం',
    desktopView: 'డెస్క్‌టాప్',
    mobileView: 'మొబైల్',
    selectLanguage: 'భాషను ఎంచుకోండి',
    changeLanguage: 'భాష',

    dashboard: 'హోమ్ డ్యాష్‌బోర్డ్',
    medicalRecords: 'ఆరోగ్య రికార్డులు',
    vaccinationWallet: 'టీకా సర్టిఫికెట్లు',
    remindersSchedule: 'అపాయింట్‌మెంట్లు & మందులు',
    secureSharing: 'వైద్యుడితో పంచుకోండి',
    documentVerification: 'పత్రాల ధృవీకరణ',
    securityAudit: 'భద్రత & చరిత్ర',
    settings: 'సెట్టింగ్‌లు',

    addRecord: 'రికార్డు జోడించండి',
    uploadFile: 'రిపోర్టు అప్‌లోడ్ చేయండి',
    viewDetails: 'వివరాలు చూడండి',
    downloadPdf: 'PDF డౌన్‌లోడ్',
    share: 'షేర్ చేయండి',
    verify: 'ధృవీకరించండి',
    cancel: 'రద్దు',
    save: 'సేవ్ చేయండి',
    close: 'మూసివేయి',
    delete: 'తొలగించు',
    filter: 'ఫిల్టర్',
    all: 'అన్నీ',
    back: 'వెనుకకు',
    search: 'వెతకండి',
    clear: 'క్లియర్',
    copy: 'కాపీ చేయండి',
    copied: 'కాపీ అయింది!',
    success: 'విజయం',
    error: 'లోపం',

    patientId: 'ఆరోగ్య గుర్తింపు',
    abhaId: 'ఆభా (ABHA) సంఖ్య',
    age: 'వయస్సు',
    years: 'సంవత్సరాలు',
    bloodGroup: 'రక్త వర్గం',
    emergencyContact: 'అత్యవసర సంప్రదింపు',
    primaryHospital: 'ఆసుపత్రి',
    primaryDoctor: 'ప్రధాన వైద్యుడు',
    insuranceCard: 'ఆరోగ్య బీమా',
    activeRecordsCount: 'మొత్తం రికార్డులు',
    vaccinesGivenCount: 'టీకా డోసులు',
    upcomingVisitsCount: 'రాబోయే అపాయింట్‌మెంట్లు',
    activeSharesCount: 'యాక్టివ్ షేర్లు',

    quickAddRecord: 'కొత్త రికార్డు జోడించండి',
    quickViewVaccines: 'టీకా సర్టిఫికెట్',
    quickShareDoctor: 'వైద్యుడికి పంపండి',
    quickVerifyReport: 'రిపోర్టు తనిఖీ చేయండి',

    recordsTitle: 'డిజిటల్ ఆరోగ్య రికార్డులు',
    recordsSubtitle: 'మీ ల్యాబ్ నివేదికలు మరియు ప్రిస్క్రిప్షన్లు అన్నీ ఒకే సురక్షిత స్థలంలో',
    allCategories: 'అన్ని విభాగాలు',
    labTest: 'రక్త / ల్యాబ్ పరీక్ష',
    imagingXray: 'ఎక్స్-రే & స్కాన్లు',
    doctorNotes: 'వైద్యుడి సూచనలు',
    prescriptions: 'మందుల ప్రిస్క్రిప్షన్',
    dischargeSummary: 'డిశ్చార్జ్ సారాంశం',
    consultation: 'సంప్రదింపులు',
    other: 'ఇతర పత్రాలు',
    testName: 'పరీక్ష పేరు',
    doctorHospital: 'వైద్యుడు & ఆసుపత్రి',
    reportDate: 'నివేదిక తేదీ',
    integritySeal: 'డిజిటల్ ముద్ర',
    tamperProof: 'నిజమైనది & సురక్షితమైనది',
    viewImage: 'చిత్రం చూడండి',
    dicomViewer: 'స్కాన్ వ్యూయర్ తెరవండి',

    vaccinesTitle: 'టీకా సర్టిఫికెట్ వాలెట్',
    vaccinesSubtitle: 'ధృవీకరించబడిన టీకా చరిత్ర & జాతీయ సర్టిఫికెట్లు',
    completedDoses: 'పూర్తయిన డోసులు',
    upcomingVaccine: 'తీసుకోవాల్సిన టీకా',
    seasonalFlu: 'ఫ్లూ టీకా',
    certificateNo: 'సర్టిఫికేట్ సంఖ్య',
    beneficiaryName: 'లబ్ధిదారుని పేరు',
    vaccineDose: 'టీకా డోస్',
    administeredBy: 'టీకా వేసినవారు',
    vaccinationCenter: 'టీకా కేంద్రం',
    logNewVaccine: 'కొత్త టీకా జోడించండి',
    cowinVerified: 'కోవిన్ / డిజిటల్ ఇండియా ధృవీకరించబడింది',

    remindersTitle: 'అపాయింట్‌మెంట్లు & మందుల అలారాలు',
    remindersSubtitle: 'డాక్టర్ అపాయింట్‌మెంట్ లేదా రోజువారీ మందుల సమయాన్ని ఎప్పటికీ మరచిపోకండి',
    scheduledVisits: 'డాక్టర్ అపాయింట్‌మెంట్లు',
    medicineTimings: 'మందుల వేళలు',
    consultationFee: 'సంప్రదింపు ఫీజు',
    clinicHospital: 'క్లినిక్ / ఆసుపత్రి',
    bookVisit: 'కొత్త అపాయింట్‌మెంట్ బుక్ చేయండి',
    markDone: 'మందు వేసుకున్నాను',
    snooze: 'తర్వాత గుర్తు చేయండి',

    sharingTitle: 'డాక్టర్‌తో సురక్షితంగా పంచుకోండి',
    sharingSubtitle: 'పరిమిత సమయం కోసం డాక్టర్ లేదా కుటుంబ సభ్యులకు యాక్సెస్ ఇవ్వండి',
    shareWithDoctor: 'డాక్టర్‌తో పంచుకోండి',
    shareWithFamily: 'కుటుంబ సభ్యుడితో పంచుకోండి',
    accessDuration: 'యాక్సెస్ కాలపరిమితి',
    oneHour: '1 గంట',
    twentyFourHours: '24 గంటలు',
    sevenDays: '7 రోజులు',
    thirtyDays: '30 రోజులు',
    generateAccessPin: 'పిన్ & క్యూఆర్ కోడ్ రూపొందించండి',
    activeShares: 'యాక్టివ్ షేరింగ్ లింకులు',
    revokeAccess: 'యాక్సెస్ రద్దు చేయండి',
    accessCode: 'సెక్యూరిటీ పిన్',

    verificationTitle: 'పత్రాల ధృవీకరణ',
    verificationSubtitle: 'ల్యాబ్ రిపోర్టు లేదా టీకా సర్టిఫికేట్ నిజమైనదో కాదో తనిఖీ చేయండి',
    verifyInstructions: 'డిజిటల్ సంతకాన్ని ధృవీకరించడానికి ఫైల్‌ను అప్‌లోడ్ చేయండి',
    checkTamperSeal: 'నిజమైనదో తనిఖీ చేయండి',
    documentHash: 'డిజిటల్ సంతకం (SHA-256)',
    verificationSuccess: 'ధృవీకరణ విజయవంతమైంది: పత్రం 100% నిజమైనది',
    authenticReport: 'అధికారిక వైద్య కేంద్రం ద్వారా ధృవీకరించబడింది',

    auditTitle: 'భద్రత & చరిత్ర లాగ్',
    auditSubtitle: 'మీ రికార్డులను ఎవరు చూశారు మరియు షేర్ చేశారో పూర్తి వివరాలు',
    activityHistory: 'ఇటీవలి కార్యకలాపాలు',
    deviceLocation: 'పరికరం & స్థానం',
    tamperProtection: 'పూర్తి ఎన్‌క్రిప్టెడ్ భద్రత',
    actionDetails: 'వివరాలు',

    settingsTitle: 'సెట్టింగ్‌లు & భద్రత',
    settingsSubtitle: 'భాష, బయోమెట్రిక్ భద్రత & ఖాతా ప్రాధాన్యతలను నిర్వహించండి',
    languageSection: 'యాప్ భాష (Language)',
    biometricSection: 'బయోమెట్రిక్ అన్‌లాక్ (వేలిముద్ర / ఫేస్ ఐడీ)',
    biometricToggleLabel: 'బయోమెట్రిక్ అన్‌లాక్ తప్పనిసరి చేయండి',
    biometricToggleDesc: 'యాప్ తెరవడానికి లేదా నివేదికలు చూడటానికి వేలిముద్ర లేదా ఫేస్ ఐడీ ఉపయోగించండి',
    biometricEnforced: 'యాక్టివ్‌లో ఉంది',
    biometricOptional: 'ఐచ్ఛికం',
    testBiometric: 'బయోమెట్రిక్ పరీక్షించండి',
    abhaSection: 'ఆయుష్మాన్ భారత్ హెల్త్ అకౌంట్ (ABHA)',
    abhaDesc: 'దేశవ్యాప్తంగా ఆసుపత్రులను అనుసంధానించే మీ 14 అంకెల జాతీయ ఆరోగ్య గుర్తింపు సంఖ్య',
    emergencyDetails: 'అత్యవసర సమాచారం',
    notificationPreferences: 'నోటిఫికేషన్ సెట్టింగ్‌లు',
    smsAlerts: 'SMS హెచ్చరికలు',
    whatsappAlerts: 'WhatsApp రిమైండర్లు',

    biometricPromptTitle: 'బయోమెట్రిక్ ప్రామాణీకరణ',
    biometricPromptSubtitle: 'మీ గుర్తింపును ధృవీకరించడానికి దయచేసి సెన్సార్‌పై వేలిని ఉంచండి',
    touchSensor: 'వేలిముద్ర సెన్సార్',
    faceUnlock: 'ఫేస్ అన్‌లాక్',
    securityKey: 'సెక్యూరిటీ పాస్‌కీ',
    scanSensorButton: 'సెన్సార్ స్కాన్ చేయండి / పిన్ ఇవ్వండి',
    passphraseFallback: 'మాస్టర్ పాస్‌వర్డ్ ఉపయోగించండి',
    authSuccessToast: 'బయోమెట్రిక్ విజయవంతంగా ధృవీకరించబడింది.',

    signInTitle: 'స్వాస్థ్య వాలెట్‌కు స్వాగతం',
    signInSubtitle: 'ప్రతి భారతీయ పౌరుడి కోసం సులభమైన మరియు సురక్షితమైన డిజిటల్ హెల్త్ లాకర్',
    mobileOrAbha: 'మొబైల్ నంబర్ లేదా ఆభా ఐడీ',
    enterPassword: 'పాస్‌వర్డ్ లేదా OTP నమోదు చేయండి',
    loginButton: 'లాగిన్ అవ్వండి / OTP ధృవీకరించండి',
    createAccount: 'కొత్త ఖాతాను సృష్టించండి',
    forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    simpleTechnologyNote: 'ప్రతి భారతీయుడి కోసం సులభమైన సాంకేతికత • 12 భారతీయ భాషల్లో అందుబాటులో ఉంది',
  },

  gu: {
    appName: 'સ્વાસ્થ્ય વૉલેટ',
    appSubtitle: 'દરેક ભારતીય નાગરિક માટે ડિજિટલ હેલ્થ લૉકર',
    searchPlaceholder: 'તપાસ રિપોર્ટ, ડૉક્ટર, દવાઓ, રસી શોધો...',
    authGate: 'લૉગ ઇન / ખાતું',
    notifications: 'સૂચનાઓ',
    verifiedBadge: 'પ્રમાણિત અને સુરક્ષિત',
    desktopView: 'ડેસ્કટોપ',
    mobileView: 'મોબાઇલ',
    selectLanguage: 'ભાષા પસંદ કરો',
    changeLanguage: 'ભાષા',

    dashboard: 'મુખ્ય ડેશબોર્ડ',
    medicalRecords: 'આરોગ્ય રેકોર્ડ્સ',
    vaccinationWallet: 'રસીકરણ પ્રમાણપત્રો',
    remindersSchedule: 'મુલાકાતો અને દવાઓ',
    secureSharing: 'ડૉક્ટર સાથે શેર કરો',
    documentVerification: 'દસ્તાવેજ ચકાસણી',
    securityAudit: 'સુરક્ષા અને ઇતિહાસ',
    settings: 'સેટિંગ્સ',

    addRecord: 'રેકોર્ડ ઉમેરો',
    uploadFile: 'રિપોર્ટ અપલોડ કરો',
    viewDetails: 'વિગતો જુઓ',
    downloadPdf: 'PDF ડાઉનલોડ',
    share: 'શેર કરો',
    verify: 'ચકાસો',
    cancel: 'રદ કરો',
    save: 'સાચવો',
    close: 'બંધ કરો',
    delete: 'કાઢી નાખો',
    filter: 'ફિલ્ટર',
    all: 'બધા',
    back: 'પાછા જાઓ',
    search: 'શોધો',
    clear: 'સાફ કરો',
    copy: 'કૉપિ કરો',
    copied: 'કૉપિ થઈ ગયું!',
    success: 'સફળ',
    error: 'ભૂલ',

    patientId: 'આરોગ્ય ઓળખ',
    abhaId: 'આભા (ABHA) નંબર',
    age: 'ઉંમર',
    years: 'વર્ષ',
    bloodGroup: 'બ્લડ ગ્રૂપ',
    emergencyContact: 'ઇમરજન્સી સંપર્ક',
    primaryHospital: 'હોસ્પિટલ',
    primaryDoctor: 'મુખ્ય ડૉક્ટર',
    insuranceCard: 'આરોગ્ય વીમો',
    activeRecordsCount: 'કુલ રેકોર્ડ્સ',
    vaccinesGivenCount: 'રસીના ડોઝ',
    upcomingVisitsCount: 'આગામી મુલાકાતો',
    activeSharesCount: 'સક્રિય શેર',

    quickAddRecord: 'નવો રેકોર્ડ ઉમેરો',
    quickViewVaccines: 'રસીકરણ પ્રમાણપત્ર',
    quickShareDoctor: 'ડૉક્ટર સાથે શેર કરો',
    quickVerifyReport: 'રિપોર્ટ ચકાસો',

    recordsTitle: 'ડિજિટલ આરોગ્ય રેકોર્ડ્સ',
    recordsSubtitle: 'તમારા તમામ લેબ રિપોર્ટ્સ અને પ્રિસ્ક્રિપ્શન્સ એક જ સુરક્ષિત જગ્યાએ',
    allCategories: 'બધી શ્રેણીઓ',
    labTest: 'લોહી / લેબ તપાસ રિપોર્ટ',
    imagingXray: 'એક્સ-રે અને સ્કેન',
    doctorNotes: 'ડૉક્ટરની સલાહ',
    prescriptions: 'દવાનું પ્રિસ્ક્રિપ્શન',
    dischargeSummary: 'ડિસ્ચાર્જ સારાંશ',
    consultation: 'સલાહમશવરા',
    other: 'અન્ય દસ્તાવેજો',
    testName: 'તપાસનું નામ',
    doctorHospital: 'ડૉક્ટર અને હોસ્પિટલ',
    reportDate: 'રિપોર્ટની તારીખ',
    integritySeal: 'ડિજિટલ સીલ',
    tamperProof: 'સંપૂર્ણ અસલી અને સુરક્ષિત',
    viewImage: 'ફોટો જુઓ',
    dicomViewer: 'સ્કેન વ્યૂઅર ખોલો',

    vaccinesTitle: 'રસીકરણ વૉલેટ',
    vaccinesSubtitle: 'પ્રમાણિત રસીકરણ ઇતિહાસ અને રાષ્ટ્રીય પ્રમાણપત્રો',
    completedDoses: 'પૂર્ણ ડોઝ',
    upcomingVaccine: 'બાકી રસી',
    seasonalFlu: 'ફ્લૂ રસી',
    certificateNo: 'સર્ટિફિકેટ નંબર',
    beneficiaryName: 'લાભાર્થીનું નામ',
    vaccineDose: 'રસીનો ડોઝ',
    administeredBy: 'રસી આપનાર',
    vaccinationCenter: 'રસીકરણ કેન્દ્ર',
    logNewVaccine: 'નવી રસી નોંધો',
    cowinVerified: 'કોવિન / ડિજિટલ ઇન્ડિયા પ્રમાણિત',

    remindersTitle: 'મુલાકાતો અને દવા રિમાઇન્ડર',
    remindersSubtitle: 'ડૉક્ટરની મુલાકાત કે દવાનો સમય ક્યારેય ભૂલશો નહીં',
    scheduledVisits: 'ડૉક્ટરની મુલાકાત',
    medicineTimings: 'દવાનો સમય',
    consultationFee: 'કન્સલ્ટેશન ફી',
    clinicHospital: 'ક્લિનિક / હોસ્પિટલ',
    bookVisit: 'નવી મુલાકાત બુક કરો',
    markDone: 'દવા લઈ લીધી',
    snooze: 'પછીથી યાદ કરાવો',

    sharingTitle: 'ડૉક્ટર સાથે સુરક્ષિત શેર કરો',
    sharingSubtitle: 'મર્યાદિત સમય માટે ડૉક્ટર અથવા પરિવારને સુરક્ષિત ઍક્સેસ આપો',
    shareWithDoctor: 'ડૉક્ટર સાથે શેર કરો',
    shareWithFamily: 'પરિવાર સાથે શેર કરો',
    accessDuration: 'સમયમર્યાદા',
    oneHour: '1 કલાક',
    twentyFourHours: '24 કલાક',
    sevenDays: '7 દિવસ',
    thirtyDays: '30 દિવસ',
    generateAccessPin: 'પિન અને QR કોડ બનાવો',
    activeShares: 'સક્રિય શેરિંગ લિંક્સ',
    revokeAccess: 'ઍક્સેસ રદ કરો',
    accessCode: 'સિક્યોરિટી પિન',

    verificationTitle: 'દસ્તાવેજ ચકાસણી',
    verificationSubtitle: 'લેબ રિપોર્ટ કે રસી સર્ટિફિકેટ અસલી છે કે નહીં તે ચકાસો',
    verifyInstructions: 'ડિજિટલ સહી ચકાસવા માટે ફાઇલ અપલોડ કરો',
    checkTamperSeal: 'અસલી છે કે નહીં તે તપાસો',
    documentHash: 'ડિજિટલ સહી (SHA-256)',
    verificationSuccess: 'ચકાસણી સફળ: દસ્તાવેજ 100% અસલી છે',
    authenticReport: 'અધિકૃત તબીબી કેન્દ્ર દ્વારા પ્રમાણિત',

    auditTitle: 'સુરક્ષા અને ઇતિહાસ લૉગ',
    auditSubtitle: 'તમારા રેકોર્ડ્સ કોણે જોયા અને શેર કર્યા તેની સંપૂર્ણ વિગત',
    activityHistory: 'તાજેતરની પ્રવૃત્તિ',
    deviceLocation: 'ઉપકરણ અને સ્થળ',
    tamperProtection: 'સંપૂર્ણ એન્ક્રિપ્ટેડ સુરક્ષા',
    actionDetails: 'વિગતો',

    settingsTitle: 'સેટિંગ્સ અને સુરક્ષા',
    settingsSubtitle: 'ભાષા, બાયોમેટ્રિક સુરક્ષા અને એકાઉન્ટ સેટિંગ્સ મેનેજ કરો',
    languageSection: 'એપની ભાષા (Language)',
    biometricSection: 'બાયોમેટ્રિક અનલૉક (ફિંગરપ્રિન્ટ / ફેસ આઈડી)',
    biometricToggleLabel: 'બાયોમેટ્રિક લૉક ફરજિયાત કરો',
    biometricToggleDesc: 'એપ ખોલવા અથવા રિપોર્ટ જોવા માટે ફિંગરપ્રિન્ટ કે ફેસ આઈડી વાપરો',
    biometricEnforced: 'સક્રિય',
    biometricOptional: 'વૈકલ્પિક',
    testBiometric: 'બાયોમેટ્રિક તપાસો',
    abhaSection: 'આયુષ્માન ભારત હેલ્થ એકાઉન્ટ (ABHA)',
    abhaDesc: 'દેશભરની હોસ્પિટલોને જોડતો તમારો 14 આંકડાનો રાષ્ટ્રીય આરોગ્ય નંબર',
    emergencyDetails: 'ઇમરજન્સી માહિતી',
    notificationPreferences: 'સૂચના સેટિંગ્સ',
    smsAlerts: 'SMS ચેતવણીઓ',
    whatsappAlerts: 'WhatsApp રિમાઇન્ડર',

    biometricPromptTitle: 'બાયોમેટ્રિક પ્રમાણીકરણ',
    biometricPromptSubtitle: 'ઓળખ ચકાસવા માટે કૃપા કરીને સેન્સર પર આંગળી મૂકો',
    touchSensor: 'ફિંગરપ્રિન્ટ સેન્સર',
    faceUnlock: 'ફેસ અનલૉક',
    securityKey: 'સિક્યોરિટી પાસ-કી',
    scanSensorButton: 'સેન્સર સ્કેન કરો / પિન નાખો',
    passphraseFallback: 'માસ્ટર પાસવર્ડ વાપરો',
    authSuccessToast: 'બાયોમેટ્રિક સફળતાપૂર્વક ચકાસાયું.',

    signInTitle: 'સ્વાસ્થ્ય વૉલેટમાં સ્વાગત છે',
    signInSubtitle: 'દરેક ભારતીય નાગરિક માટે સરળ અને સુરક્ષિત ડિજિટલ હેલ્થ લૉકર',
    mobileOrAbha: 'મોબાઇલ નંબર અથવા આભા આઈડી',
    enterPassword: 'પાસવર્ડ અથવા OTP દાખલ કરો',
    loginButton: 'લૉગ ઇન કરો / OTP ચકાસો',
    createAccount: 'નવું ખાતું બનાવો',
    forgotPassword: 'પાસવર્ડ ભૂલી ગયા?',
    simpleTechnologyNote: 'દરેક ભારતીય માટે સરળ તકનીક • 12 ભારતીય ભાષાઓમાં ઉપલબ્ધ',
  },

  kn: {
    appName: 'ಸ್ವಾಸ್ಥ್ಯ ವಾಲೆಟ್',
    appSubtitle: 'ಪ್ರತಿ ಭಾರತೀಯ ನಾಗರಿಕರಿಗಾಗಿ ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಲಾಕರ್',
    searchPlaceholder: 'ಪರೀಕ್ಷೆಗಳು, ವೈದ್ಯರು, ಔಷಧಗಳು, ಲಸಿಕೆಗಳನ್ನು ಹುಡುಕಿ...',
    authGate: 'ಲಾಗಿನ್ / ಖಾತೆ',
    notifications: 'ಸೂಚನೆಗಳು',
    verifiedBadge: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ & ಸುರಕ್ಷಿತ',
    desktopView: 'ಡೆಸ್ಕ್‌ಟಾಪ್',
    mobileView: 'ಮೊಬೈಲ್',
    selectLanguage: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    changeLanguage: 'ಭಾಷೆ',

    dashboard: 'ಮುಖಪುಟ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    medicalRecords: 'ಆರೋಗ್ಯ ದಾಖಲೆಗಳು',
    vaccinationWallet: 'ಲಸಿಕೆ ಪ್ರಮಾಣಪತ್ರಗಳು',
    remindersSchedule: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು & ಔಷಧಗಳು',
    secureSharing: 'ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ',
    documentVerification: 'ದಾಖಲೆ ಪರಿಶೀಲನೆ',
    securityAudit: 'ಸುರಕ್ಷತೆ & ಇತಿಹಾಸ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',

    addRecord: 'ದಾಖಲೆ ಸೇರಿಸಿ',
    uploadFile: 'ವರದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
    downloadPdf: 'PDF ಡೌನ್‌ಲೋಡ್',
    share: 'ಹಂಚಿಕೊಳ್ಳಿ',
    verify: 'ಪರಿಶೀಲಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    save: 'ಉಳಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
    delete: 'ಅಳಿಸಿ',
    filter: 'ಫಿಲ್ಟರ್',
    all: 'ಎಲ್ಲವೂ',
    back: 'ಹಿಂದೆ',
    search: 'ಹುಡುಕಿ',
    clear: 'ತೆರವುಗೊಳಿಸಿ',
    copy: 'ನಕಲಿಸಿ',
    copied: 'ನಕಲಿಸಲಾಗಿದೆ!',
    success: 'ಯಶಸ್ಸು',
    error: 'ದೋಷ',

    patientId: 'ಆರೋಗ್ಯ ಗುರುತು',
    abhaId: 'ಆಭಾ (ABHA) ಸಂಖ್ಯೆ',
    age: 'ವಯಸ್ಸು',
    years: 'ವರ್ಷಗಳು',
    bloodGroup: 'ರಕ್ತದ ಗುಂಪು',
    emergencyContact: 'ತುರ್ತು ಸಂಪರ್ಕ',
    primaryHospital: 'ಆಸ್ಪತ್ರೆ',
    primaryDoctor: 'ಮುಖ್ಯ ವೈದ್ಯರು',
    insuranceCard: 'ಆರೋಗ್ಯ ವಿಮೆ',
    activeRecordsCount: 'ಒಟ್ಟು ದಾಖಲೆಗಳು',
    vaccinesGivenCount: 'ಲಸಿಕೆ ಡೋಸ್‌ಗಳು',
    upcomingVisitsCount: 'ಮುಂಬರುವ ಭೇಟಿಗಳು',
    activeSharesCount: 'ಸಕ್ರಿಯ ಹಂಚಿಕೆಗಳು',

    quickAddRecord: 'ಹೊಸ ದಾಖಲೆ ಸೇರಿಸಿ',
    quickViewVaccines: 'ಲಸಿಕೆ ಪ್ರಮಾಣಪತ್ರಗಳು',
    quickShareDoctor: 'ವೈದ್ಯರಿಗೆ ಕಳುಹಿಸಿ',
    quickVerifyReport: 'ವರದಿ ಪರಿಶೀಲಿಸಿ',

    recordsTitle: 'ಡಿಜಿಟಲ್ ಆರೋಗ್ಯ ದಾಖಲೆಗಳು',
    recordsSubtitle: 'ನಿಮ್ಮ ಎಲ್ಲಾ ಲ್ಯಾಬ್ ವರದಿಗಳು ಮತ್ತು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು ಒಂದೇ ಸುರಕ್ಷಿತ ಸ್ಥಳದಲ್ಲಿ',
    allCategories: 'ಎಲ್ಲಾ ವಿಭಾಗಗಳು',
    labTest: 'ರಕ್ತ / ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆ',
    imagingXray: 'ಎಕ್ಸ್-ರೇ ಮತ್ತು ಸ್ಕ್ಯಾನ್‌ಗಳು',
    doctorNotes: 'ವೈದ್ಯರ ಟಿಪ್ಪಣಿಗಳು',
    prescriptions: 'ಔಷಧಿ ಚೀಟಿ (ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್)',
    dischargeSummary: 'ಡಿಸ್ಚಾರ್ಜ್ ಸಾರಾಂಶ',
    consultation: 'ಸಮಾಲೋಚನೆ',
    other: 'ಇತರ ದಾಖಲೆಗಳು',
    testName: 'ಪರೀಕ್ಷೆಯ ಹೆಸರು',
    doctorHospital: 'ವೈದ್ಯರು & ಆಸ್ಪತ್ರೆ',
    reportDate: 'ವರದಿಯ ದಿನಾಂಕ',
    integritySeal: 'ಡಿಜಿಟಲ್ ಮುದ್ರೆ',
    tamperProof: 'ಅಸಲಿ ಮತ್ತು ಸುರಕ್ಷಿತ',
    viewImage: 'ಚಿತ್ರ ನೋಡಿ',
    dicomViewer: 'ಸ್ಕ್ಯಾನ್ ವೀಕ್ಷಕವನ್ನು ತೆರೆಯಿರಿ',

    vaccinesTitle: 'ಲಸಿಕೆ ವಾಲೆಟ್',
    vaccinesSubtitle: 'ದೃಢೀಕೃತ ಲಸಿಕೆ ಇತಿಹಾಸ ಮತ್ತು ರಾಷ್ಟ್ರೀಯ ಪ್ರಮಾಣಪತ್ರಗಳು',
    completedDoses: 'ಪೂರ್ಣಗೊಂಡ ಡೋಸ್‌ಗಳು',
    upcomingVaccine: 'ಬಾಕಿ ಇರುವ ಲಸಿಕೆ',
    seasonalFlu: 'ಫ್ಲೂ ಲಸಿಕೆ',
    certificateNo: 'ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆ',
    beneficiaryName: 'ಫಲಾನುಭವಿಯ ಹೆಸರು',
    vaccineDose: 'ಲಸಿಕೆ ಡೋಸ್',
    administeredBy: 'ಲಸಿಕೆ ನೀಡಿದವರು',
    vaccinationCenter: 'ಲಸಿಕಾ ಕೇಂದ್ರ',
    logNewVaccine: 'ಹೊಸ ಲಸಿಕೆ ದಾಖಲಿಸಿ',
    cowinVerified: 'ಕೋವಿನ್ / ಡಿಜಿಟಲ್ ಇಂಡಿಯಾ ದೃಢೀಕರಿಸಲಾಗಿದೆ',

    remindersTitle: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ & ಔಷಧಿ ಜ್ಞಾಪನೆ',
    remindersSubtitle: 'ವೈದ್ಯರ ಭೇಟಿ ಅಥವಾ ದೈನಂದಿನ ಔಷಧಿಯ ಸಮಯವನ್ನು ಎಂದಿಗೂ ಮರೆಯಬೇಡಿ',
    scheduledVisits: 'ವೈದ್ಯರ ಭೇಟಿಗಳು',
    medicineTimings: 'ಔಷಧಿ ಸಮಯ',
    consultationFee: 'ಸಮಾಲೋಚನಾ ಶುಲ್ಕ',
    clinicHospital: 'ಕ್ಲಿನಿಕ್ / ಆಸ್ಪತ್ರೆ',
    bookVisit: 'ಹೊಸ ಭೇಟಿ ಬುಕ್ ಮಾಡಿ',
    markDone: 'ಔಷಧ ತೆಗೆದುಕೊಂಡೆ',
    snooze: 'ನಂತರ ನೆನಪಿಸಿ',

    sharingTitle: 'ವೈದ್ಯರೊಂದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಹಂಚಿಕೊಳ್ಳಿ',
    sharingSubtitle: 'ಸೀಮಿತ ಅವಧಿಗೆ ವೈದ್ಯರಿಗೆ ಅಥವಾ ಕುಟುಂಬಕ್ಕೆ ಸುರಕ್ಷಿತ ಪ್ರವೇಶ ನೀಡಿ',
    shareWithDoctor: 'ವೈದ್ಯರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ',
    shareWithFamily: 'ಕುಟುಂಬದೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಿ',
    accessDuration: 'ಪ್ರವೇಶದ ಅವಧಿ',
    oneHour: '1 ಗಂಟೆ',
    twentyFourHours: '24 ಗಂಟೆಗಳು',
    sevenDays: '7 ದಿನಗಳು',
    thirtyDays: '30 ದಿನಗಳು',
    generateAccessPin: 'ಪಿನ್ & QR ಕೋಡ್ ರಚಿಸಿ',
    activeShares: 'ಸಕ್ರಿಯ ಹಂಚಿಕೆ ಲಿಂಕ್‌ಗಳು',
    revokeAccess: 'ಪ್ರವೇಶ ರದ್ದುಗೊಳಿಸಿ',
    accessCode: 'ಸುರಕ್ಷತಾ ಪಿನ್',

    verificationTitle: 'ದಾಖಲೆ ಪರಿಶೀಲನೆ',
    verificationSubtitle: 'ಲ್ಯಾಬ್ ವರದಿ ಅಥವಾ ಲಸಿಕೆ ಪ್ರಮಾಣಪತ್ರ ಅಸಲಿಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ',
    verifyInstructions: 'ಡಿಜಿಟಲ್ ಸಹಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    checkTamperSeal: 'ಅಸಲಿಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ',
    documentHash: 'ಡಿಜಿಟಲ್ ಸಹಿ (SHA-256)',
    verificationSuccess: 'ಪರಿಶೀಲನೆ ಯಶಸ್ವಿ: ದಾಖಲೆಯು 100% ಅಸಲಿಯಾಗಿದೆ',
    authenticReport: 'ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ಕೇಂದ್ರದಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ',

    auditTitle: 'ಸುರಕ್ಷತೆ & ಇತಿಹಾಸ ದಾಖಲೆ',
    auditSubtitle: 'ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಯಾರು ನೋಡಿದ್ದಾರೆ ಮತ್ತು ಹಂಚಿಕೊಂಡಿದ್ದಾರೆ ಎಂಬ ವಿವರ',
    activityHistory: 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆಗಳು',
    deviceLocation: 'ಸಾಧನ ಮತ್ತು ಸ್ಥಳ',
    tamperProtection: 'ಸಂಪೂರ್ಣ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಿದ ಸುರಕ್ಷತೆ',
    actionDetails: 'ವಿವರಗಳು',

    settingsTitle: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು & ಸುರಕ್ಷತೆ',
    settingsSubtitle: 'ಭಾಷೆ, ಬಯೋಮೆಟ್ರಿಕ್ ಸುರಕ್ಷತೆ & ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    languageSection: 'ಆ್ಯಪ್ ಭಾಷೆ (Language)',
    biometricSection: 'ಬಯೋಮೆಟ್ರಿಕ್ ಅನ್‌ಲಾಕ್ (ಬೆರಳಚ್ಚು / ಫೇಸ್ ಐಡಿ)',
    biometricToggleLabel: 'ಬಯೋಮೆಟ್ರಿಕ್ ಲಾಕ್ ಕಡ್ಡಾಯಗೊಳಿಸಿ',
    biometricToggleDesc: 'ಆ್ಯಪ್ ತೆರೆಯಲು ಅಥವಾ ವರದಿಗಳನ್ನು ನೋಡಲು ಬೆರಳಚ್ಚು ಅಥವಾ ಫೇಸ್ ಐಡಿ ಬಳಸಿ',
    biometricEnforced: 'ಸಕ್ರಿಯ',
    biometricOptional: 'ಐಚ್ಛಿಕ',
    testBiometric: 'ಬಯೋಮೆಟ್ರಿಕ್ ಪರೀಕ್ಷಿಸಿ',
    abhaSection: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಹೆಲ್ತ್ ಅಕೌಂಟ್ (ABHA)',
    abhaDesc: 'ದೇಶದ ಎಲ್ಲಾ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಸಂಪರ್ಕಿಸುವ ನಿಮ್ಮ 14 ಅಂಕಿಗಳ ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಗುರುತು ಸಂಖ್ಯೆ',
    emergencyDetails: 'ತುರ್ತು ಮಾಹಿತಿ',
    notificationPreferences: 'ಸೂಚನೆ ಪ್ರಾಶಸ್ತ್ಯಗಳು',
    smsAlerts: 'SMS ಎಚ್ಚರಿಕೆಗಳು',
    whatsappAlerts: 'WhatsApp ಜ್ಞಾಪನೆಗಳು',

    biometricPromptTitle: 'ಬಯೋಮೆಟ್ರಿಕ್ ದೃಢೀಕರಣ',
    biometricPromptSubtitle: 'ಗುರುತು ದೃಢೀಕರಿಸಲು ದಯವಿಟ್ಟು ಸೆನ್ಸಾರ್ ಮೇಲೆ ಬೆರಳಿಡಿ',
    touchSensor: 'ಬೆರಳಚ್ಚು ಸೆನ್ಸಾರ್',
    faceUnlock: 'ಫೇಸ್ ಅನ್‌ಲಾಕ್',
    securityKey: 'ಸೆಕ್ಯುರಿಟಿ ಪಾಸ್‌ಕೀ',
    scanSensorButton: 'ಸೆನ್ಸಾರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ / ಪಿನ್ ನಮೂದಿಸಿ',
    passphraseFallback: 'ಮಾಸ್ಟರ್ ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ',
    authSuccessToast: 'ಬಯೋಮೆಟ್ರಿಕ್ ಯಶಸ್ವಿಯಾಗಿ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ.',

    signInTitle: 'ಸ್ವಾಸ್ಥ್ಯ ವಾಲೆಟ್‌ಗೆ ಸುಸ್ವಾಗತ',
    signInSubtitle: 'ಪ್ರತಿ ಭಾರತೀಯ ನಾಗರಿಕರಿಗಾಗಿ ಸರಳ ಮತ್ತು ಸುರಕ್ಷಿತ ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಲಾಕರ್',
    mobileOrAbha: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಆಭಾ ಐಡಿ',
    enterPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ OTP ನಮೂದಿಸಿ',
    loginButton: 'ಲಾಗಿನ್ ಮಾಡಿ / OTP ಪರಿಶೀಲಿಸಿ',
    createAccount: 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ',
    forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
    simpleTechnologyNote: 'ಪ್ರತಿಯೊಬ್ಬ ಭಾರತೀಯನಿಗೂ ಸರಳ ತಂತ್ರಜ್ಞಾನ • 12 ಭಾರತೀಯ ಭಾಷೆಗಳಲ್ಲಿ ಲಭ್ಯವಿದೆ',
  },

  ml: {
    appName: 'സ്വാസ്ഥ്യ വാലറ്റ്',
    appSubtitle: 'ഓരോ ഭാരതീയ പൗരനും വേണ്ടിയുള്ള ഡിജിറ്റൽ ഹെൽത്ത് ലോക്കർ',
    searchPlaceholder: 'പരിശോധനാ ഫലങ്ങൾ, ഡോക്ടർമാർ, മരുന്നുകൾ...',
    authGate: 'ലോഗിൻ / അക്കൗണ്ട്',
    notifications: 'അറിയിപ്പുകൾ',
    verifiedBadge: 'സ്ഥിരീകരിച്ചതും സുരക്ഷിതവും',
    desktopView: 'ഡെസ്ക്ടോപ്പ്',
    mobileView: 'മൊബൈൽ',
    selectLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    changeLanguage: 'ഭാഷ',

    dashboard: 'ഹോം ഡാഷ്‌ബോർഡ്',
    medicalRecords: 'ആരോഗ്യ രേഖകൾ',
    vaccinationWallet: 'വാക്സിൻ സർട്ടിഫിക്കറ്റുകൾ',
    remindersSchedule: 'അപ്പോയിന്റ്മെന്റുകളും മരുന്നുകളും',
    secureSharing: 'ഡോക്ടറുമായി പങ്കിടുക',
    documentVerification: 'രേഖകളുടെ പരിശോധന',
    securityAudit: 'സുരക്ഷയും ചരിത്രവും',
    settings: 'ക്രമീകരണങ്ങൾ',

    addRecord: 'രേഖ ചേർക്കുക',
    uploadFile: 'റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക',
    viewDetails: 'വിശദാംശങ്ങൾ കാണുക',
    downloadPdf: 'PDF ഡൗൺലോഡ്',
    share: 'പങ്കിടുക',
    verify: 'സ്ഥിരീകരിക്കുക',
    cancel: 'റദ്ദാക്കുക',
    save: 'സംരക്ഷിക്കുക',
    close: 'അടയ്ക്കുക',
    delete: 'നീക്കം ചെയ്യുക',
    filter: 'ഫിൽട്ടർ',
    all: 'എല്ലാം',
    back: 'പിന്നോട്ട്',
    search: 'തിരയുക',
    clear: 'മായ്ക്കുക',
    copy: 'പകർപ്പുക',
    copied: 'പകർത്തി!',
    success: 'വിജയം',
    error: 'പിശക്',

    patientId: 'ആരോഗ്യ തിരിച്ചറിയൽ',
    abhaId: 'ആഭ (ABHA) നമ്പർ',
    age: 'പ്രായം',
    years: 'വയസ്സ്',
    bloodGroup: 'രക്തഗ്രൂപ്പ്',
    emergencyContact: 'അടിയന്തര ബന്ധം',
    primaryHospital: 'ആശുപത്രി',
    primaryDoctor: 'പ്രധാന ഡോക്ടർ',
    insuranceCard: 'ആരോഗ്യ ഇൻഷുറൻസ്',
    activeRecordsCount: 'ആകെ രേഖകൾ',
    vaccinesGivenCount: 'വാക്സിൻ ഡോസുകൾ',
    upcomingVisitsCount: 'അടുത്ത സന്ദർശനങ്ങൾ',
    activeSharesCount: 'സജീവ ഷെയറുകൾ',

    quickAddRecord: 'പുതിയ രേഖ ചേർക്കുക',
    quickViewVaccines: 'വാക്സിൻ സർട്ടിഫിക്കറ്റ്',
    quickShareDoctor: 'ഡോക്ടർക്ക് അയക്കുക',
    quickVerifyReport: 'റിപ്പോർട്ട് പരിശോധിക്കുക',

    recordsTitle: 'ഡിജിറ്റൽ ആരോഗ്യ രേഖകൾ',
    recordsSubtitle: 'നിങ്ങളുടെ ലാബ് റിപ്പോർട്ടുകളും മരുന്നുകുറിപ്പുകളും സുരക്ഷിതമായി ഒരിടത്ത്',
    allCategories: 'എല്ലാ വിഭാഗങ്ങളും',
    labTest: 'രക്ത / ലാബ് പരിശോധന',
    imagingXray: 'എക്സ്-റേ & സ്കാനുകൾ',
    doctorNotes: 'ഡോക്ടറുടെ കുറിപ്പുകൾ',
    prescriptions: 'മരുന്നുകുറിപ്പ് (പ്രിസ്ക്രിപ്ഷൻ)',
    dischargeSummary: 'ഡിസ്ചാർജ് സംഗ്രഹം',
    consultation: 'കൂടിയാലോചന',
    other: 'മറ്റ് രേഖകൾ',
    testName: 'പരിശോധനയുടെ പേര്',
    doctorHospital: 'ഡോക്ടറും ആശുപത്രിയും',
    reportDate: 'റിപ്പോർട്ട് തീയതി',
    integritySeal: 'ഡിജിറ്റൽ മുദ്ര',
    tamperProof: 'യഥാർത്ഥവും സുരക്ഷിതവും',
    viewImage: 'ചിത്രം കാണുക',
    dicomViewer: 'സ്കാൻ വ്യൂവർ തുറക്കുക',

    vaccinesTitle: 'വാക്സിനേഷൻ വാലറ്റ്',
    vaccinesSubtitle: 'സ്ഥിരീകരിച്ച വാക്സിനേഷൻ ചരിത്രവും ദേശീയ സർട്ടിഫിക്കറ്റുകളും',
    completedDoses: 'പൂർത്തിയായ ഡോസുകൾ',
    upcomingVaccine: 'എടുക്കേണ്ട വാക്സിൻ',
    seasonalFlu: 'ഫ്ലൂ വാക്സിൻ',
    certificateNo: 'സർട്ടിഫിക്കറ്റ് നമ്പർ',
    beneficiaryName: 'ഗുണഭോക്താവിന്റെ പേര്',
    vaccineDose: 'വാക്സിൻ ഡോസ്',
    administeredBy: 'നൽകിയ ആൾ',
    vaccinationCenter: 'വാക്സിനേഷൻ കേന്ദ്രം',
    logNewVaccine: 'പുതിയ വാക്സിൻ ചേർക്കുക',
    cowinVerified: 'കോവിൻ / ഡിജിറ്റൽ ഇന്ത്യ പരിശോധിച്ചത്',

    remindersTitle: 'അപ്പോയിന്റ്മെന്റുകളും മരുന്ന് ഓർമ്മപ്പെടുത്തലും',
    remindersSubtitle: 'ഡോക്ടറുടെ അപ്പോയിന്റ്മെന്റോ ദിവസേനയുള്ള മരുന്നോ ഇനി ഒരിക്കലും മറക്കില്ല',
    scheduledVisits: 'ഡോക്ടർ അപ്പോയിന്റ്മെന്റുകൾ',
    medicineTimings: 'മരുന്ന് കഴിക്കേണ്ട സമയം',
    consultationFee: 'ഫീസ്',
    clinicHospital: 'ക്ലിനിക്ക് / ആശുപത്രി',
    bookVisit: 'പുതിയ സമയം ബുക്ക് ചെയ്യുക',
    markDone: 'മരുന്ന് കഴിച്ചു',
    snooze: 'പിന്നീട് ഓർമ്മിപ്പിക്കുക',

    sharingTitle: 'ഡോക്ടറുമായി സുരക്ഷിതമായി പങ്കിടുക',
    sharingSubtitle: 'നിശ്ചിത സമയത്തേക്ക് ഡോക്ടർക്കോ കുടുംബത്തിനോ സുരക്ഷിത അനുമതി നൽകുക',
    shareWithDoctor: 'ഡോക്ടറുമായി പങ്കിടുക',
    shareWithFamily: 'കുടുംബവുമായി പങ്കിടുക',
    accessDuration: 'അനുമതി കാലാവധി',
    oneHour: '1 മണിക്കൂർ',
    twentyFourHours: '24 മണിക്കൂർ',
    sevenDays: '7 ദിവസം',
    thirtyDays: '30 ദിവസം',
    generateAccessPin: 'പിൻ & QR കോഡ് നിർമ്മിക്കുക',
    activeShares: 'സജീവ ലിങ്കുകൾ',
    revokeAccess: 'അനുമതി റദ്ദാക്കുക',
    accessCode: 'സുരക്ഷാ പിൻ',

    verificationTitle: 'രേഖകളുടെ പരിശോധന',
    verificationSubtitle: 'റിപ്പോർട്ടോ സർട്ടിഫിക്കറ്റോ യഥാർത്ഥമാണോ എന്ന് പരിശോധിക്കുക',
    verifyInstructions: 'ഡിജിറ്റൽ ഒപ്പ് പരിശോധിക്കാൻ ഫയൽ അപ്‌ലോഡ് ചെയ്യുക',
    checkTamperSeal: 'യഥാർത്ഥമാണോ എന്ന് പരിശോധിക്കുക',
    documentHash: 'ഡിജിറ്റൽ ഒപ്പ് (SHA-256)',
    verificationSuccess: 'പരിശോധന വിജയിച്ചു: രേഖ 100% യഥാർത്ഥമാണ്',
    authenticReport: 'അംഗീകൃത മെഡിക്കൽ സെന്റർ സാക്ഷ്യപ്പെടുത്തിയത്',

    auditTitle: 'സുരക്ഷയും ചരിത്രവും',
    auditSubtitle: 'നിങ്ങളുടെ രേഖകൾ ആരെല്ലാം പരിശോധിച്ചു എന്നതിന്റെ പൂർണ്ണ വിവരം',
    activityHistory: 'സമീപകാല പ്രവർത്തനങ്ങൾ',
    deviceLocation: 'ഉപകരണവും സ്ഥലവും',
    tamperProtection: 'പൂർണ്ണ എൻക്രിപ്റ്റ് ചെയ്ത സുരക്ഷ',
    actionDetails: 'വിശദാംശങ്ങൾ',

    settingsTitle: 'ക്രമീകരണങ്ങളും സുരക്ഷയും',
    settingsSubtitle: 'ഭാഷ, ബയോമെട്രിക് സുരക്ഷ, അക്കൗണ്ട് ക്രമീകരണങ്ങൾ കൈകാര്യം ചെയ്യുക',
    languageSection: 'ആപ്പ് ഭാഷ (Language)',
    biometricSection: 'ബയോമെട്രിക് അൺലോക്ക് (വിരലടയാളം / ഫെയ്സ് ഐഡി)',
    biometricToggleLabel: 'ബയോമെട്രിക് ലോക്ക് നിർബന്ധമാക്കുക',
    biometricToggleDesc: 'ആപ്പ് തുറക്കാനും റിപ്പോർട്ടുകൾ കാണാനും വിരലടയാളമോ ഫെയ്സ് ഐഡിയോ ഉപയോഗിക്കുക',
    biometricEnforced: 'സജീവം',
    biometricOptional: 'ഐച്ഛികം',
    testBiometric: 'ബയോമെട്രിക് പരീക്ഷിക്കുക',
    abhaSection: 'ആയുഷ്മാൻ ഭാരത് ഹെൽത്ത് അക്കൗണ്ട് (ABHA)',
    abhaDesc: 'രാജ്യത്തെ എല്ലാ ആശുപത്രികളെയും ബന്ധിപ്പിക്കുന്ന നിങ്ങളുടെ 14 അക്ക ദേശീയ ആരോഗ്യ തിരിച്ചറിയൽ നമ്പർ',
    emergencyDetails: 'അടിയന്തര വിവരങ്ങൾ',
    notificationPreferences: 'അറിയിപ്പ് ക്രമീകരണങ്ങൾ',
    smsAlerts: 'എസ്എംഎസ് അറിയിപ്പുകൾ',
    whatsappAlerts: 'വാട്ട്‌സ്ആപ്പ് ഓർമ്മപ്പെടുത്തലുകൾ',

    biometricPromptTitle: 'ബയോമെട്രിക് പ്രാമാണീകരണം',
    biometricPromptSubtitle: 'തിരിച്ചറിയലിനായി സെൻസറിൽ വിരൽ അമർത്തുക',
    touchSensor: 'വിരലടയാള സെൻസർ',
    faceUnlock: 'ഫെയ്സ് അൺലോക്ക്',
    securityKey: 'സെക്യൂരിറ്റി പാസ്കീ',
    scanSensorButton: 'സെൻസർ സ്കാൻ ചെയ്യുക / പിൻ നൽകുക',
    passphraseFallback: 'മാസ്റ്റർ പാസ്‌വേഡ് ഉപയോഗിക്കുക',
    authSuccessToast: 'ബയോമെട്രിക് പരിശോധന വിജയകരം.',

    signInTitle: 'സ്വാസ്ഥ്യ വാലറ്റിലേക്ക് സ്വാഗതം',
    signInSubtitle: 'ഓരോ ഭാരതീയനും ലളിതവും സുരക്ഷിതവുമായ ഡിജിറ്റൽ ഹെൽത്ത് ലോക്കർ',
    mobileOrAbha: 'മൊബൈൽ നമ്പർ അല്ലെങ്കിൽ ആഭ ഐഡി',
    enterPassword: 'പാസ്‌വേഡ് അല്ലെങ്കിൽ ഒടിപി നൽകുക',
    loginButton: 'ലോഗിൻ ചെയ്യുക / ഒടിപി പരിശോധിക്കുക',
    createAccount: 'പുതിയ അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    forgotPassword: 'പാസ്‌വേഡ് മറന്നോ?',
    simpleTechnologyNote: 'എല്ലാ ഭാരതീയർക്കും ലളിതമായ സാങ്കേതികവിദ്യ • 12 ഭാരതീയ ഭാഷകളിൽ ലഭ്യമാണ്',
  },

  pa: {
    appName: 'ਸਵਾਸਥਿਆ ਵਾਲਿਟ',
    appSubtitle: 'ਹਰ ਭਾਰਤੀ ਨਾਗਰਿਕ ਲਈ ਡਿਜੀਟਲ ਹੈਲਥ ਲਾਕਰ',
    searchPlaceholder: 'ਟੈਸਟ, ਡਾਕਟਰ, ਦਵਾਈਆਂ, ਟੀਕੇ ਲੱਭੋ...',
    authGate: 'ਲਾਗ ਇਨ / ਖਾਤਾ',
    notifications: 'ਸੂਚਨਾਵਾਂ',
    verifiedBadge: 'ਪ੍ਰਮਾਣਿਤ ਅਤੇ ਸੁਰੱਖਿਅਤ',
    desktopView: 'ਡੈਸਕਟਾਪ',
    mobileView: 'ਮੋਬਾਈਲ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    changeLanguage: 'ਭਾਸ਼ਾ',

    dashboard: 'ਮੁੱਖ ਡੈਸ਼ਬੋਰਡ',
    medicalRecords: 'ਸਿਹਤ ਰਿਕਾਰਡ',
    vaccinationWallet: 'ਟੀਕਾਕਰਨ ਸਰਟੀਫਿਕੇਟ',
    remindersSchedule: 'ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਦਵਾਈਆਂ',
    secureSharing: 'ਡਾਕਟਰ ਨਾਲ ਸਾਂਝਾ ਕਰੋ',
    documentVerification: 'ਦਸਤਾਵੇਜ਼ ਤਸਦੀਕ',
    securityAudit: 'ਸੁਰੱਖਿਆ ਅਤੇ ਇਤਿਹਾਸ',
    settings: 'ਸੈਟਿੰਗਾਂ',

    addRecord: 'ਰਿਕਾਰਡ ਸ਼ਾਮਲ ਕਰੋ',
    uploadFile: 'ਰਿਪੋਰਟ ਅੱਪਲੋਡ ਕਰੋ',
    viewDetails: 'ਵੇਰਵੇ ਦੇਖੋ',
    downloadPdf: 'PDF ਡਾਊਨਲੋਡ',
    share: 'ਸਾਂਝਾ ਕਰੋ',
    verify: 'ਤਸਦੀਕ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    save: 'ਸੰਭਾਲੋ',
    close: 'ਬੰਦ ਕਰੋ',
    delete: 'ਮਿਟਾਓ',
    filter: 'ਫਿਲਟਰ',
    all: 'ਸਾਰੇ',
    back: 'ਪਿੱਛੇ',
    search: 'ਖੋਜੋ',
    clear: 'ਸਾਫ਼ ਕਰੋ',
    copy: 'ਕਾਪੀ ਕਰੋ',
    copied: 'ਕਾਪੀ ਹੋ ਗਿਆ!',
    success: 'ਸਫਲਤਾ',
    error: 'ਗਲਤੀ',

    patientId: 'ਸਿਹਤ ਪਛਾਣ',
    abhaId: 'ਆਭਾ (ABHA) ਨੰਬਰ',
    age: 'ਉਮਰ',
    years: 'ਸਾਲ',
    bloodGroup: 'ਬਲੱਡ ਗਰੁੱਪ',
    emergencyContact: 'ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ',
    primaryHospital: 'ਹਸਪਤਾਲ',
    primaryDoctor: 'ਮੁੱਖ ਡਾਕਟਰ',
    insuranceCard: 'ਸਿਹਤ ਬੀਮਾ',
    activeRecordsCount: 'ਕੁੱਲ ਰਿਕਾਰਡ',
    vaccinesGivenCount: 'ਟੀਕੇ ਦੀਆਂ ਖੁਰਾਕਾਂ',
    upcomingVisitsCount: 'ਆਉਣ ਵਾਲੀਆਂ ਮੁਲਾਕਾਤਾਂ',
    activeSharesCount: 'ਸਰਗਰਮ ਸ਼ੇਅਰ',

    quickAddRecord: 'ਨਵਾਂ ਰਿਕਾਰਡ ਜੋੜੋ',
    quickViewVaccines: 'ਟੀਕਾਕਰਨ ਸਰਟੀਫਿਕੇਟ',
    quickShareDoctor: 'ਡਾਕਟਰ ਨੂੰ ਭੇਜੋ',
    quickVerifyReport: 'ਰਿਪੋਰਟ ਚੈੱਕ ਕਰੋ',

    recordsTitle: 'ਡਿਜੀਟਲ ਸਿਹਤ ਰਿਕਾਰਡ',
    recordsSubtitle: 'ਤੁਹਾਡੀਆਂ ਸਾਰੀਆਂ ਲੈਬ ਰਿਪੋਰਟਾਂ ਅਤੇ ਪਰਚੀਆਂ ਇੱਕੋ ਸੁਰੱਖਿਅਤ ਥਾਂ ਤੇ',
    allCategories: 'ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ',
    labTest: 'ਖੂਨ / ਲੈਬ ਟੈਸਟ ਰਿਪੋਰਟ',
    imagingXray: 'ਐਕਸ-ਰੇ ਅਤੇ ਸਕੈਨ',
    doctorNotes: 'ਡਾਕਟਰ ਦੀ ਸਲਾਹ',
    prescriptions: 'ਦਵਾਈ ਦੀ ਪਰਚੀ',
    dischargeSummary: 'ਛੁੱਟੀ ਦਾ ਸਾਰਾਂਸ਼',
    consultation: 'ਸਲਾਹ',
    other: 'ਹੋਰ ਦਸਤਾਵੇਜ਼',
    testName: 'ਟੈਸਟ ਦਾ ਨਾਮ',
    doctorHospital: 'ਡਾਕਟਰ ਅਤੇ ਹਸਪਤਾਲ',
    reportDate: 'ਰਿਪੋਰਟ ਦੀ ਮਿਤੀ',
    integritySeal: 'ਡਿਜੀਟਲ ਮੋਹਰ',
    tamperProof: 'ਅਸਲੀ ਅਤੇ ਸੁਰੱਖਿਅਤ',
    viewImage: 'ਤਸਵੀਰ ਦੇਖੋ',
    dicomViewer: 'ਸਕੈਨ ਵਿਊਅਰ ਖੋਲ੍ਹੋ',

    vaccinesTitle: 'ਟੀਕਾਕਰਨ ਵਾਲਿਟ',
    vaccinesSubtitle: 'ਪ੍ਰਮਾਣਿਤ ਟੀਕਾਕਰਨ ਇਤਿਹਾਸ ਅਤੇ ਰਾਸ਼ਟਰੀ ਸਰਟੀਫਿਕੇਟ',
    completedDoses: 'ਪੂਰੀਆਂ ਖੁਰਾਕਾਂ',
    upcomingVaccine: 'ਬਾਕੀ ਟੀਕਾ',
    seasonalFlu: 'ਫਲੂ ਟੀਕਾ',
    certificateNo: 'ਸਰਟੀਫਿਕੇਟ ਨੰਬਰ',
    beneficiaryName: 'ਲਾਭਪਾਤਰੀ ਦਾ ਨਾਮ',
    vaccineDose: 'ਟੀਕੇ ਦੀ ਖੁਰਾਕ',
    administeredBy: 'ਟੀਕਾ ਲਗਾਉਣ ਵਾਲਾ',
    vaccinationCenter: 'ਟੀਕਾਕਰਨ ਕੇਂਦਰ',
    logNewVaccine: 'ਨਵਾਂ ਟੀਕਾ ਦਰਜ ਕਰੋ',
    cowinVerified: 'ਕੋਵਿਨ / ਡਿਜੀਟਲ ਇੰਡੀਆ ਪ੍ਰਮਾਣਿਤ',

    remindersTitle: 'ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਦਵਾਈਆਂ ਦਾ ਰੀਮਾਈਂਡਰ',
    remindersSubtitle: 'ਡਾਕਟਰ ਦੀ ਮੁਲਾਕਾਤ ਜਾਂ ਦਵਾਈ ਦਾ ਸਮਾਂ ਕਦੇ ਨਾ ਭੁੱਲੋ',
    scheduledVisits: 'ਡਾਕਟਰ ਮੁਲਾਕਾਤਾਂ',
    medicineTimings: 'ਦਵਾਈ ਦਾ ਸਮਾਂ',
    consultationFee: 'ਫੀਸ',
    clinicHospital: 'ਕਲੀਨਿਕ / ਹਸਪਤਾਲ',
    bookVisit: 'ਨਵੀਂ ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ',
    markDone: 'ਦਵਾਈ ਲੈ ਲਈ',
    snooze: 'ਬਾਅਦ ਵਿੱਚ ਯਾਦ ਕਰਵਾਓ',

    sharingTitle: 'ਡਾਕਟਰ ਨਾਲ ਸੁਰੱਖਿਅਤ ਸਾਂਝਾ ਕਰੋ',
    sharingSubtitle: 'ਸੀਮਤ ਸਮੇਂ ਲਈ ਡਾਕਟਰ ਜਾਂ ਪਰਿਵਾਰ ਨੂੰ ਸੁਰੱਖਿਅਤ ਪਹੁੰਚ ਦਿਓ',
    shareWithDoctor: 'ਡਾਕਟਰ ਨਾਲ ਸਾਂਝਾ ਕਰੋ',
    shareWithFamily: 'ਪਰਿਵਾਰ ਨਾਲ ਸਾਂਝਾ ਕਰੋ',
    accessDuration: 'ਪਹੁੰਚ ਦੀ ਮਿਆਦ',
    oneHour: '1 ਘੰਟਾ',
    twentyFourHours: '24 ਘੰਟੇ',
    sevenDays: '7 ਦਿਨ',
    thirtyDays: '30 ਦਿਨ',
    generateAccessPin: 'ਪਿੰਨ ਅਤੇ QR ਕੋਡ ਬਣਾਓ',
    activeShares: 'ਸਰਗਰਮ ਸ਼ੇਅਰ ਲਿੰਕ',
    revokeAccess: 'ਪਹੁੰਚ ਰੱਦ ਕਰੋ',
    accessCode: 'ਸੁਰੱਖਿਆ ਪਿੰਨ',

    verificationTitle: 'ਦਸਤਾਵੇਜ਼ ਤਸਦੀਕ',
    verificationSubtitle: 'ਚੈੱਕ ਕਰੋ ਕਿ ਲੈਬ ਰਿਪੋਰਟ ਜਾਂ ਸਰਟੀਫਿਕੇਟ ਅਸਲੀ ਹੈ ਜਾਂ ਨਹੀਂ',
    verifyInstructions: 'ਡਿਜੀਟਲ ਦਸਤਖਤ ਚੈੱਕ ਕਰਨ ਲਈ ਫਾਈਲ ਅੱਪਲੋਡ ਕਰੋ',
    checkTamperSeal: 'ਅਸਲੀਅਤ ਚੈੱਕ ਕਰੋ',
    documentHash: 'ਡਿਜੀਟਲ ਦਸਤਖਤ (SHA-256)',
    verificationSuccess: 'ਤਸਦੀਕ ਸਫਲ: ਦਸਤਾਵੇਜ਼ 100% ਅਸਲੀ ਹੈ',
    authenticReport: 'ਅਧਿਕਾਰਤ ਮੈਡੀਕਲ ਸੈਂਟਰ ਦੁਆਰਾ ਪ੍ਰਮਾਣਿਤ',

    auditTitle: 'ਸੁਰੱਖਿਆ ਅਤੇ ਇਤਿਹਾਸ',
    auditSubtitle: 'ਤੁਹਾਡੇ ਰਿਕਾਰਡ ਕਿਸਨੇ ਦੇਖੇ ਅਤੇ ਸਾਂਝੇ ਕੀਤੇ ਇਸਦਾ ਪੂਰਾ ਵੇਰਵਾ',
    activityHistory: 'ਹਾਲੀਆ ਗਤੀਵਿਧੀਆਂ',
    deviceLocation: 'ਯੰਤਰ ਅਤੇ ਸਥਾਨ',
    tamperProtection: 'ਪੂਰੀ ਤਰ੍ਹਾਂ ਇਨਕ੍ਰਿਪਟਡ ਸੁਰੱਖਿਆ',
    actionDetails: 'ਵੇਰਵੇ',

    settingsTitle: 'ਸੈਟਿੰਗਾਂ ਅਤੇ ਸੁਰੱਖਿਆ',
    settingsSubtitle: 'ਆਪਣੀ ਭਾਸ਼ਾ, ਬਾਇਓਮੈਟ੍ਰਿਕ ਸੁਰੱਖਿਆ ਅਤੇ ਖਾਤਾ ਪ੍ਰਬੰਧਿਤ ਕਰੋ',
    languageSection: 'ਐਪ ਦੀ ਭਾਸ਼ਾ (Language)',
    biometricSection: 'ਬਾਇਓਮੈਟ੍ਰਿਕ ਅਨਲੌਕ (ਫਿੰਗਰਪ੍ਰਿੰਟ / ਫੇਸ ਆਈਡੀ)',
    biometricToggleLabel: 'ਬਾਇਓਮੈਟ੍ਰਿਕ ਲਾਕ ਲਾਜ਼ਮੀ ਕਰੋ',
    biometricToggleDesc: 'ਐਪ ਖੋਲ੍ਹਣ ਜਾਂ ਰਿਪੋਰਟਾਂ ਦੇਖਣ ਲਈ ਫਿੰਗਰਪ੍ਰਿੰਟ ਜਾਂ ਫੇਸ ਆਈਡੀ ਵਰਤੋ',
    biometricEnforced: 'ਲਾਗੂ ਹੈ',
    biometricOptional: 'ਵਿਕਲਪਿਕ',
    testBiometric: 'ਬਾਇਓਮੈਟ੍ਰਿਕ ਦੀ ਜਾਂਚ ਕਰੋ',
    abhaSection: 'ਆਯੁਸ਼ਮਾਨ ਭਾਰਤ ਹੈਲਥ ਅਕਾਊਂਟ (ABHA)',
    abhaDesc: 'ਦੇਸ਼ ਭਰ ਦੇ ਹਸਪਤਾਲਾਂ ਨੂੰ ਜੋੜਨ ਵਾਲਾ ਤੁਹਾਡਾ 14 ਅੰਕਾਂ ਦਾ ਰਾਸ਼ਟਰੀ ਸਿਹਤ ਨੰਬਰ',
    emergencyDetails: 'ਐਮਰਜੈਂਸੀ ਜਾਣਕਾਰੀ',
    notificationPreferences: 'ਸੂਚਨਾ ਸੈਟਿੰਗਾਂ',
    smsAlerts: 'SMS ਚੇਤਾਵਨੀਆਂ',
    whatsappAlerts: 'WhatsApp ਰੀਮਾਈਂਡਰ',

    biometricPromptTitle: 'ਬਾਇਓਮੈਟ੍ਰਿਕ ਪ੍ਰਮਾਣੀਕਰਨ',
    biometricPromptSubtitle: 'ਆਪਣੀ ਪਛਾਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰਨ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਸੈਂਸਰ ਤੇ ਉਂਗਲ ਰੱਖੋ',
    touchSensor: 'ਫਿੰਗਰਪ੍ਰਿੰਟ ਸੈਂਸਰ',
    faceUnlock: 'ਫੇਸ ਅਨਲੌਕ',
    securityKey: 'ਸੁਰੱਖਿਆ ਪਾਸ-ਕੀ',
    scanSensorButton: 'ਸੈਂਸਰ ਸਕੈਨ ਕਰੋ / ਪਿੰਨ ਦਰਜ ਕਰੋ',
    passphraseFallback: 'ਮਾਸਟਰ ਪਾਸਵਰਡ ਵਰਤੋ',
    authSuccessToast: 'ਬਾਇਓਮੈਟ੍ਰਿਕ ਸਫਲਤਾਪੂਰਵਕ ਤਸਦੀਕ ਹੋ ਗਿਆ।',

    signInTitle: 'ਸਵਾਸਥਿਆ ਵਾਲਿਟ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ',
    signInSubtitle: 'ਹਰ ਭਾਰਤੀ ਨਾਗਰਿਕ ਲਈ ਆਸਾਨ ਅਤੇ ਸੁਰੱਖਿਅਤ ਡਿਜੀਟਲ ਹੈਲਥ ਲਾਕਰ',
    mobileOrAbha: 'ਮੋਬਾਈਲ ਨੰਬਰ ਜਾਂ ਆਭਾ ਆਈਡੀ',
    enterPassword: 'ਪਾਸਵਰਡ ਜਾਂ OTP ਦਰਜ ਕਰੋ',
    loginButton: 'ਲਾਗ ਇਨ ਕਰੋ / OTP ਤਸਦੀਕ ਕਰੋ',
    createAccount: 'ਨਵਾਂ ਖਾਤਾ ਬਣਾਓ',
    forgotPassword: 'ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?',
    simpleTechnologyNote: 'ਹਰ ਭਾਰਤੀ ਲਈ ਸਰਲ ਤਕਨਾਲੋਜੀ • 12 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਉਪਲਬਧ',
  },

  or: {
    appName: 'ସ୍ୱାସ୍ଥ୍ୟ ୱାଲେଟ୍',
    appSubtitle: 'ପ୍ରତ୍ୟେକ ଭାରତୀୟ ନାଗରିକଙ୍କ ପାଇଁ ଡିଜିଟାଲ୍ ହେଲଥ୍ ଲକର୍',
    searchPlaceholder: 'ଟେଷ୍ଟ୍, ଡାକ୍ତର, ଔଷଧ, ଟିକା ଖୋଜନ୍ତୁ...',
    authGate: 'ଲଗ୍ ଇନ୍ / ଆକାଉଣ୍ଟ',
    notifications: 'ସୂଚନା',
    verifiedBadge: 'ପ୍ରମାଣିତ ଓ ସୁରକ୍ଷିତ',
    desktopView: 'ଡେସ୍କଟପ୍',
    mobileView: 'ମୋବାଇଲ୍',
    selectLanguage: 'ଭାଷା ବାଛନ୍ତୁ',
    changeLanguage: 'ଭାଷା',

    dashboard: 'ମୁଖ୍ୟ ଡ୍ୟାସବୋର୍ଡ',
    medicalRecords: 'ସ୍ୱାସ୍ଥ୍ୟ ରେକର୍ଡ',
    vaccinationWallet: 'ଟୀକାକରଣ ପ୍ରମାଣପତ୍ର',
    remindersSchedule: 'ସାକ୍ଷାତ ଓ ଔଷଧ',
    secureSharing: 'ଡାକ୍ତରଙ୍କ ସହ ସେୟାର୍',
    documentVerification: 'ଦସ୍ତାବିଜ୍ ଯାଞ୍ଚ',
    securityAudit: 'ସୁରକ୍ଷା ଓ ଇତିହାସ',
    settings: 'ସେଟିଙ୍ଗ୍ସ',

    addRecord: 'ରେକର୍ଡ ଯୋଡନ୍ତୁ',
    uploadFile: 'ରିପୋର୍ଟ ଅପଲୋଡ୍ କରନ୍ତୁ',
    viewDetails: 'ବିବରଣୀ ଦେଖନ୍ତୁ',
    downloadPdf: 'PDF ଡାଉନଲୋଡ୍',
    share: 'ସେୟାର୍ କରନ୍ତୁ',
    verify: 'ଯାଞ୍ଚ କରନ୍ତୁ',
    cancel: 'ବାତିଲ୍',
    save: 'ସାଇତନ୍ତୁ',
    close: 'ବନ୍ଦ କରନ୍ତୁ',
    delete: 'ହଟାନ୍ତୁ',
    filter: 'ଫିଲ୍ଟର୍',
    all: 'ସମସ୍ତ',
    back: 'ପଛକୁ',
    search: 'ଖୋଜନ୍ତୁ',
    clear: 'ସଫା କରନ୍ତୁ',
    copy: 'କପି କରନ୍ତୁ',
    copied: 'କପି ହୋଇଗଲା!',
    success: 'ସଫଳତା',
    error: 'ତ୍ରୁଟି',

    patientId: 'ସ୍ୱାସ୍ଥ୍ୟ ପରିଚୟ',
    abhaId: 'ଆଭା (ABHA) ନମ୍ବର',
    age: 'ବୟସ',
    years: 'ବର୍ଷ',
    bloodGroup: 'ରକ୍ତ ବର୍ଗ',
    emergencyContact: 'ଜରୁରୀକାଳୀନ ଯୋଗାଯୋଗ',
    primaryHospital: 'ଡାକ୍ତରଖାନା',
    primaryDoctor: 'ମୁଖ୍ୟ ଡାକ୍ତର',
    insuranceCard: 'ସ୍ୱାସ୍ଥ୍ୟ ବୀମା',
    activeRecordsCount: 'ମୋଟ ରେକର୍ଡ',
    vaccinesGivenCount: 'ଟିକା ଡୋଜ୍',
    upcomingVisitsCount: 'ଆଗାମୀ ସାକ୍ଷାତ',
    activeSharesCount: 'ସକ୍ରିୟ ସେୟାର୍',

    quickAddRecord: 'ନୂଆ ରେକର୍ଡ ଯୋଡନ୍ତୁ',
    quickViewVaccines: 'ଟିକା ପ୍ରମାଣପତ୍ର',
    quickShareDoctor: 'ଡାକ୍ତରଙ୍କୁ ପଠାନ୍ତୁ',
    quickVerifyReport: 'ରିପୋର୍ଟ ଯାଞ୍ଚ କରନ୍ତୁ',

    recordsTitle: 'ଡିଜିଟାଲ୍ ସ୍ୱାସ୍ଥ୍ୟ ରେକର୍ଡ',
    recordsSubtitle: 'ଆପଣଙ୍କର ସମସ୍ତ ଲ୍ୟାବ୍ ରିପୋର୍ଟ ଓ ପ୍ରେସକ୍ରିପସନ୍ ଗୋଟିଏ ସୁରକ୍ଷିତ ସ୍ଥାନରେ',
    allCategories: 'ସମସ୍ତ ବର୍ଗ',
    labTest: 'ରକ୍ତ / ଲ୍ୟାବ୍ ପରୀକ୍ଷା',
    imagingXray: 'ଏକ୍ସ-ରେ ଏବଂ ସ୍କାନ୍',
    doctorNotes: 'ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ',
    prescriptions: 'ଔଷଧ ଚିଠା (ପ୍ରେସକ୍ରିପସନ୍)',
    dischargeSummary: 'ଡିସଚାର୍ଜ ସାରାଂଶ',
    consultation: 'ପରାମର୍ଶ',
    other: 'ଅନ୍ୟାନ୍ୟ ଦସ୍ତାବିଜ୍',
    testName: 'ପରୀକ୍ଷାର ନାମ',
    doctorHospital: 'ଡାକ୍ତର ଓ ଡାକ୍ତରଖାନା',
    reportDate: 'ରିପୋର୍ଟ ତାରିଖ',
    integritySeal: 'ଡିଜିଟାଲ୍ ମୋହର',
    tamperProof: 'ପ୍ରକୃତ ଓ ସୁରକ୍ଷିତ',
    viewImage: 'ଫଟୋ ଦେଖନ୍ତୁ',
    dicomViewer: 'ସ୍କାନ୍ ଭିଉଅର୍ ଖୋଲନ୍ତୁ',

    vaccinesTitle: 'ଟୀକାକରଣ ୱାଲେଟ୍',
    vaccinesSubtitle: 'ପ୍ରମାଣିତ ଟୀକାକରଣ ଇତିହାସ ଏବଂ ଜାତୀୟ ପ୍ରମାଣପତ୍ର',
    completedDoses: 'ସମ୍ପୂର୍ଣ୍ଣ ଡୋଜ୍',
    upcomingVaccine: 'ବାକି ଥିବା ଟିକା',
    seasonalFlu: 'ଫ୍ଲୁ ଟିକା',
    certificateNo: 'ପ୍ରମାଣପତ୍ର ନମ୍ବର',
    beneficiaryName: 'ହିତାଧିକାରୀଙ୍କ ନାମ',
    vaccineDose: 'ଟିକା ଡୋଜ୍',
    administeredBy: 'ଟିକା ଦେଇଥିବା ବ୍ୟକ୍ତି',
    vaccinationCenter: 'ଟୀକାକରଣ କେନ୍ଦ୍ର',
    logNewVaccine: 'ନୂଆ ଟିକା ଯୋଡନ୍ତୁ',
    cowinVerified: 'କୋୱିନ୍ / ଡିଜିଟାଲ୍ ଇଣ୍ଡିଆ ପ୍ରମାଣିତ',

    remindersTitle: 'ସାକ୍ଷାତ ଓ ଔଷଧ ସୂଚକ',
    remindersSubtitle: 'ଡାକ୍ତରଙ୍କ ସାକ୍ଷାତ କିମ୍ବା ଦୈନନ୍ଦିନ ଔଷଧର ସମୟ କେବେ ଭୁଲନ୍ତୁ ନାହିଁ',
    scheduledVisits: 'ଡାକ୍ତର ସାକ୍ଷାତ',
    medicineTimings: 'ଔଷଧ ଖାଇବା ସମୟ',
    consultationFee: 'ପରାମର୍ଶ ଫି',
    clinicHospital: 'କ୍ଲିନିକ୍ / ଡାକ୍ତରଖାନା',
    bookVisit: 'ନୂଆ ସାକ୍ଷାତ ବୁକ୍ କରନ୍ତୁ',
    markDone: 'ଔଷଧ ଖାଇଲି',
    snooze: 'ପରେ ମନେ ପକାନ୍ତୁ',

    sharingTitle: 'ଡାକ୍ତରଙ୍କ ସହ ସୁରକ୍ଷିତ ସେୟାର୍ କରନ୍ତୁ',
    sharingSubtitle: 'ସୀମିତ ସମୟ ପାଇଁ ଡାକ୍ତର କିମ୍ବା ପରିବାରକୁ ସୁରକ୍ଷିତ ପ୍ରବେଶ ଅଧିକାର ଦିଅନ୍ତୁ',
    shareWithDoctor: 'ଡାକ୍ତରଙ୍କ ସହ ସେୟାର୍',
    shareWithFamily: 'ପରିବାର ସହ ସେୟାର୍',
    accessDuration: 'ସମୟସୀମା',
    oneHour: '1 ଘଣ୍ଟା',
    twentyFourHours: '24 ଘଣ୍ଟା',
    sevenDays: '7 ଦିନ',
    thirtyDays: '30 ଦିନ',
    generateAccessPin: 'ପିନ୍ ଓ QR କୋଡ୍ ତିଆରି କରନ୍ତୁ',
    activeShares: 'ସକ୍ରିୟ ସେୟାର୍ ଲିଙ୍କ୍',
    revokeAccess: 'ପ୍ରବେଶ ବାତିଲ୍ କରନ୍ତୁ',
    accessCode: 'ସୁରକ୍ଷା ପିନ୍',

    verificationTitle: 'ଦସ୍ତାବିଜ୍ ଯାଞ୍ଚ',
    verificationSubtitle: 'ଲ୍ୟାବ୍ ରିପୋର୍ଟ ବା ପ୍ରମାଣପତ୍ର ପ୍ରକୃତ କି ନୁହେଁ ଯାଞ୍ଚ କରନ୍ତୁ',
    verifyInstructions: 'ଡିଜିଟାଲ୍ ଦସ୍ତଖତ ଯାଞ୍ଚ ପାଇଁ ଫାଇଲ୍ ଅପଲୋଡ୍ କରନ୍ତୁ',
    checkTamperSeal: 'ଅସଲି କି ନୁହେଁ ଯାଞ୍ଚ କରନ୍ତୁ',
    documentHash: 'ଡିଜିଟାଲ୍ ଦସ୍ତଖତ (SHA-256)',
    verificationSuccess: 'ଯାଞ୍ଚ ସଫଳ: ଦସ୍ତାବିଜ୍ 100% ପ୍ରକୃତ',
    authenticReport: 'ଅନୁମୋଦିତ ଚିକିତ୍ସା କେନ୍ଦ୍ର ଦ୍ୱାରା ପ୍ରମାଣିତ',

    auditTitle: 'ସୁରକ୍ଷା ଓ ଇତିହାସ ଲଗ୍',
    auditSubtitle: 'ଆପଣଙ୍କ ରେକର୍ଡ କିଏ ଦେଖିଲେ ଓ ସେୟାର୍ କଲେ ତାର ବିବରଣୀ',
    activityHistory: 'ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ',
    deviceLocation: 'ଉପକରଣ ଓ ସ୍ଥାନ',
    tamperProtection: 'ସମ୍ପୂର୍ଣ୍ଣ ଏନକ୍ରିପ୍ଟେଡ୍ ସୁରକ୍ଷା',
    actionDetails: 'ବିବରଣୀ',

    settingsTitle: 'ସେଟିଙ୍ଗ୍ସ ଓ ସୁରକ୍ଷା',
    settingsSubtitle: 'ଭାଷା, ବାୟୋମେଟ୍ରିକ୍ ସୁରକ୍ଷା ଓ ଆକାଉଣ୍ଟ ପରିଚାଳନା କରନ୍ତୁ',
    languageSection: 'ଆପ୍ ଭାଷା (Language)',
    biometricSection: 'ବାୟୋମେଟ୍ରିକ୍ ଅନଲକ୍ (ଆଙ୍ଗୁଠି ଚିହ୍ନ / ଫେସ୍ ଆଇଡି)',
    biometricToggleLabel: 'ବାୟୋମେଟ୍ରିକ୍ ଲକ୍ ବାଧ୍ୟତାମୂଳକ କରନ୍ତୁ',
    biometricToggleDesc: 'ଆପ୍ ଖୋଲିବାକୁ ବା ରିପୋର୍ଟ ଦେଖିବାକୁ ଆଙ୍ଗୁଠି ଚିହ୍ନ କିମ୍ବା ଫେସ୍ ଆଇଡି ବ୍ୟବହାର କରନ୍ତୁ',
    biometricEnforced: 'ସକ୍ରିୟ',
    biometricOptional: 'ଇଚ୍ଛାଧୀନ',
    testBiometric: 'ବାୟୋମେଟ୍ରିକ୍ ପରୀକ୍ଷା କରନ୍ତୁ',
    abhaSection: 'ଆୟୁଷ୍ମାନ ଭାରତ ହେଲଥ୍ ଆକାଉଣ୍ଟ (ABHA)',
    abhaDesc: 'ଦେଶର ସମସ୍ତ ଡାକ୍ତରଖାନାକୁ ଯୋଡୁଥିବା ଆପଣଙ୍କ 14 ଅଙ୍କ ବିଶିଷ୍ଟ ଜାତୀୟ ସ୍ୱାସ୍ଥ୍ୟ ପରିଚୟ ନମ୍ବର',
    emergencyDetails: 'ଜରୁରୀକାଳୀନ ସୂଚନା',
    notificationPreferences: 'ସୂଚନା ପସନ୍ଦ',
    smsAlerts: 'SMS ସତର୍କତା',
    whatsappAlerts: 'WhatsApp ମନେପକାଣି',

    biometricPromptTitle: 'ବାୟୋମେଟ୍ରିକ୍ ପ୍ରମାଣୀକରଣ',
    biometricPromptSubtitle: 'ନିଜ ପରିଚୟ ପ୍ରମାଣିତ କରିବାକୁ ସେନସରରେ ଆଙ୍ଗୁଠି ରଖନ୍ତୁ',
    touchSensor: 'ଫିଙ୍ଗରପ୍ରିଣ୍ଟ ସେନସର୍',
    faceUnlock: 'ଫେସ୍ ଅନଲକ୍',
    securityKey: 'ସୁରକ୍ଷା ପାସକି',
    scanSensorButton: 'ସେନସର୍ ସ୍କାନ୍ କରନ୍ତୁ / ପିନ୍ ଦିଅନ୍ତୁ',
    passphraseFallback: 'ମାଷ୍ଟର୍ ପାସୱାର୍ଡ ବ୍ୟବହାର କରନ୍ତୁ',
    authSuccessToast: 'ବାୟୋମେଟ୍ରିକ୍ ସଫଳତାର ସହ ଯାଞ୍ଚ ହେଲା।',

    signInTitle: 'ସ୍ୱାସ୍ଥ୍ୟ ୱାଲେଟକୁ ସ୍ୱାଗତ',
    signInSubtitle: 'ପ୍ରତ୍ୟେକ ଭାରତୀୟ ନାଗରିକଙ୍କ ପାଇଁ ସରଳ ଓ ସୁରକ୍ଷିତ ଡିଜିଟାଲ୍ ସ୍ୱାସ୍ଥ୍ୟ ଲକର୍',
    mobileOrAbha: 'ମୋବାଇଲ୍ ନମ୍ବର ବା ଆଭା ଆଇଡି',
    enterPassword: 'ପାସୱାର୍ଡ ବା OTP ଦିଅନ୍ତୁ',
    loginButton: 'ଲଗ୍ ଇନ୍ କରନ୍ତୁ / OTP ଯାଞ୍ଚ କରନ୍ତୁ',
    createAccount: 'ନୂଆ ଆକାଉଣ୍ଟ ତିଆରି କରନ୍ତୁ',
    forgotPassword: 'ପାସୱାର୍ଡ ଭୁଲିଗଲେ କି?',
    simpleTechnologyNote: 'ପ୍ରତ୍ୟେକ ଭାରତୀୟଙ୍କ ପାଇଁ ସହଜ ଟେକ୍ନୋଲୋଜି • 12 ଟି ଭାରତୀୟ ଭାଷାରେ ଉପଲବ୍ଧ',
  },

  ur: {
    appName: 'سوستھیہ والیٹ',
    appSubtitle: 'ہر ہندوستانی شہری کے لیے ڈیجیٹل ہیلتھ لاکر',
    searchPlaceholder: 'ٹیسٹ، ڈاکٹر، دوائیں، ٹیکے تلاش کریں...',
    authGate: 'لاگ ان / اکاؤنٹ',
    notifications: 'اطلاعات',
    verifiedBadge: 'تصدیق شدہ اور محفوظ',
    desktopView: 'ڈیسک ٹاپ',
    mobileView: 'موبائل',
    selectLanguage: 'زبان منتخب کریں',
    changeLanguage: 'زبان',

    dashboard: 'ہوم ڈیش بورڈ',
    medicalRecords: 'صحت کے ریکارڈ',
    vaccinationWallet: 'ویکسینیشن سرٹیفکیٹ',
    remindersSchedule: 'ملاقاتیں اور ادویات',
    secureSharing: 'ڈاکٹر کے ساتھ شیئر کریں',
    documentVerification: 'دستاویز کی تصدیق',
    securityAudit: 'سیکیورٹی اور تاریخ',
    settings: 'ترتیبات',

    addRecord: 'ریکارڈ شامل کریں',
    uploadFile: 'رپورٹ اپ لوڈ کریں',
    viewDetails: 'تفصیلات دیکھیں',
    downloadPdf: 'PDF ڈاؤن لوڈ کریں',
    share: 'شیئر کریں',
    verify: 'تصدیق کریں',
    cancel: 'منسوخ کریں',
    save: 'محفوظ کریں',
    close: 'بند کریں',
    delete: 'حذف کریں',
    filter: 'فلٹر',
    all: 'سبھی',
    back: 'واپس',
    search: 'تلاش کریں',
    clear: 'صاف کریں',
    copy: 'کاپی کریں',
    copied: 'کاپی ہو گیا!',
    success: 'کامیابی',
    error: 'خرابی',

    patientId: 'صحت کی شناخت',
    abhaId: 'آبھا (ABHA) نمبر',
    age: 'عمر',
    years: 'سال',
    bloodGroup: 'بلڈ گروپ',
    emergencyContact: 'ہنگامی رابطہ',
    primaryHospital: 'ہسپتال',
    primaryDoctor: 'بنیادی ڈاکٹر',
    insuranceCard: 'صحت کا بیمہ',
    activeRecordsCount: 'کل ریکارڈز',
    vaccinesGivenCount: 'ویکسین کی خوراکیں',
    upcomingVisitsCount: 'آئندہ ملاقاتیں',
    activeSharesCount: 'فعال شیئرز',

    quickAddRecord: 'نیا ریکارڈ شامل کریں',
    quickViewVaccines: 'ویکسینیشن سرٹیفکیٹ',
    quickShareDoctor: 'ڈاکٹر کو بھیجیں',
    quickVerifyReport: 'رپورٹ کی جانچ کریں',

    recordsTitle: 'ڈیجیٹل ہیلتھ ریکارڈز',
    recordsSubtitle: 'آپ کی تمام لیب رپورٹس اور نسخے ایک ہی محفوظ جگہ پر',
    allCategories: 'تمام اقسام',
    labTest: 'خون / لیب ٹیسٹ رپورٹ',
    imagingXray: 'ایکس رے اور اسکین',
    doctorNotes: 'ڈاکٹر کے نوٹس',
    prescriptions: 'نسخہ (دوا کی پرچی)',
    dischargeSummary: 'ڈسچارج کا خلاصہ',
    consultation: 'مشورہ',
    other: 'دیگر دستاویزات',
    testName: 'ٹیسٹ کا نام',
    doctorHospital: 'ڈاکٹر اور ہسپتال',
    reportDate: 'رپورٹ کی تاریخ',
    integritySeal: 'ڈیجیٹل مہر',
    tamperProof: 'اصل اور محفوظ',
    viewImage: 'تصویر دیکھیں',
    dicomViewer: 'اسکین ویور کھولیں',

    vaccinesTitle: 'ویکسینیشن والیٹ',
    vaccinesSubtitle: 'تصدیق شدہ ویکسینیشن تاریخ اور قومی سرٹیفکیٹس',
    completedDoses: 'مکمل خوراکیں',
    upcomingVaccine: 'باقی ویکسین',
    seasonalFlu: 'فلو ویکسین',
    certificateNo: 'سرٹیفکیٹ نمبر',
    beneficiaryName: 'فائدہ اٹھانے والے کا نام',
    vaccineDose: 'ویکسین کی خوراک',
    administeredBy: 'لگانے والا',
    vaccinationCenter: 'ویکسینیشن سینٹر',
    logNewVaccine: 'نئی ویکسین شامل کریں',
    cowinVerified: 'کوون / ڈیجیٹل انڈیا سے تصدیق شدہ',

    remindersTitle: 'ملاقاتیں اور ادویات کا شیڈول',
    remindersSubtitle: 'ڈاکٹر سے ملاقات یا روزانہ کی دوا کا وقت کبھی نہ بھولیں',
    scheduledVisits: 'ڈاکٹر کی ملاقاتیں',
    medicineTimings: 'دوا کا وقت',
    consultationFee: 'مشاورت کی فیس',
    clinicHospital: 'کلینک / ہسپتال',
    bookVisit: 'نئی ملاقات طے کریں',
    markDone: 'دوا لے لی',
    snooze: 'بعد میں یاد دلائیں',

    sharingTitle: 'ڈاکٹر کے ساتھ محفوظ شیئرنگ',
    sharingSubtitle: 'محدود وقت کے لیے ڈاکٹر یا خاندان کو محفوظ رسائی دیں',
    shareWithDoctor: 'ڈاکٹر کے ساتھ شیئر کریں',
    shareWithFamily: 'خاندان کے ساتھ شیئر کریں',
    accessDuration: 'رسائی کی مدت',
    oneHour: '1 گھنٹہ',
    twentyFourHours: '24 گھنٹے',
    sevenDays: '7 دن',
    thirtyDays: '30 دن',
    generateAccessPin: 'پن اور QR کوڈ بنائیں',
    activeShares: 'فعال شیئر لنکس',
    revokeAccess: 'رسائی منسوخ کریں',
    accessCode: 'سیکیورٹی پن',

    verificationTitle: 'دستاویز کی تصدیق',
    verificationSubtitle: 'چیک کریں کہ آیا رپورٹ یا سرٹیفکیٹ اصلی ہے',
    verifyInstructions: 'ڈیجیٹل دستخط چیک کرنے کے لیے فائل اپ لوڈ کریں',
    checkTamperSeal: 'اصلیت کی جانچ کریں',
    documentHash: 'ڈیجیٹل دستخط (SHA-256)',
    verificationSuccess: 'تصدیق کامیاب: دستاویز 100% اصلی ہے',
    authenticReport: 'مجاز میڈیکل سینٹر سے تصدیق شدہ',

    auditTitle: 'سیکیورٹی اور تاریخ لاگ',
    auditSubtitle: 'آپ کے ریکارڈ کس نے دیکھے اور شیئر کیے اس کی مکمل تفصیل',
    activityHistory: 'حالیہ سرگرمیاں',
    deviceLocation: 'ڈیوائس اور مقام',
    tamperProtection: 'مکمل اینکرپٹڈ سیکیورٹی',
    actionDetails: 'تفصیلات',

    settingsTitle: 'ترتیبات اور سیکیورٹی',
    settingsSubtitle: 'اپنی زبان، بائیو میٹرک سیکیورٹی اور اکاؤنٹ کی ترتیبات منظم کریں',
    languageSection: 'ایپ کی زبان (Language)',
    biometricSection: 'بائیو میٹرک انلاک (فنگر پرنٹ / فیس آئی ڈی)',
    biometricToggleLabel: 'بائیو میٹرک لاک لازمی کریں',
    biometricToggleDesc: 'ایپ کھولنے یا رپورٹس دیکھنے کے لیے فنگر پرنٹ یا فیس آئی ڈی استعمال کریں',
    biometricEnforced: 'نافذ ہے',
    biometricOptional: 'اختیاری',
    testBiometric: 'بائیو میٹرک ٹیسٹ کریں',
    abhaSection: 'آیوشمان بھارت ہیلتھ اکاؤنٹ (ABHA)',
    abhaDesc: 'ملک بھر کے ہسپتالوں کو جوڑنے والا آپ کا 14 ہندسوں کا قومی ہیلتھ شناختی نمبر',
    emergencyDetails: 'ہنگامی معلومات',
    notificationPreferences: 'اطلاعات کی ترتیبات',
    smsAlerts: 'SMS الرٹس',
    whatsappAlerts: 'WhatsApp یاد دہانیاں',

    biometricPromptTitle: 'بائیو میٹرک تصدیق',
    biometricPromptSubtitle: 'شناخت کی تصدیق کے لیے برائے مہربانی سینسر پر انگلی رکھیں',
    touchSensor: 'فنگر پرنٹ سینسر',
    faceUnlock: 'فیس انلاک',
    securityKey: 'سیکیورٹی پاس کی',
    scanSensorButton: 'سینسر اسکین کریں / پن درج کریں',
    passphraseFallback: 'ماسٹر پاس ورڈ استعمال کریں',
    authSuccessToast: 'بائیو میٹرک تصدیق کامیاب رہی۔',

    signInTitle: 'سوستھیہ والیٹ میں خوش آمدید',
    signInSubtitle: 'ہر ہندوستانی شہری کے لیے آسان اور محفوظ ڈیجیٹل ہیلتھ لاکر',
    mobileOrAbha: 'موبائل نمبر یا آبھا آئی ڈی',
    enterPassword: 'پاس ورڈ یا OTP درج کریں',
    loginButton: 'لاگ ان کریں / OTP کی تصدیق کریں',
    createAccount: 'نیا اکاؤنٹ بنائیں',
    forgotPassword: 'پاس ورڈ بھول گئے؟',
    simpleTechnologyNote: 'ہر ہندوستانی کے لیے سادہ ٹیکنالوجی • 12 ہندوستانی زبانوں میں دستیاب',
  },
};

export function getTranslation(lang: SupportedLanguage = 'en'): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
