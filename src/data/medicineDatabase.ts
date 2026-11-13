/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Swasthya Wallet - Verified Indian Medicine Catalog & Alternatives Engine
 * Official Slogan: Digital Health Locker for Citizens
 */

export type MedicalSystemType = 'allopathy' | 'ayurveda' | 'homeopathy';

export interface MedicineItem {
  id: string;
  name: string; // Brand or remedy name
  system: MedicalSystemType;
  genericOrActiveSalt: string;
  dosageForm: string; // 'Tablet', 'Capsule', 'Syrup', 'Churna', 'Vati', 'Kwath', 'Arishta', 'Globules', 'Dilution', 'Mother Tincture'
  strengthOrPotency: string; // '650 mg', '40 mg', '30C', '200C', '1M', 'Ø (Q)', 'Classical'
  manufacturer: string;
  approxMrp: number; // In INR (₹)
  janAushadhiEquivalent?: {
    name: string;
    genericCode: string;
    approxPrice: number;
    savingsPct: number;
  };
  onlineAvailability: {
    apollo: 'In Stock' | 'Low Stock' | 'Order on Request';
    tata1mg: 'In Stock' | 'Low Stock' | 'Order on Request';
    netmeds: 'In Stock' | 'Low Stock' | 'Order on Request';
    janAushadhiKendra: 'Available' | 'Check Kendra';
  };
  nearbyPharmaciesCount: number;
  ingredientsList: string[];
  sanskritName?: string;
  botanicalOrLatinName?: string;
  classicalFormulation?: string;
  ayushLicenseNo?: string;
  potencyOptions?: string[];
  indications: string;
  directions: string;
  safetyWarning?: string;

  // Enriched Detail Fields for Allopathy (Part 7.A)
  brandName?: string;
  genericName?: string;
  activeSalt?: string;
  strength?: string;
  prescriptionDosage?: string;
  frequency?: string;
  duration?: string;
  prescriptionInstructions?: string;
  prescriptionReference?: string;
  knownSafetyInfo?: string;
  drugInteractions?: string[];

  // Enriched Detail Fields for Ayurveda (Part 7.B)
  englishName?: string;
  commonName?: string;
  botanicalName?: string;
  classicalOrProprietary?: 'Classical Formulation' | 'Proprietary Formulation';
  ayushLicenceInfo?: string;

  // Enriched Detail Fields for Homeopathy (Part 7.C)
  remedyName?: string;
  latinName?: string;
  potency?: string;
  dilution?: string;
  motherTinctureInfo?: string;

  // Prescription Linking
  prescriptionDate?: string;
  linkedRecordId?: string;
}

export interface MedicineAlternative {
  id: string;
  name: string;
  system: MedicalSystemType;
  brandOrMaker: string;
  strengthOrPotency: string;
  dosageForm: string;
  approxPrice: number;
  matchType: 'exact_match' | 'same_ingredient' | 'similar_product' | 'different_approach';
  matchLabel: string;
  savingsInfo?: string;
  sourceNotes: string;
}

