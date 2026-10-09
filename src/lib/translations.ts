export type Language = "en" | "bis";

export const translations = {
  en: {
    // Navigation
    navHome: "Home",
    navAbout: "About",
    navHistory: "History",
    installApp: "Install App",
    downloadApp: "Install",
    downloadPromptTitle: "Install Now",
    downloadPromptDescription:
      "Open MangoLeaf AI on your phone and add it to your Home Screen for quick access.",

    // Installation guide
    installGuideDesktopTitle: "Install MangoLeaf AI on your phone",
    installGuideMobileTitle: "Install MangoLeaf AI",
    installGuideDescription:
      "Add MangoLeaf AI to your Home Screen for quick access. You can also keep using it in your browser.",
    installGuideQRDescription:
      "Scan this QR code using your phone camera, then tap the website link.",
    installGuideQRAlt: "QR code to open MangoLeaf AI on your phone",
    installGuideWebsiteLink: "Open MangoLeaf AI website",
    installGuideAndroid: "Android",
    installGuideIOS: "iPhone / iPad",
    installGuideAndroidOpen: "Open the website",
    installGuideAndroidOpenDescription:
      "Open the QR link in your phone browser, such as Chrome.",
    installGuideAndroidInstall: "Tap Install",
    installGuideAndroidInstallDescription:
      "Tap Install on this guide when the button is available.",
    installGuideConfirm: "Confirm installation",
    installGuideConfirmDescription:
      "Choose Install in the browser confirmation, then find MangoLeaf AI on your Home Screen or app list.",
    installGuideManualAndroid:
      "If the Install button is unavailable, open your browser menu and look for Install app or Add to Home screen. If neither appears, continue in your browser.",
    installGuideIOSBrowser:
      "Use Safari for these steps. If you opened the link in another browser and cannot find Add to Home Screen, open the website in Safari.",
    installGuideIOSShare: "Tap Share",
    installGuideIOSShareDescription:
      "Tap the Share icon in Safari. If it is hidden, open the browser menu first.",
    installGuideIOSHome: "Add to Home Screen",
    installGuideIOSHomeDescription:
      "Scroll through the Share menu and choose Add to Home Screen.",
    installGuideIOSAdd: "Tap Add",
    installGuideIOSAddDescription:
      "Confirm the app name, then tap Add. Open MangoLeaf AI from your Home Screen.",
    installGuideFallbackTitle: "Install from your browser menu",
    installGuideFallbackDescription:
      "Look for Install app or Add to Home screen in your browser menu. If installation is not offered, you can keep using MangoLeaf AI in this browser.",
    installGuideInstall: "Install",
    installGuideInstalling: "Opening install prompt...",
    installGuideContinue: "Continue in Browser",
    installGuideInstalled: "MangoLeaf AI is already installed",
    installGuideInstalledDescription:
      "Open it from your Home Screen or continue here in your browser.",
    installGuideInstallError:
      "The installation prompt could not open. Use your browser menu or continue in your browser.",

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

    // Live camera and its visual positioning guide
    guidedCameraTitle: "Take a Photo",
    guidedCameraHint:
      "Center one whole mango leaf or fruit inside the box. Hold steady and use good light.",
    guidedCameraGuideNote:
      "The box guides positioning. The photo includes the full camera view.",
    guidedCameraStarting: "Opening camera...",
    guidedCameraCaptureBtn: "Capture Photo",
    guidedCameraCapturing: "Capturing photo...",
    guidedCameraRetryBtn: "Open camera again",
    guidedCameraUnsupported:
      "Live camera is unavailable here. Close this screen and choose Upload Photo.",
    guidedCameraPermissionDenied:
      "Camera access was blocked. Allow camera access in browser settings, then try again.",
    guidedCameraUnavailable:
      "Camera is unavailable or in use. Close other camera apps, then try again.",
    guidedCameraStartFailed:
      "The camera preview could not start. Try again, or close this screen and choose Upload Photo.",
    guidedCameraCaptureFailed:
      "The photo could not be captured. Open the camera again, or close this screen and choose Upload Photo.",
    guidedCameraPaused:
      "Camera stopped while the app was in the background. Open it again when ready.",
    guidedCameraInterrupted:
      "Camera connection stopped. Open it again to continue.",

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
    recentScansTitle: "Recent Scan",
    // Desktop uses the plural heading when more than one card is displayed.
    recentScanDesktopTitle: "Recent Scan",
    recentScansDesktopTitle: "Recent Scans",
    scanHistoryTitle: "Scan history",
    pageOfTotal: "Page {n} of {total}",
    previousPage: "Previous page",
    nextPage: "Next page",
    searchPlaceholder: "Search by name...",
    filterAll: "All",
    historyFilterBtn: "Filters",
    historyFilterLabel: "Filter scans",
    historyFilterActiveBtn: "Filters: {name}",
    historyFilterOptionCount: "{name} ({n})",
    historyFilterAnthracnose: "Anthracnose",
    historyFilterHealthy: "Healthy",
    historyFilterSooty: "Sooty Mold",
    historyFilterScab: "Mango Scab",
    historyFilterCanker: "Bacterial Canker",
    historyFilterBlack: "Bacterial Black Spot",
    historyFilterUncertain: "Uncertain",
    viewAllHistory: "View All History",
    viewAllHistoryShort: "View All",
    noScanHistoryTitle: "No Scan History Yet",
    noScanHistoryText:
      "No previous scans recorded on this device. Upload or take a photo to run your first diagnosis!",
    historySelectBtn: "Select",
    historySelectAllResultsBtn: "Select all",
    historySelectAllCountBtn: "Select all ({n})",
    historyCancelSelectionBtn: "Cancel",
    // English uses a singular label for one scan; Bisaya shares one counted form.
    historyDeleteSelectedBtn: "Delete {n} scans",
    historyDeleteSelectedOneBtn: "Delete {n} scan",
    historyDeleteSelectedCountBtn: "Delete ({n})",
    historySelectedCount: "{n} selected",
    historySelectionHint: "Select all includes matching scans on every page.",
    historySelectScanLabel: "Select scan: {name}",
    historyDetailsScanLabel: "View details: {name}",
    historyDeleteConfirmTitle: "Delete selected scans ({n})?",
    historyDeleteConfirmOneTitle: "Delete selected scan ({n})?",
    historyDeleteConfirmDescription:
      "The selected reports and saved photos will be deleted. This cannot be undone. Linked cloud copies are removed after a successful sync.",
    historyDeleteConfirmOneDescription:
      "The selected report and saved photo will be deleted. This cannot be undone. Linked cloud copies are removed after a successful sync.",
    historyDeleteConfirmBtn: "Delete",
    historyDeletingBtn: "Deleting...",
    historyDeleteFailed:
      "The selected scans could not be deleted. Please try again.",
    historyDeleteOneFailed:
      "The selected scan could not be deleted. Please try again.",
    historyNoMatchingResults: "No scans match your search or filter.",

    // Card & Scan Labels
    detailsBtn: "Details",
    deleteScanBtn: "Delete scan",
    deleteScanLabel: "Delete scan: {name}",
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
    classProbabilityHeading: "Model class probabilities",
    classColumn: "Class",
    probabilityColumn: "Probability",
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
    scanSheetTitle: "Select Scan Option",
    scanSheetTipsTitle: "Photo tips",
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
    downloadApp: "I-install",
    downloadPromptTitle: "I-install Karon",
    downloadPromptDescription:
      "Ablihi ang MangoLeaf AI sa imong telepono ug idugang kini sa imong Home Screen aron dali maablihan.",

    // Installation guide
    installGuideDesktopTitle: "I-install ang MangoLeaf AI sa imong telepono",
    installGuideMobileTitle: "I-install ang MangoLeaf AI",
    installGuideDescription:
      "Idugang ang MangoLeaf AI sa imong Home Screen aron dali maablihan. Mahimo usab kini gamiton sa imong browser.",
    installGuideQRDescription:
      "I-scan kini nga QR code gamit ang kamera sa imong telepono, dayon i-tap ang link sa website.",
    installGuideQRAlt:
      "QR code aron maablihan ang MangoLeaf AI sa imong telepono",
    installGuideWebsiteLink: "Ablihi ang website sa MangoLeaf AI",
    installGuideAndroid: "Android",
    installGuideIOS: "iPhone / iPad",
    installGuideAndroidOpen: "Ablihi ang website",
    installGuideAndroidOpenDescription:
      "Ablihi ang link gikan sa QR code sa browser sa imong telepono, sama sa Chrome.",
    installGuideAndroidInstall: "I-tap ang Install",
    installGuideAndroidInstallDescription:
      "I-tap ang Install niini nga giya kung makita ang buton.",
    installGuideConfirm: "Kumpirmaha ang pag-install",
    installGuideConfirmDescription:
      "Pilia ang Install sa kumpirmasyon sa browser, dayon pangitaa ang MangoLeaf AI sa imong Home Screen o listahan sa mga app.",
    installGuideManualAndroid:
      "Kung walay Install nga buton, ablihi ang menu sa imong browser ug pangitaa ang Install app o Add to Home screen. Kung wala kining duha, padayon sa browser.",
    installGuideIOSBrowser:
      "Gamit og Safari alang niini nga mga lakang. Kung naa sa laing browser ug walay Add to Home Screen, ablihi ang website sa Safari.",
    installGuideIOSShare: "I-tap ang Share",
    installGuideIOSShareDescription:
      "I-tap ang Share nga icon sa Safari. Kung wala kini makita, ablihi una ang menu sa browser.",
    installGuideIOSHome: "Add to Home Screen",
    installGuideIOSHomeDescription:
      "I-scroll ang menu sa Share ug pilia ang Add to Home Screen.",
    installGuideIOSAdd: "I-tap ang Add",
    installGuideIOSAddDescription:
      "Kumpirmaha ang ngalan sa app, dayon i-tap ang Add. Ablihi ang MangoLeaf AI gikan sa imong Home Screen.",
    installGuideFallbackTitle: "I-install gikan sa menu sa browser",
    installGuideFallbackDescription:
      "Pangitaa ang Install app o Add to Home screen sa menu sa imong browser. Kung walay kapilian sa pag-install, mahimo gihapon gamiton ang MangoLeaf AI sa browser.",
    installGuideInstall: "I-install",
    installGuideInstalling: "Giablihan ang kumpirmasyon sa pag-install...",
    installGuideContinue: "Padayon sa Browser",
    installGuideInstalled: "Na-install na ang MangoLeaf AI",
    installGuideInstalledDescription:
      "Ablihi kini gikan sa imong Home Screen o padayon dinhi sa imong browser.",
    installGuideInstallError:
      "Wala maablihan ang kumpirmasyon sa pag-install. Gamit ang menu sa browser o padayon sa browser.",

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

    // Live camera and its visual positioning guide
    guidedCameraTitle: "Pagkuha og Litrato",
    guidedCameraHint:
      "Ibutang sa tunga sa kahon ang usa ka tibuok dahon o bunga sa mangga. Ipirme ang kamera ug gamita ang maayong kahayag.",
    guidedCameraGuideNote:
      "Giya sa pagpahimutang ang kahon. Apil sa litrato ang tibuok makita sa kamera.",
    guidedCameraStarting: "Giablihan ang kamera...",
    guidedCameraCaptureBtn: "Kuhaa ang Litrato",
    guidedCameraCapturing: "Gikuha ang litrato...",
    guidedCameraRetryBtn: "Ablihi pag-usab ang kamera",
    guidedCameraUnsupported:
      'Dili magamit dinhi ang live camera. Isira kini nga screen ug pilia ang "I-upload ang Litrato".',
    guidedCameraPermissionDenied:
      "Gibabagan ang access sa kamera. Tugoti ang kamera sa mga setting sa browser, dayon sulayi pag-usab.",
    guidedCameraUnavailable:
      "Dili magamit o gigamit ang kamera. Isira ang ubang app nga naggamit sa kamera, dayon sulayi pag-usab.",
    guidedCameraStartFailed:
      'Wala masugdi ang preview sa kamera. Sulayi pag-usab, o isira kini nga screen ug pilia ang "I-upload ang Litrato".',
    guidedCameraCaptureFailed:
      'Wala makuha ang litrato. Ablihi pag-usab ang kamera, o isira kini nga screen ug pilia ang "I-upload ang Litrato".',
    guidedCameraPaused:
      "Mihunong ang kamera samtang naa sa background ang app. Ablihi kini pag-usab kung andam na.",
    guidedCameraInterrupted:
      "Mihunong ang koneksyon sa kamera. Ablihi kini pag-usab aron makapadayon.",

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
    recentScanDesktopTitle: "Bag-ong Scan",
    recentScansDesktopTitle: "Mga Bag-ong Scan",
    scanHistoryTitle: "Mga nangaging scan",
    pageOfTotal: "Panid {n} sa {total}",
    previousPage: "Miaging panid",
    nextPage: "Sunod nga panid",
    searchPlaceholder: "Pangitaa pinaagi sa pangalan...",
    filterAll: "Tanan",
    historyFilterBtn: "Mga filter",
    historyFilterLabel: "I-filter ang mga scan",
    historyFilterActiveBtn: "Mga filter: {name}",
    historyFilterOptionCount: "{name} ({n})",
    historyFilterAnthracnose: "Anthracnose",
    historyFilterHealthy: "Himsog",
    historyFilterSooty: "Sooty Mold",
    historyFilterScab: "Mango Scab",
    historyFilterCanker: "Bacterial Canker",
    historyFilterBlack: "Bacterial Black Spot",
    historyFilterUncertain: "Dili Sigurado",
    viewAllHistory: "Tan-awa Ang Tanang History",
    viewAllHistoryShort: "Tan-awa Tanan",
    noScanHistoryTitle: "Wala pay Nangaging Scan",
    noScanHistoryText:
      "Wala pay nangaging scan nga nakarecord sa kini nga device. Pag-upload o paglitrato og unsa ka dahon o bunga sa mangga aron masugdan ang pag-scan!",
    historySelectBtn: "Pilia",
    historySelectAllResultsBtn: "Pilia tanan",
    historySelectAllCountBtn: "Pilia tanan ({n})",
    historyCancelSelectionBtn: "I-kansela",
    historyDeleteSelectedBtn: "I-delete ang {n} ka scan",
    historyDeleteSelectedOneBtn: "I-delete ang {n} ka scan",
    historyDeleteSelectedCountBtn: "I-delete ({n})",
    historySelectedCount: "{n} gipili",
    historySelectionHint:
      "Ang pagpili sa tanan apil ang mga scan nga nagtugma sa matag panid.",
    historySelectScanLabel: "Pilia ang scan: {name}",
    historyDetailsScanLabel: "Tan-awa ang detalye: {name}",
    historyDeleteConfirmTitle: "I-delete ang mga gipiling scan ({n})?",
    historyDeleteConfirmOneTitle: "I-delete ang gipiling scan ({n})?",
    historyDeleteConfirmDescription:
      "I-delete ang mga gipiling report ug natipig nga litrato. Dili na kini mabalik. Ang mga konektadong kopya sa cloud i-delete human sa malampusong pag-sync.",
    historyDeleteConfirmOneDescription:
      "I-delete ang gipiling report ug natipig nga litrato. Dili na kini mabalik. Ang mga konektadong kopya sa cloud i-delete human sa malampusong pag-sync.",
    historyDeleteConfirmBtn: "I-delete",
    historyDeletingBtn: "Ginadelete...",
    historyDeleteFailed:
      "Wala mapapas ang mga gipiling scan. Palihug sulayi pag-usab.",
    historyDeleteOneFailed:
      "Wala mapapas ang gipiling scan. Palihug sulayi pag-usab.",
    historyNoMatchingResults:
      "Walay scan nga nagtugma sa imong gipangita o filter.",

    // Card & Scan Labels
    detailsBtn: "Detalye",
    deleteScanBtn: "I-delete ang scan",
    deleteScanLabel: "I-delete ang scan: {name}",
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
    classProbabilityHeading: "Mga probabilidad sa klase sa modelo",
    classColumn: "Klase",
    probabilityColumn: "Probabilidad",
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
    scanSheetTitle: "Pili sa duha ka Scan",
    scanSheetTipsTitle: "Mga tip sa litrato",
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
