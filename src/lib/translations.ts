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
    closeBtn: "Close",
    photoPreviewAlt: "Selected photo for diagnosis",
    duplicatePhotoTitle: "Photo already scanned",
    duplicatePhotoDescription:
      "This photo already has a saved diagnosis. Choose another photo, or find the existing result in History.",
    viewSavedResultBtn: "View saved result",
    checkingPhoto: "Checking photo...",
    photoCheckFailedText:
      "We could not check whether this photo was already scanned. Try again, or choose another photo.",
    retryPhotoCheckBtn: "Try again",
    photoCheckHint:
      "Check that one whole leaf or fruit is clearly visible, without blur, bright reflections, or deep shadows. Retake if needed.",

    // How It Works Card
    HowItWorksTitle: "How it works?",

    // Scan History Section
    recentScansTitle: "Recent Scans",
    scanHistoryTitle: "Scan History",
    pageOfTotal: "Page {n} of {total}",
    previousPage: "Previous page",
    nextPage: "Next page",
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
    uncertainPhotoHeading: "Try another photo",
    uncertainPhotoReminder:
      "Couldn't confidently identify this photo. Please try again with a clear and proper one photo of green mango fruit or mango leaf.",
    guidelinesLoading: "Loading saved treatment guidelines...",
    guidelinesUnavailable:
      "Treatment guidelines are unavailable on this device. Connect to the internet and let the app sync, then try again.",
    closeDetailsBtn: "Close details",
    noImageOffline: "Photo not saved on this device",

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
    aboutModelVersionLabel: "Current model for mango leaves and fruit",
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
    healthyLabel: "Healthy Leaf and Healthy Fruit",
    healthyDesc: "Separate healthy results for mango leaves and fruit.",
    diagnosticScope:
      "The model checks Anthracnose, Sooty Mold, Bacterial Canker, Bacterial Black Spot, Mango Scab, Healthy Leaf, and Healthy Fruit. A result below 70% confidence or outside the fitted margin and entropy limits is Uncertain.",

    // Bottom Navigation & Scan Sheet
    navScan: "Scan",
    scanSheetTitle: "Start a Scan",
    scanSheetFramingLabel: "Framing:",
    scanSheetFramingTip:
      "Keep one whole mango leaf or fruit visible and close enough to see damaged areas.",
    scanSheetLightingLabel: "Lighting:",
    scanSheetLightingTip:
      "Use even lighting; avoid bright reflections and deep shadows.",
    scanSheetCameraDesc: "Take a new photo with your camera.",
    scanSheetGalleryDesc: "Choose an existing photo from your gallery.",

    // How It Works Steps (visual cards)
    howStep1Title: "Take or Upload",
    howStep1Desc:
      "Take or upload a clear photo of one whole mango leaf or fruit in even lighting.",
    howStep2Title: "Review and Scan",
    howStep2Desc:
      "Check the preview, retake if needed, then tap Run AI Diagnosis.",
    howStep3Title: "Read Your Result",
    howStep3Desc:
      "Read the predicted condition and available guidance in English or Bisaya. If uncertain, try another clear photo.",

    // Footer
    footerVersions: "PWA {appVersion} / Model {modelVersion}",
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
    retakeBtn: "Pagpilig Usab",
    reviewPhotoTitle: "Susiha ang Litrato",
    cancelBtn: "I-kansela",
    closeBtn: "Isara",
    photoPreviewAlt: "Gipiling litrato para sa diagnosis",
    duplicatePhotoTitle: "Na-scan nani siya nga litrato",
    duplicatePhotoDescription:
      "Aduna nay litrato nga naka save daan sa Dating Scan. Palihug pagpili og laing litrato nga tarong og klaro sa usa ka dahon o bunga sa mangga, o pangitaa ang resulta sa Dating Scan.",
    // "Aduna nay natipig nga diagnosis kini nga litrato. Pagpili og laing litrato, o pangitaa ang resulta sa Dating Scan.",
    viewSavedResultBtn: "Tan-awa ang litrato sa Dating Scan",
    checkingPhoto: "Gisusi ang litrato...",
    photoCheckFailedText:
      "Wala masusi kung na-scan na kini nga litrato. Sulayi pag-usab, o pagpili og laing litrato.",
    retryPhotoCheckBtn: "Sulayi pag-usab",
    photoCheckHint:
      "Susiha nga klarong makita ang tibuok usa ka dahon o bunga sa mangga, nga dili hanap, silaw, o natabonan og baga nga landong. Pagkuha og laing litrato kung kinahanglan.",

    // How It Works Card
    HowItWorksTitle: "Unsaon ni pag-gamit?",

    // Scan History Section
    recentScansTitle: "Bag-ong Scan",
    scanHistoryTitle: "Mga nangaging Scan",
    pageOfTotal: "Panid {n} sa {total}",
    previousPage: "Miaging panid",
    nextPage: "Sunod nga panid",
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
    uncertainPhotoHeading: "Sulayi og laing litrato",
    uncertainPhotoReminder:
      "Dili maka diagnose ang application og resulta basi sa litrato. Sulayi usab og gamit usa ka laing litrato nga tarong og klaro nga bunga o dahon sa mangga, nga adunay igo nga tama-tama kahayag sa background.",
    guidelinesLoading: "Gikarga ang natipig nga giya sa pagtambal...",
    guidelinesUnavailable:
      "Wala pay giya sa pagtambal nga magamit niini nga device. Konektar sa internet ug hulata nga mahuman ang pag-sync sa app, dayon sulayi usab.",
    closeDetailsBtn: "Isara ang detalye",
    noImageOffline: "Walay litrato nga natipigan niini nga device",

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
    aboutModelVersionLabel:
      "Kasamtangang modelo para sa dahon ug bunga sa mangga",
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
    healthyLabel: "Himsog nga Dahon ug Himsog nga Bunga",
    healthyDesc:
      "Lahi ang himsog nga resulta para sa dahon ug bunga sa mangga.",
    diagnosticScope:
      "Ang model mosusi sa Anthracnose, Sooty Mold, Bacterial Canker, Bacterial Black Spot, Mango Scab, Healthy Leaf, ug Healthy Fruit. Ang resulta nga ubos sa 70% confidence o dili makapasar sa margin ug entropy mahimong Uncertain.",

    // Bottom Navigation & Scan Sheet
    navScan: "I-scan",
    scanSheetTitle: "Magsugod og Scan",
    scanSheetFramingLabel: "Pagpahimutang:",
    scanSheetFramingTip:
      "Siguroha nga makita ang tibuok usa ka dahon o bunga sa mangga. Duola aron klarong makita ang mga bahin nga adunay kadaot.",
    scanSheetLightingLabel: "Kahayag:",
    scanSheetLightingTip:
      "Gamit og igo ug pantay nga kahayag; likayi ang silaw nga repleksyon ug baga nga landong.",
    scanSheetCameraDesc: "Pagkuha og bag-ong litrato gamit ang kamera.",
    scanSheetGalleryDesc: "Pilia ang litrato gikan sa imong gallery.",

    // How It Works Steps (visual cards)
    howStep1Title: "Kuhaa o I-upload",
    howStep1Desc:
      "Pagkuha o pag-upload og klarong litrato sa usa ka tibuok dahon o bunga sa mangga nga adunay igo ug pantay nga kahayag.",
    howStep2Title: "Susiha ug I-scan",
    howStep2Desc:
      "Susiha ang litrato. Pagpili usab kung kinahanglan, dayon i-tap ang Sugdan ang Diagnosis.",
    howStep3Title: "Basaha ang Resulta",
    howStep3Desc:
      "Basaha ang posibleng kondisyon ug ang magamit nga giya sa English o Bisaya. Kung dili sigurado ang resulta, sulayi gamit ang laing klarong litrato.",

    // Footer
    footerCopyright:
      "© 2026 MangoLeaf AI. Gidisenyo alang sa Kaugmaon sa Agrikultura sa Pilipinas.",
    footerVersions: "PWA {appVersion} / Modelo {modelVersion}",
    privacyPolicy: "Polisiya sa Pribasya",
    termsOfService: "Kondisyon sa Serbisyo",
  },
};