export const INDIAN_MEDICINE_CATALOG: MedicineItem[] = [
  // --- ALLOPATHY ---
  {
    id: 'allo-1',
    name: 'Dolo 650 Tablet',
    system: 'allopathy',
    genericOrActiveSalt: 'Paracetamol / Acetaminophen',
    dosageForm: 'Tablet',
    strengthOrPotency: '650 mg',
    manufacturer: 'Micro Labs Ltd',
    approxMrp: 34.0,
    janAushadhiEquivalent: {
      name: 'Paracetamol Tablets IP 650mg',
      genericCode: 'PMBI-ALLO-0012',
      approxPrice: 11.5,
      savingsPct: 66,
    },
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 8,
    ingredientsList: ['Paracetamol IP 650mg'],
    indications: 'Fever, mild to moderate body pain, headache, post-vaccination fever',
    directions: '1 tablet every 6 to 8 hours as needed. Do not exceed 4000mg in 24 hours.',
    safetyWarning: 'Overdose may cause serious liver injury. Avoid alcohol while taking paracetamol.',
    brandName: 'Dolo 650',
    genericName: 'Paracetamol Tablets IP',
    activeSalt: 'Paracetamol (Acetaminophen)',
    strength: '650 mg',
    prescriptionDosage: '1 Tablet',
    frequency: 'TDS (3 times daily after food)',
    duration: '3 days as needed',
    prescriptionInstructions: 'Take with warm water after meals. Stop when fever subsides below 99°F.',
    prescriptionReference: 'Prescription RxNorm #313782 • Dr. Ananya Iyer, MD',
    knownSafetyInfo: 'Do not take concurrently with other paracetamol-containing combination syrups.',
    drugInteractions: ['Warfarin (mild increase in INR with prolonged use)', 'Alcohol (hepatic stress)'],
  },
  {
    id: 'allo-2',
    name: 'Telma 40 Tablet',
    system: 'allopathy',
    genericOrActiveSalt: 'Telmisartan',
    dosageForm: 'Tablet',
    strengthOrPotency: '40 mg',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    approxMrp: 220.0,
    janAushadhiEquivalent: {
      name: 'Telmisartan Tablets IP 40mg',
      genericCode: 'PMBI-ALLO-0418',
      approxPrice: 28.0,
      savingsPct: 87,
    },
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 6,
    ingredientsList: ['Telmisartan IP 40mg'],
    indications: 'Essential Hypertension (High Blood Pressure), Cardiovascular risk reduction',
    directions: '1 tablet once daily in the morning, with or without food, as prescribed by doctor.',
    safetyWarning: 'Do not use during pregnancy. Regular blood pressure & potassium monitoring recommended.',
    brandName: 'Telma 40',
    genericName: 'Telmisartan Tablets IP',
    activeSalt: 'Telmisartan',
    strength: '40 mg',
    prescriptionDosage: '1 Tablet orally',
    frequency: 'OD (Once daily morning after breakfast)',
    duration: 'Ongoing maintenance (90 days supply)',
    prescriptionInstructions: 'Take at the same time every morning. Monitor BP weekly in health locker.',
    prescriptionReference: 'RxNorm #409121 • Dr. Rajesh Sharma, MD (Cardiology)',
    knownSafetyInfo: 'Contraindicated in pregnancy. Regular serum potassium & creatinine checks advised.',
    drugInteractions: ['Potassium-sparing diuretics', 'NSAIDs (ibuprofen, diclofenac)'],
  },
  {
    id: 'allo-3',
    name: 'Glycomet 500 Tablet SR',
    system: 'allopathy',
    genericOrActiveSalt: 'Metformin Hydrochloride (Sustained Release)',
    dosageForm: 'Tablet (SR)',
    strengthOrPotency: '500 mg',
    manufacturer: 'USV Private Limited',
    approxMrp: 48.0,
    janAushadhiEquivalent: {
      name: 'Metformin Hydrochloride SR Tablets IP 500mg',
      genericCode: 'PMBI-ALLO-0185',
      approxPrice: 9.2,
      savingsPct: 81,
    },
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 11,
    ingredientsList: ['Metformin Hydrochloride IP 500mg (SR)'],
    indications: 'Type 2 Diabetes Mellitus glycemic control',
    directions: 'Take with or after meals to reduce gastrointestinal irritation.',
    safetyWarning: 'Contraindicated in severe renal impairment. Inform doctor before CT scan contrast.',
  },
  {
    id: 'allo-4',
    name: 'Augmentin 625 Duo Tablet',
    system: 'allopathy',
    genericOrActiveSalt: 'Amoxicillin + Clavulanic Acid',
    dosageForm: 'Tablet',
    strengthOrPotency: '500 mg + 125 mg',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    approxMrp: 204.0,
    janAushadhiEquivalent: {
      name: 'Amoxycillin and Potassium Clavulanate Tablets IP 625mg',
      genericCode: 'PMBI-ALLO-0089',
      approxPrice: 62.0,
      savingsPct: 70,
    },
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 7,
    ingredientsList: ['Amoxicillin Trihydrate IP eq. to Amoxicillin 500mg', 'Potassium Clavulanate Diluted IP eq. to Clavulanic Acid 125mg'],
    indications: 'Bacterial infections of respiratory tract, ENT, skin, and urinary tract',
    directions: 'Take at the start of a meal as directed by physician. Complete full prescribed course.',
    safetyWarning: 'Contraindicated in penicillin allergy. Finish full course to prevent bacterial resistance.',
  },
  {
    id: 'allo-5',
    name: 'Pan 40 Tablet',
    system: 'allopathy',
    genericOrActiveSalt: 'Pantoprazole Sodium (Gastro-resistant)',
    dosageForm: 'Tablet',
    strengthOrPotency: '40 mg',
    manufacturer: 'Alkem Laboratories Ltd',
    approxMrp: 155.0,
    janAushadhiEquivalent: {
      name: 'Pantoprazole Gastro-resistant Tablets IP 40mg',
      genericCode: 'PMBI-ALLO-0312',
      approxPrice: 22.0,
      savingsPct: 85,
    },
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 14,
    ingredientsList: ['Pantoprazole Sodium Sesquihydrate IP eq. to Pantoprazole 40mg'],
    indications: 'Gastroesophageal Reflux Disease (GERD), gastric acidity, peptic ulcers',
    directions: 'Take 1 tablet in the morning 30 minutes before breakfast. Swallow whole.',
    safetyWarning: 'Do not crush or chew gastro-resistant coating.',
  },

  // --- AYURVEDA ---
  {
    id: 'ayur-1',
    name: 'Ashwagandha Churna',
    system: 'ayurveda',
    genericOrActiveSalt: 'Withania somnifera (Indian Ginseng)',
    dosageForm: 'Churna (Herbal Powder)',
    strengthOrPotency: 'Classical Formulation (Bhavaprakasha)',
    manufacturer: 'Dabur India Ltd / Baidyanath / Kottakkal Arya Vaidya Sala',
    approxMrp: 185.0,
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 9,
    ingredientsList: ['Shuddha Ashwagandha Moola (Withania somnifera root powder 100%)'],
    sanskritName: 'अश्वगन्धा चूर्ण (Vājīkaraṇa & Rasāyana)',
    botanicalOrLatinName: 'Withania somnifera Dunal',
    classicalFormulation: 'Classical Ayurvedic Formulary of India (AFI Part-I)',
    ayushLicenseNo: 'AYUSH-DL-0248-AFI/2021',
    indications: 'Rasayana (Rejuvenator), Balya (Strength promoter), Stress relief, Fatigue, Sleep support',
    directions: '3 to 6 grams twice daily with warm milk or honey, or as directed by Ayurvedic physician.',
    safetyWarning: 'Consult Ayurvedic Vaidya during pregnancy or in high Pitta disorders.',
    englishName: 'Indian Ginseng / Winter Cherry',
    commonName: 'Ashwagandha Churna',
    botanicalName: 'Withania somnifera Dunal',
    classicalOrProprietary: 'Classical Formulation',
    ayushLicenceInfo: 'AYUSH-DL-0248-AFI/2021 (Govt. of India Certified AYUSH Formulation)',
    prescriptionInstructions: 'Mix 1 teaspoon in warm cow milk with a pinch of cardamom. Consume 30 mins before bed.',
    knownSafetyInfo: 'Safe for long-term usage under supervision. Avoid in acute hyperthyroid states.',
  },
  {
    id: 'ayur-2',
    name: 'Triphala Churna',
    system: 'ayurveda',
    genericOrActiveSalt: 'Three Myrobalans (Haritaki + Bibhitaki + Amalaki)',
    dosageForm: 'Churna',
    strengthOrPotency: 'Equal Ratio Classical AFI',
    manufacturer: 'Baidyanath / Dabur / Zandu / Patanjali',
    approxMrp: 110.0,
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 15,
    ingredientsList: [
      'Haritaki (Terminalia chebula) 1 Part',
      'Bibhitaki (Terminalia bellirica) 1 Part',
      'Amalaki (Emblica officinalis) 1 Part',
    ],
    sanskritName: 'त्रिफला चूर्ण (दीपनीय & अनुलोमक)',
    botanicalOrLatinName: 'Terminalia chebula + T. bellirica + Phyllanthus emblica',
    classicalFormulation: 'Charaka Samhita Chikitsa Sthana',
    ayushLicenseNo: 'AYUSH-UK-0842-AFI',
    indications: 'Digestive regulation, natural bowel cleanser, eye health (Chakshushya), antioxidant',
    directions: '3 to 5 grams with warm water at bedtime.',
    safetyWarning: 'Avoid in chronic diarrhoea or dysentery without physician consultation.',
  },
  {
    id: 'ayur-3',
    name: 'Arjunarishta',
    system: 'ayurveda',
    genericOrActiveSalt: 'Terminalia arjuna + Classical Fermentation',
    dosageForm: 'Arishta (Self-generated Herbal Wine)',
    strengthOrPotency: 'Classical AFI (Bhaishajya Ratnavali)',
    manufacturer: 'Kottakkal Arya Vaidya Sala / Baidyanath',
    approxMrp: 165.0,
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 6,
    ingredientsList: [
      'Arjuna Tvak (Terminalia arjuna stem bark)',
      'Draksha (Vitis vinifera)',
      'Madhuka Kusuma (Madhuca indica)',
      'Dhataki Pushpa (Woodfordia fruticosa)',
      'Guda (Jaggery)',
    ],
    sanskritName: 'पार्थारिष्ट / अर्जुनारिष्ट (हृद्य रस)',
    botanicalOrLatinName: 'Terminalia arjuna Wight & Arn.',
    classicalFormulation: 'Bhaishajya Ratnavali Hridroga Chikitsa',
    ayushLicenseNo: 'AYUSH-KL-1102-KOTTAKKAL',
    indications: 'Hridya (Cardioprotective tonic), support in palpitations, mild hypertension, stamina',
    directions: '15 to 25 ml with equal volume of lukewarm water after meals twice daily.',
    safetyWarning: 'Contains 5-10% self-generated alcohol from natural fermentation. Supervised use recommended.',
  },
  {
    id: 'ayur-4',
    name: 'Brahmi Vati (Buddhi Vardhak)',
    system: 'ayurveda',
    genericOrActiveSalt: 'Bacopa monnieri + Shankhpushpi + Swarna Makshika',
    dosageForm: 'Vati (Ayurvedic Tablet)',
    strengthOrPotency: 'Classical Formulation',
    manufacturer: 'Dabur / Baidyanath',
    approxMrp: 195.0,
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 7,
    ingredientsList: ['Brahmi (Bacopa monnieri)', 'Shankhpushpi (Convolvulus pluricaulis)', 'Vacha (Acorus calamus)', 'Swarna Makshika Bhasma'],
    sanskritName: 'ब्राह्मी वटी (मेध्य रसायन)',
    botanicalOrLatinName: 'Bacopa monnieri (L.) Wettst.',
    classicalFormulation: 'Siddha Yoga Sangraha',
    ayushLicenseNo: 'AYUSH-HR-4412-AFI',
    indications: 'Medhya (Cognitive support, memory retention, focus), nervous exhaustion, anxiety relief',
    directions: '1 to 2 tablets twice daily with honey or warm milk.',
    safetyWarning: 'Do not exceed prescribed dosage. Consult qualified Ayurvedic practitioner.',
  },

  // --- HOMEOPATHY ---
  {
    id: 'hom-1',
    name: 'Arnica Montana',
    system: 'homeopathy',
    genericOrActiveSalt: 'Leopard’s Bane (Mountain Daisy)',
    dosageForm: 'Dilution / Globules / Mother Tincture',
    strengthOrPotency: '30C (Available in 6C, 30C, 200C, 1M, Ø)',
    manufacturer: 'SBL Pvt Ltd / Dr. Willmar Schwabe India / Dr. Reckeweg',
    approxMrp: 115.0,
    potencyOptions: ['6C', '30C', '200C', '1M', '10M', 'Ø (Mother Tincture)'],
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Check Kendra',
    },
    nearbyPharmaciesCount: 10,
    ingredientsList: ['Arnica montana root/whole plant in extra neutral alcohol base (HPI/GHP)'],
    botanicalOrLatinName: 'Arnica montana L. (Asteraceae)',
    indications: 'Traumatic injury, muscle soreness, blunt trauma, bruises, sprains, post-surgical recovery',
    directions: '4 globules or 3-5 drops in half tablespoon of water, 3 times daily on a clean tongue.',
    safetyWarning: 'Keep 15 minutes gap before and after food/coffee/camphor. Never apply mother tincture to broken skin.',
    remedyName: 'Arnica Montana',
    latinName: 'Arnica montana L.',
    commonName: 'Mountain Daisy / Leopard’s Bane',
    potency: '30C (Centesimal Hahnemannian Potency)',
    dilution: 'Liquid Dilution in Extra Neutral Alcohol Base (HPI/GHP)',
    motherTinctureInfo: 'Ø Mother Tincture is prepared from whole flowering plant for external sprains',
    prescriptionInstructions: 'Administer 4 sugar globules under the tongue 3 times daily. Keep mouth clean of strong flavors.',
    knownSafetyInfo: 'Safe and non-toxic in micro-dilution potencies. Do not apply mother tincture to open wounds.',
  },
  {
    id: 'hom-2',
    name: 'Nux Vomica',
    system: 'homeopathy',
    genericOrActiveSalt: 'Poison Nut (Strychnos nux-vomica)',
    dosageForm: 'Dilution / Pills',
    strengthOrPotency: '30C (Available in 30C, 200C, 1M)',
    manufacturer: 'Dr. Willmar Schwabe India / SBL / Dr. Reckeweg',
    approxMrp: 125.0,
    potencyOptions: ['30C', '200C', '1M'],
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Check Kendra',
    },
    nearbyPharmaciesCount: 12,
    ingredientsList: ['Strychnos nux-vomica seeds potentised in alcohol base as per Homoeopathic Pharmacopoeia of India'],
    botanicalOrLatinName: 'Strychnos nux-vomica L.',
    indications: 'Gastric derangement from rich food or stimulants, constipation, irritability, hangover, insomnia',
    directions: '3-4 drops in half tablespoon water at night before sleep, or as directed by Homeopath.',
    safetyWarning: 'Exact potency matters. Do not substitute 200C for 30C without clinical recommendation.',
  },
  {
    id: 'hom-3',
    name: 'Belladonna',
    system: 'homeopathy',
    genericOrActiveSalt: 'Deadly Nightshade (Atropa belladonna)',
    dosageForm: 'Liquid Dilution',
    strengthOrPotency: '30C (Available in 6C, 30C, 200C)',
    manufacturer: 'SBL Pvt Ltd / Schwabe India',
    approxMrp: 110.0,
    potencyOptions: ['6C', '30C', '200C'],
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Check Kendra',
    },
    nearbyPharmaciesCount: 8,
    ingredientsList: ['Atropa belladonna extract potentised according to Homoeopathic Pharmacopoeia'],
    botanicalOrLatinName: 'Atropa belladonna L.',
    indications: 'Sudden onset violent fever with flushed red face, throbbing headache, acute throat congestion',
    directions: '4 drops dissolved in half sip of water, every 4 hours during acute symptoms.',
    safetyWarning: 'If fever persists over 101°F or respiratory distress occurs, consult allopathic physician promptly.',
  },
  {
    id: 'hom-4',
    name: 'Ocimum Sanctum (Tulsi) Mother Tincture Ø',
    system: 'homeopathy',
    genericOrActiveSalt: 'Holy Basil (Tulsi) Plant Extract',
    dosageForm: 'Mother Tincture (Ø / Q)',
    strengthOrPotency: 'Mother Tincture Ø',
    manufacturer: 'SBL Pvt Ltd / Dr. Willmar Schwabe India / Bakson',
    approxMrp: 140.0,
    potencyOptions: ['Mother Tincture (Ø)', '6C', '30C'],
    onlineAvailability: {
      apollo: 'In Stock',
      tata1mg: 'In Stock',
      netmeds: 'In Stock',
      janAushadhiKendra: 'Available',
    },
    nearbyPharmaciesCount: 11,
    ingredientsList: ['Ocimum sanctum fresh plant juice in dispensing alcohol base'],
    botanicalOrLatinName: 'Ocimum tenuiflorum L. (Ocimum sanctum)',
    indications: 'Cough, catarrhal bronchitis, seasonal cold, immunity tonic, intermittent chills',
    directions: '10 to 15 drops in half a cup of warm water twice or thrice daily.',
    safetyWarning: 'Mother tinctures contain unpotentised phytochemicals; distinguish clearly from high dilutions.',
  },
];

