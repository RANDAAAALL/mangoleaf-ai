export type Language = "en" | "bis";

export const translations = {
  en: {
    // Navigation
    navHome: "Home",
    navAbout: "About",
    navHistory: "History",
    installApp: "Install App",

    // Scanner Section
    desktopHeroHeadline: "Diagnose Mango Diseases Instantly",
    desktopHeroSubtitle:
      "Upload a clear photo of a mango leaf or fruit to run an instant AI diagnostic report.",
    uploadPhotoBtn: "Upload Photo",
    takePhotoBtn: "Take Photo",
    takePhotoSubtext:
      "Capture a clear photo of a mango leaf or fruit in daylight",
    uploadPhotoSubtext:
      "Upload an existing leaf or fruit photo from your gallery",
    browseFilesBtn: "Browse Files",
    snapCameraBtn: "Snap Camera",
    openGalleryBtn: "Open Gallery",

    // AI Scanning Progress Overlay
    runningAI: "Running AI classification...",
    runDiagnosisBtn: "Run AI Diagnosis",
    retakeBtn: "Retake",
    reviewPhotoTitle: "Review Photo",
    cancelBtn: "Cancel",
    photoCheckHint:
      "Make sure the single leaf or fruit is clear and in the center. If it's blurry or dark, take another photo.",

    // How It Works Card
    HowItWorksTitle: "How it works?",

    // Scan History Section
    recentScansTitle: "Recent Scans",
    scanHistoryTitle: "Scan History",
    searchPlaceholder: "Search by name...",
    filterAll: "≡ Filter All",
    viewAllHistory: "View All History",
    viewAllHistoryShort: "View All",
    noScanHistoryTitle: "No Scan History Yet",
    noScanHistoryText:
      "No previous scans recorded on this device. Upload or take a photo to run your first diagnosis!",

    // Card & Scan Labels
    detailsBtn: "Details",
    justNow: "Just now",
    yesterday: "Yesterday",
    // Relative-time templates. {n} is replaced with the number by formatTimeAgo.
    minutesAgo: "{n}m ago",
    hourAgo: "1 hour ago",
    hoursAgo: "{n} hours ago",
    daysAgo: "{n} days ago",
    // Month abbreviations for absolute scan dates older than a week.
    monthsShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],

    // Scan Details Modal
    diagnosisPrefix: "Diagnosis:",
    scannedOnPrefix: "Scanned on",
    scorePrefix: "Score:",
    preTreatmentGuidelines: "Treatment Guidelines",
    closeDetailsBtn: "Close details",
    noImageOffline: "No Image Available Offline",

    // About Page
    aboutHeroTitle: "Technology that works where the mango farmer works.",
    aboutHeroDesc:
      "MangoLeaf AI is an offline-first Progressive Web Application that brings AI-assisted mango disease detection closer to Filipino Dabawenyo farmers.",
    aboutBrandName: "MangoLeaf AI",
    aboutScanLeafCta: "Scan a Leaf or Fruit",
    aboutWhyTitle: "Why we built it",
    aboutWhyLead:
      "Identifying mango diseases can be challenging when expert guidance isn't immediately available.",
    aboutWhyDesc:
      "MangoLeaf AI explores how on-device artificial intelligence can provide accessible, fast disease assessment directly in the field.",
    aboutFieldTitle: "Designed for the field",
    aboutOfflineFirstTitle: "Offline-first",
    aboutOfflineFirstDesc:
      "Works without relying on constant internet connectivity.",
    aboutOnDeviceTitle: "On-device AI",
    aboutOnDeviceDesc:
      "AI inference happens directly on the device, allowing images to be analyzed locally.",
    aboutSyncTitle: "Sync when connected",
    aboutSyncDesc:
      "Scan records can be stored locally and synchronized when connectivity becomes available.",
    aboutAiEngineHeading: "The AI Engine",
    aboutModelAccuracyLabel: "Model Accuracy",
    aboutModelArchitectureValue: "MobileNetV3",
    aboutArchitectureLabel: "Model Architecture",
    aboutRuntimeValue: "TensorFlow.js",
    aboutRuntimeLabel: "Inference Runtime",
    aboutOnDeviceValue: "On-device",
    aboutProcessingLabel: "Processing",
    aboutResearchHeading: "From research to application",
    aboutResearchTitle: "RESEARCH",
    aboutResearchDesc:
      "Understanding mango disease identification and the needs of the intended users.",
    aboutDataTitle: "DATA",
    aboutDataDesc:
      "Preparing and organizing mango images for model development.",
    aboutAiStepTitle: "AI",
    aboutAiStepDesc: "Training and evaluating the image classification model.",
    aboutApplicationTitle: "APPLICATION",
    aboutApplicationDesc:
      "Bringing the model into an offline-first Progressive Web Application.",
    aboutMissionTitle: "Our Mission",
    aboutMissionStatement:
      "Technology should work where the mango farmer works.",
    aboutMissionDesc:
      "MangoLeaf AI aims to make AI-assisted disease assessment more accessible to Filipino Dabawenyo agriculture by bringing useful technology closer to the field.",
    detectableTitle: "5 Detectable Conditions",
    detectableDesc:
      "The AI model recognizes the following Carabao Mango conditions from a clear and proper single leaf or fruit photo.",
    leafDiseasesLabel: "Leaf Diseases",
    fruitDiseasesLabel: "Fruit Diseases",
    diseaseAnthracnose: "Anthracnose",
    diseaseBacterialCanker: "Bacterial Canker",
    diseaseSootyMold: "Sooty Mold",
    diseaseBacterialBlackSpot: "Bacterial Black Spot",
    diseaseMangoScab: "Mango Scab",
    healthyLabel: "Healthy",
    healthyDesc: "A mango leaf or fruit that is free from detectable disease.",

    // Bottom Navigation & Scan Sheet
    navScan: "Scan",
    scanSheetTitle: "Start a Scan",
    scanSheetCameraDesc:
      "Capture a clear and proper single photo of a mango leaf or fruit in daylight",
    scanSheetGalleryDesc:
      "Upload an existing clear and proper single leaf or fruit photo from your gallery in daylight",

    // How It Works Steps (visual cards)
    howStep1Title: "Snap or Upload",
    howStep1Desc:
      "Take a clear and proper single photo of a mango leaf or fruit in daylight.",
    howStep2Title: "AI Analyzes",
    howStep2Desc: "Instant on device diagnosis — no internet needed.",
    howStep3Title: "Get Results",
    howStep3Desc: "View treatment guidance in Bisaya or English.",

    // Footer
    footerCopyright:
      "© 2026 MangoLeaf AI. Designed for the Future of Filipino Dabawenyo Agriculture.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
  },
  bis: {
    // Navigation
    navHome: "Home",
    navAbout: "Bahin",
    navHistory: "Dating Scan",
    installApp: "I-install ang App",

    // Scanner Section
    desktopHeroHeadline: "Pag-diagnose sa Sakit sa Mangga Dihadiha",
    desktopHeroSubtitle:
      "Mag-upload og maayong hulagway sa dahon o prutas sa mangga aron makadawat og paspas nga diagnosis gikan sa AI.",
    uploadPhotoBtn: "I-upload ang Litrato",
    takePhotoBtn: "Kuhaa ang Litrato",
    takePhotoSubtext:
      "Maglitrato og maayong hulagway sa dahon o prutas sa mangga",
    uploadPhotoSubtext:
      "Mag-upload og hulagway sa dahon o prutas gikan sa imong gallery",
    browseFilesBtn: "Pangitaa sa File",
    snapCameraBtn: "Litrato sa Kamera",
    openGalleryBtn: "Ablihi ang Gallery",

    // AI Scanning Progress Overlay
    runningAI: "Nag-classify sa AI...",
    runDiagnosisBtn: "Sugdan ang Diagnosis",
    retakeBtn: "Pagkuhag Usab",
    reviewPhotoTitle: "Susiha ang Litrato",
    cancelBtn: "I-kansela",
    photoCheckHint:
      "Siguroha nga klaro ug anaa sa tunga ang usa ka dahon o bunga sa mangga. Kung hanap o ngitngit, pagkuha og laing litrato.",

    // How It Works Card
    HowItWorksTitle: "Unsaon ni pag-gamit?",

    // Scan History Section
    recentScansTitle: "Bag-ong Scan",
    scanHistoryTitle: "Mga nangaging Scan",
    searchPlaceholder: "Pangitaa pinaagi sa pangalan...",
    filterAll: "≡ I-filter Tanan",
    viewAllHistory: "Tan-awa Ang Tanang History",
    viewAllHistoryShort: "Tan-awa Tanan",
    noScanHistoryTitle: "Wala pay Nangaging Scan",
    noScanHistoryText:
      "Wala pay nangaging scan nga nakarecord sa kini nga device. Pag-upload o paglitrato og unsa ka dahon o bunga sa mangga aron masugdan ang pag-scan!",

    // Card & Scan Labels
    detailsBtn: "Detalye",
    justNow: "Karon lang",
    yesterday: "Gahapon",
    // Relative-time templates. {n} is replaced with the number by formatTimeAgo.
    // Cebuano/Bisaya does not inflect the noun for plurals, so one form covers all counts.
    minutesAgo: "{n} minuto ang milabay",
    hourAgo: "1 oras ang milabay",
    hoursAgo: "{n} oras ang milabay",
    daysAgo: "{n} adlaw ang milabay",
    // Month abbreviations for absolute scan dates older than a week.
    monthsShort: [
      "Ene",
      "Peb",
      "Mar",
      "Abr",
      "May",
      "Hun",
      "Hul",
      "Ago",
      "Sep",
      "Okt",
      "Nob",
      "Dis",
    ],

    // Scan Details Modal
    diagnosisPrefix: "Diagnosis:",
    scannedOnPrefix: "Na-scan niadtong",
    scorePrefix: "Puntos:",
    preTreatmentGuidelines: "Mga Pagtambal ug Pahinumdom",
    closeDetailsBtn: "Isara ang detalye",
    noImageOffline: "Walay Litrato nga Nadownload Offline",

    // About Page
    aboutHeroTitle: "Teknolohiya nga molihok diin nagtrabaho ang mag-uuma.",
    aboutHeroDesc:
      "Ang MangoLeaf AI usa ka offline-first Progressive Web Application nga nagpaabot sa AI-assisted nga pag-ila sa sakit sa mangga ngadto sa mga mag-uuma sa Pilipinas.",
    aboutBrandName: "MangoLeaf AI",
    aboutScanLeafCta: "I-scan ang Dahon",
    aboutWhyTitle: "Ngano nga gihimo namo kini",
    aboutWhyLead:
      "Lisod mailhan ang mga sakit sa mangga kung walay eksperto nga dali maduolan.",
    aboutWhyDesc:
      "Gisusi sa MangoLeaf AI kung unsaon sa on-device artificial intelligence paghatag og dali ug masayon maabot nga pagsusi sa sakit didto mismo sa uma.",
    aboutFieldTitle: "Gidisenyo para sa uma",
    aboutOfflineFirstTitle: "Offline-first",
    aboutOfflineFirstDesc:
      "Molihok bisan dili pirmi adunay internet connection.",
    aboutOnDeviceTitle: "On-device AI",
    aboutOnDeviceDesc:
      "Ang AI inference mahitabo mismo sa device aron lokal masusi ang mga hulagway.",
    aboutSyncTitle: "Mag-sync kung konektado",
    aboutSyncDesc:
      "Matipigan lokal ang mga rekord sa scan ug ma-sync kung adunay koneksyon.",
    aboutAiEngineHeading: "Ang AI Engine",
    aboutModelAccuracyLabel: "Katukma sa Model",
    aboutModelArchitectureValue: "MobileNetV3",
    aboutArchitectureLabel: "Arkitektura sa Model",
    aboutRuntimeValue: "TensorFlow.js",
    aboutRuntimeLabel: "Inference Runtime",
    aboutOnDeviceValue: "Sa device",
    aboutProcessingLabel: "Pagproseso",
    aboutResearchHeading: "Gikan sa research ngadto sa application",
    aboutResearchTitle: "RESEARCH",
    aboutResearchDesc:
      "Pagsabot sa pag-ila sa sakit sa mangga ug sa panginahanglan sa gitumong nga mga tiggamit.",
    aboutDataTitle: "DATA",
    aboutDataDesc:
      "Pag-andam ug pag-organisa sa mga hulagway sa mangga para sa pagpalambo sa model.",
    aboutAiStepTitle: "AI",
    aboutAiStepDesc: "Pag-train ug pag-evaluate sa image classification model.",
    aboutApplicationTitle: "APPLICATION",
    aboutApplicationDesc:
      "Pagdala sa model ngadto sa offline-first Progressive Web Application.",
    aboutMissionTitle: "Among Misyon",
    aboutMissionStatement:
      "Ang teknolohiya kinahanglan molihok diin nagtrabaho ang mag-uuma.",
    aboutMissionDesc:
      "Tinguha sa MangoLeaf AI nga mas mapadali ang AI-assisted nga pagsusi sa sakit sa tanom alang sa agrikultura sa Pilipinas pinaagi sa pagduol sa mapuslanong teknolohiya sa uma.",
    detectableTitle: "Mga Madetektar nga Kondisyon",
    detectableDesc:
      "Ang AI model nakaila sa mosunod nga mga kondisyon sa Carabao Mangga gikan sa usa ka klaro og tarong nga litrato sa dahon o bunga.",
    leafDiseasesLabel: "Sakit sa Dahon",
    fruitDiseasesLabel: "Sakit sa Bunga",
    diseaseAnthracnose: "Anthracnose",
    diseaseBacterialCanker: "Bacterial Canker",
    diseaseSootyMold: "Sooty Mold",
    diseaseBacterialBlackSpot: "Bacterial Black Spot",
    diseaseMangoScab: "Mango Scab",
    healthyLabel: "Himsog",
    healthyDesc: "Ang dahon o bunga sa mangga nga walay sakit.",

    // Bottom Navigation & Scan Sheet
    navScan: "I-scan",
    scanSheetTitle: "Magsugod og Scan",
    scanSheetCameraDesc:
      "Ablihi ang kamera aron mag-picture og klaro og tarong nga isa ka dahon o bunga sa mangga samtang adlaw",
    scanSheetGalleryDesc:
      "Ablihi ang gallery aron mag-kuhag litrato nga klaro og tarong nga isa ka dahon o bunga sa mangga samtang adlaw",

    // How It Works Steps (visual cards)
    howStep1Title: "Litrato o Upload",
    howStep1Desc:
      "Pagkuhag klaro og tarong nga litrato sa usa ka dahon o bunga sa mangga samtang adlaw.",
    howStep2Title: "I-Analysis sa AI",
    howStep2Desc:
      "Paspas nga pag-analysis o diagnose ni AI sa device - wala nay internet nga kinahanglan.",
    howStep3Title: "Resulta gikan sa AI",
    howStep3Desc:
      "Tan-awa og Basaha ang resulta ki-ini sa mapa Bisaya o English.",

    // Footer
    footerCopyright:
      "© 2026 MangoLeaf AI. Gidisenyo alang sa Kaugmaon sa Agrikultura sa Pilipinas.",
    privacyPolicy: "Polisiya sa Pribasya",
    termsOfService: "Kondisyon sa Serbisyo",
  },
};