export const MANDATORY_SAFETY_DISCLAIMER =
  'Medicine alternatives are for information only. Always consult your doctor or registered pharmacist before changing prescribed medication.';

/**
 * Find alternatives for any medicine across systems
 */
export function findMedicineAlternatives(medicine: MedicineItem): MedicineAlternative[] {
  const alternatives: MedicineAlternative[] = [];

  if (medicine.system === 'allopathy') {
    // 1. Exact Jan Aushadhi generic equivalent
    if (medicine.janAushadhiEquivalent) {
      alternatives.push({
        id: `alt-ja-${medicine.id}`,
        name: medicine.janAushadhiEquivalent.name,
        system: 'allopathy',
        brandOrMaker: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
        strengthOrPotency: medicine.strengthOrPotency,
        dosageForm: medicine.dosageForm,
        approxPrice: medicine.janAushadhiEquivalent.approxPrice,
        matchType: 'same_ingredient',
        matchLabel: 'Generic Jan Aushadhi Equivalent (Same Active Salt)',
        savingsInfo: `Save ~${medicine.janAushadhiEquivalent.savingsPct}% compared to branded MRP`,
        sourceNotes: 'Government of India PMBI Verified Generic Formulary',
      });
    }

    // 2. Different brand same active ingredient
    if (medicine.id === 'allo-1') {
      alternatives.push({
        id: 'alt-calpol-650',
        name: 'Calpol 650 Tablet',
        system: 'allopathy',
        brandOrMaker: 'GlaxoSmithKline Pharmaceuticals',
        strengthOrPotency: '650 mg',
        dosageForm: 'Tablet',
        approxPrice: 31.0,
        matchType: 'exact_match',
        matchLabel: 'Exact Product Match (Paracetamol 650mg)',
        savingsInfo: 'Save ~9%',
        sourceNotes: 'Verified Indian CDSCO Registered Brand',
      });
      alternatives.push({
        id: 'alt-crocin-650',
        name: 'Crocin 650 Advance',
        system: 'allopathy',
        brandOrMaker: 'Haleon India',
        strengthOrPotency: '650 mg',
        dosageForm: 'Tablet',
        approxPrice: 32.5,
        matchType: 'exact_match',
        matchLabel: 'Exact Product Match (Paracetamol 650mg)',
        sourceNotes: 'Verified Indian CDSCO Registered Brand',
      });
    } else if (medicine.id === 'allo-2') {
      alternatives.push({
        id: 'alt-telmikind-40',
        name: 'Telmikind 40 Tablet',
        system: 'allopathy',
        brandOrMaker: 'Mankind Pharma Ltd',
        strengthOrPotency: '40 mg',
        dosageForm: 'Tablet',
        approxPrice: 65.0,
        matchType: 'same_ingredient',
        matchLabel: 'Same Salt & Strength (Telmisartan 40mg)',
        savingsInfo: 'Save ~70% vs Telma 40',
        sourceNotes: 'Verified Indian CDSCO Registered Brand',
      });
      alternatives.push({
        id: 'alt-telvas-40',
        name: 'Telvas 40 Tablet',
        system: 'allopathy',
        brandOrMaker: 'Aristo Pharmaceuticals',
        strengthOrPotency: '40 mg',
        dosageForm: 'Tablet',
        approxPrice: 85.0,
        matchType: 'same_ingredient',
        matchLabel: 'Same Salt & Strength (Telmisartan 40mg)',
        savingsInfo: 'Save ~61%',
        sourceNotes: 'Verified Indian CDSCO Registered Brand',
      });
    }
  } else if (medicine.system === 'ayurveda') {
    // Ayurvedic classical formulation alternative manufacturers
    if (medicine.id === 'ayur-1') {
      alternatives.push({
        id: 'alt-kottakkal-ashwa',
        name: 'Kottakkal Ashwagandhadi Choornam',
        system: 'ayurveda',
        brandOrMaker: 'Kottakkal Arya Vaidya Sala (Kerala)',
        strengthOrPotency: 'Classical AFI 100g Pack',
        dosageForm: 'Churna',
        approxPrice: 160.0,
        matchType: 'same_ingredient',
        matchLabel: 'Same Classical Formulation (Pure Withania somnifera)',
        savingsInfo: 'Save ~14%',
        sourceNotes: 'Kerala Classical Ayurveda Pharmacopoeia Certified',
      });
      alternatives.push({
        id: 'alt-baidyanath-ashwa',
        name: 'Baidyanath Ashwagandha Churna',
        system: 'ayurveda',
        brandOrMaker: 'Shree Baidyanath Ayurved Bhawan',
        strengthOrPotency: 'Classical AFI 100g Pack',
        dosageForm: 'Churna',
        approxPrice: 145.0,
        matchType: 'exact_match',
        matchLabel: 'Exact Classical Recipe (Bhavaprakasha)',
        savingsInfo: 'Save ~21%',
        sourceNotes: 'AYUSH GMP Certified Facility',
      });
    } else if (medicine.id === 'ayur-2') {
      alternatives.push({
        id: 'alt-dabur-triphala',
        name: 'Dabur Triphala Churna',
        system: 'ayurveda',
        brandOrMaker: 'Dabur India Ltd',
        strengthOrPotency: 'Equal Ratio AFI (120g Pack)',
        dosageForm: 'Churna',
        approxPrice: 95.0,
        matchType: 'exact_match',
        matchLabel: 'Exact Classical Product Match',
        savingsInfo: 'Save ~13%',
        sourceNotes: 'Standardized Heavy Metal & Microbial Tested',
      });
    }
  } else if (medicine.system === 'homeopathy') {
    // Homeopathy exact remedy & potency across top verified laboratories
    if (medicine.id === 'hom-1') {
      alternatives.push({
        id: 'alt-schwabe-arnica-30',
        name: 'Arnica Montana 30C Dilution (30ml)',
        system: 'homeopathy',
        brandOrMaker: 'Dr. Willmar Schwabe India (German Collaboration)',
        strengthOrPotency: '30C (Centesimal Potency)',
        dosageForm: 'Liquid Dilution',
        approxPrice: 125.0,
        matchType: 'exact_match',
        matchLabel: 'Exact Remedy & Potency Match (30C)',
        sourceNotes: 'German Homeopathic Pharmacopoeia (GHP) Standards',
      });
      alternatives.push({
        id: 'alt-reckeweg-arnica-30',
        name: 'Dr. Reckeweg Arnica Montana 30C',
        system: 'homeopathy',
        brandOrMaker: 'Dr. Reckeweg & Co. GmbH (Germany/India)',
        strengthOrPotency: '30C (Original Dilution)',
        dosageForm: 'Liquid Drops',
        approxPrice: 195.0,
        matchType: 'same_ingredient',
        matchLabel: 'Exact Remedy & Potency (Imported Formulation)',
        sourceNotes: 'International Homeopathic Registration',
      });
    } else if (medicine.id === 'hom-2') {
      alternatives.push({
        id: 'alt-sbl-nux-30',
        name: 'SBL Nux Vomica 30C Dilution',
        system: 'homeopathy',
        brandOrMaker: 'SBL Private Limited (India)',
        strengthOrPotency: '30C',
        dosageForm: 'Liquid Dilution',
        approxPrice: 105.0,
        matchType: 'exact_match',
        matchLabel: 'Exact Remedy & Potency Match (30C)',
        savingsInfo: 'Save ~16%',
        sourceNotes: 'Homoeopathic Pharmacopoeia of India (HPI) Verified',
      });
    }
  }

  // Cross-system complementary treatment approach for information only
  if (medicine.id === 'allo-1') {
    alternatives.push({
      id: 'alt-cross-mahasudarshan',
      name: 'Mahasudarshan Ghanvati',
      system: 'ayurveda',
      brandOrMaker: 'Baidyanath / Dabur',
      strengthOrPotency: 'Classical Jwara Hara',
      dosageForm: 'Vati (Tablet)',
      approxPrice: 120.0,
      matchType: 'different_approach',
      matchLabel: 'Different Treatment Approach (Ayurvedic Jwara Care)',
      sourceNotes: 'Informational only. Not a pharmacological substitute. Consult doctor.',
    });
  }

  return alternatives;
}
