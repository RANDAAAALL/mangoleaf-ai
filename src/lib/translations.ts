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
      "Add MangoLeaf AI to your Home Screen for quick access. You can also keep using it in your phone browser.",
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
    stagePreparingPhoto: "Preparing photo...",
    stageAnalyzingPhoto: "Analyzing photo...",
    stagePreparingResult: "Preparing result...",
    stageSavingResult: "Saving result...",
    scanFailedText:
      "The scan could not finish. Try again, or choose another photo.",
    scanTimeoutText: "This step took too long. Try again, or retake the photo.",
    scanCancelledText:
      "Scan cancelled. You can try again or choose another photo.",
    scanInferencePendingText:
      "The previous analysis has not finished. Reload the app to start a new scan.",
    retryDiagnosisBtn: "Retry diagnosis",
    reloadAppBtn: "Reload app",
    modelLoadFailedText: "The AI could not start. Reload the app to try again.",
    photoCheckHint:
      "Check that one whole leaf or fruit is clearly visible, without blur, bright reflections, or deep shadows. Retake if needed.",

    // Local scan storage recovery
    storageFullTitle: "Device storage is full",
    storageHelpLabel: "Storage recovery instructions",
    storageFullText:
      "This scan could not be saved. Delete scans you no longer need from History, then retry saving. No scans have been deleted automatically.",
    storagePendingText:
      "Your photo and result are kept only while this page stays open. Reloading or closing the app will lose this unsaved result.",
    storageUnsavedTitle: "One scan is not saved yet",
    storageManageHistoryBtn: "Open History",
    storageRetrySaveBtn: "Retry save",
    storageDiscardBtn: "Discard unsaved result",
    storageSavingText: "Saving result…",
    storageStillFullText:
      "Storage is still full. Delete more scans or free space on your device, then retry.",
    storageSaveFailedText:
      "Saving failed. Your result is still unsaved. Try again.",
    storageSaveTimeoutText:
      "Saving took too long. Your result is still unsaved. Try again.",

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
      "The selected reports and saved photos will be deleted from this browser. This cannot be undone.",
    historyDeleteConfirmOneDescription:
      "The selected report and saved photo will be deleted from this browser. This cannot be undone.",
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
    aboutSyncTitle: "Updated treatment guidance",
    aboutSyncDesc:
      "Treatment guidelines refresh when connected. Your scan history and photos stay in this browser.",
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
      "The model checks Anthracnose, Sooty Mold, Bacterial Canker, Bacterial Black Spot, Mango Scab, Healthy Leaf, and Healthy Fruit. A result below 70% confidence is Uncertain.",

    // Bottom Navigation & Scan Sheet
    navScan: "Scan",
    scanSheetTitle: "Select Scan Option",
    // scanSheetTitle: "Start a Scan",
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

    diagnosticsTitle: "Diagnostics",
    diagnosticsDescription:
      "For troubleshooting on this phone: enable recording, repeat the problem, then return here to copy or download the log. Events from across the app remain when a modal closes. Logs show recorded steps, not a guaranteed cause.",
    diagnosticsEnable: "Record diagnostic events",
    diagnosticsRetention:
      "Keeps up to {n} recent events locally, with a size limit. Recording stays enabled after reopening. Saving is best-effort; a crash or clearing browser data can lose events. Logs contain technical states and error names, without photos or diagnosis results. Nothing is uploaded automatically.",
    diagnosticsMemoryOnly:
      "This browser could not save diagnostic logs. Recording can continue in memory; copy or download before refreshing or closing the app.",
    diagnosticsView: "View logs",
    diagnosticsHide: "Hide logs",
    diagnosticsEventCount: "Recorded events: {n}",
    diagnosticsLogLabel: "Diagnostic log",
    diagnosticsCopy: "Copy logs",
    diagnosticsDownload: "Download logs",
    diagnosticsClear: "Clear logs",
    diagnosticsCopied: "Logs copied.",
    diagnosticsCopyFailed:
      "Copy was unavailable. Select the log text to copy it manually, or download the log.",
    diagnosticsDownloadFailed:
      "The log download could not start. Select and copy the text instead.",
    diagnosticsCleared: "Diagnostic logs cleared. Scan history is unchanged.",

    // Footer
    footerVersions: "PWA {appVersion} / Model {modelVersion}",
    footerCopyright:
      "© 2026 MangoLeaf AI. Designed for the Future of Filipino Dabawenyo Agriculture.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    legalCloseBtn: "Understood & Close",
    privacyUpdated: "Last updated: October 17, 2026",
    privacySections: [
      {
        title: "1. No account required",
        text: "You can use MangoLeaf AI without registration or sign-in. The app does not request your name, email address, or phone number.",
      },
      {
        title: "2. Photos and scan history stay on this device",
        text: "The AI analyzes photos in your browser. Saved results and compressed photos are stored in this browser’s IndexedDB database, online or offline. New scans are not uploaded to Supabase.",
      },
      {
        title: "3. Treatment guideline updates",
        text: "When connected, the app downloads public treatment guidelines from Supabase and saves them on this device for offline reading. These requests do not include your scan photos or results.",
      },
      {
        title: "4. Local storage and data loss",
        text: "Scan history belongs to this browser profile. Clearing site data, removing the browser profile, or browser storage removal can erase it. There is no account or automatic cloud recovery. A storage-full warning lets you manage History and retry an unsaved result.",
      },
      {
        title: "5. Deletion and earlier cloud copies",
        text: "You can delete saved reports and photos from History. Deletion is permanent in this browser. Earlier app versions may have uploaded cloud copies; this version does not download or delete those earlier copies.",
      },
      {
        title: "6. Optional diagnostic logs",
        text: "Recording is off by default. If you enable it in About, the app keeps recent technical events in memory and attempts to save them in this browser's localStorage. Logs include action timing, error types, app/model versions, and browser/runtime information, but exclude scan photos, diagnosis results, report identifiers, and account credentials. You can view, copy, download, or clear logs. Clearing logs preserves scan history; turning recording off retains earlier logs. Logs are not automatically uploaded. Saving can fail or lose recent events during a crash, and downloaded or copied logs remain wherever you save or share them.",
      },
    ],
    termsUpdated: "Last updated: October 17, 2026",
    termsIntro:
      "Terms of Service & Usage Guidelines | Philippine Carabao Mango Diagnostic System",
    termsScopeTitle: "1. Scope of Application:",
    termsScopeText:
      "MangoLeaf AI is specifically designed to assist Filipino smallholder farmers in detecting pre-harvest diseases affecting Philippine Carabao Mango (Mangifera indica L.) leaves and green fruit.",
    termsConfidenceTitle: "2. Diagnostic AI Confidence Threshold:",
    termsConfidenceText:
      "The highest raw mango-class score must be at least 70% for a diagnosis to be accepted. Below that, the result is Uncertain / Unrecognized. Both accepted and uncertain results show that highest score, not a score for an extra Uncertain class or a guarantee of correctness. New reports preserve the raw score; the confidence badge rounds down to at most one decimal and omits a trailing .0, such as 69.8% or 70%. Older reports retain their previously saved precision, so an older Uncertain report may still show 70%.",
    termsGuidanceTitle: "3. Treatment Guidance Disclaimer:",
    termsGuidanceText:
      "Treatment guidance draws on reviewed agricultural references, including DOST-PCAARRD and BAFS materials. It provides general decision support and does not replace advice from qualified local agricultural professionals. Updated advice requires a working connection; offline users see the guidance already saved on their device.",
    termsEthicsTitle: "4. Responsible Use and Content Rights:",
    termsEthicsText:
      "Use only photographs you own or have permission to use, and respect content licenses and source attribution. AI results are advisory and are not professional certification.",
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
    stagePreparingPhoto: "Giandam ang litrato...",
    stageAnalyzingPhoto: "Gisusi ang litrato...",
    stagePreparingResult: "Giandam ang resulta...",
    stageSavingResult: "Gitipigan ang resulta...",
    scanFailedText:
      "Wala mahuman ang scan. Sulayi pag-usab, o pagpili og laing litrato.",
    scanTimeoutText:
      "Dugay ra kaayo kini nga lakang. Sulayi pag-usab, o pagkuha og laing litrato.",
    scanCancelledText:
      "Gikansela ang scan. Mahimo kang mosulay pag-usab o mopili og laing litrato.",
    scanInferencePendingText:
      "Wala pa mahuman ang miaging pagsusi. I-reload ang app aron makasugod og bag-ong scan.",
    retryDiagnosisBtn: "Sulayi pag-usab ang pagsusi",
    reloadAppBtn: "I-reload ang app",
    modelLoadFailedText:
      "Wala makasugod ang AI. I-reload ang app aron mosulay pag-usab.",
    photoCheckHint:
      "Susiha nga klarong makita ang tibuok usa ka dahon o bunga sa mangga, nga dili hanap, silaw, o natabonan og baga nga landong. Pagkuha og laing litrato kung kinahanglan.",

    // Local scan storage recovery
    storageFullTitle: "Puno na ang storage sa device",
    storageHelpLabel: "Mga giya sa pagbakante sa storage",
    storageFullText:
      "Wala matipig kini nga scan. I-delete sa Dating Scan ang mga scan nga dili na kinahanglan, dayon sulayi pagtipig pag-usab. Walay scan nga awtomatikong gi-delete.",
    storagePendingText:
      "Ang imong litrato ug resulta gitipigan lamang samtang abli pa kini nga pahina. Kung i-reload o isira ang app, mawala kini nga wala pa matipig nga resulta.",
    storageUnsavedTitle: "Adunay usa ka scan nga wala pa matipig",
    storageManageHistoryBtn: "Ablihi ang Dating Scan",
    storageRetrySaveBtn: "Sulayi pagtipig pag-usab",
    storageDiscardBtn: "Biyai ang wala matipig nga resulta",
    storageSavingText: "Gitipigan ang resulta…",
    storageStillFullText:
      "Puno gihapon ang storage. I-delete ang dugang scan o pagbakante og lugar sa imong device, dayon sulayi pag-usab.",
    storageSaveFailedText:
      "Wala matipig ang resulta. Anaa pa kini apan wala pa matipig. Sulayi pag-usab.",
    storageSaveTimeoutText:
      "Nadugay ang pagtipig. Anaa pa ang resulta apan wala pa matipig. Sulayi pag-usab.",

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
      "I-delete ang mga gipiling report ug natipig nga litrato gikan niini nga browser. Dili na kini mabalik.",
    historyDeleteConfirmOneDescription:
      "I-delete ang gipiling report ug natipig nga litrato gikan niini nga browser. Dili na kini mabalik.",
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
    aboutSyncTitle: "Bag-ong giya sa pagtambal",
    aboutSyncDesc:
      "Ma-update ang giya sa pagtambal kung konektado. Ang imong mga scan ug litrato magpabilin niini nga browser.",
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
      "Ang model mosusi sa Anthracnose, Sooty Mold, Bacterial Canker, Bacterial Black Spot, Mango Scab, Healthy Leaf, ug Healthy Fruit. Ang resulta nga ubos sa 70% confidence mahimong Uncertain.",

    // Bottom Navigation & Scan Sheet
    navScan: "I-scan",
    scanSheetTitle: "Pili sa duha ka Scan",
    // scanSheetTitle: "Sugdi nag Scan",
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

    diagnosticsTitle: "Diagnostics",
    diagnosticsDescription:
      "Para sa pagsusi sa problema niini nga telepono: i-enable ang pagrekord, usba ang aksyon nga adunay problema, dayon balik dinhi aron kopyahon o i-download ang log. Magpabilin ang mga event sa app bisan masirado ang modal. Ang log nagpakita sa natala nga mga lakang, dili garantiya sa hinungdan.",
    diagnosticsEnable: "Irekord ang diagnostic events",
    diagnosticsRetention:
      "Hangtod {n} ka bag-ong event ang tipigan dinhi, nga adunay limitasyon sa gidak-on. Magpabiling naka-enable ang pagrekord sa pag-abli pag-usab. Posibleng mawala ang event kung mo-crash o papason ang browser data. Teknikal nga kahimtang ug ngalan sa error ang sulod, walay litrato o resulta sa diagnosis. Walay awtomatikong pag-upload.",
    diagnosticsMemoryOnly:
      "Wala matipig sa browser ang diagnostic logs. Mahimong magpadayon ang pagrekord sa memory; kopyaha o i-download una sa pag-refresh o pagsira sa app.",
    diagnosticsView: "Tan-awa ang logs",
    diagnosticsHide: "Tagoa ang logs",
    diagnosticsEventCount: "Natala nga mga event: {n}",
    diagnosticsLogLabel: "Diagnostic log",
    diagnosticsCopy: "Kopyaha ang logs",
    diagnosticsDownload: "I-download ang logs",
    diagnosticsClear: "Papasa ang logs",
    diagnosticsCopied: "Nakopya ang logs.",
    diagnosticsCopyFailed:
      "Dili magamit ang pagkopya. Pilia ang teksto sa log aron kopyahon, o i-download ang log.",
    diagnosticsDownloadFailed:
      "Wala masugdi ang pag-download. Pilia ug kopyaha ang teksto sa log.",
    diagnosticsCleared:
      "Napapas ang diagnostic logs. Wala mausab ang Dating Scan.",

    // Footer
    footerCopyright:
      "© 2026 MangoLeaf AI. Gidisenyo alang sa Kaugmaon sa Agrikultura sa Pilipinas.",
    footerVersions: "PWA {appVersion} / Modelo {modelVersion}",
    privacyPolicy: "Polisiya sa Pribasya",
    termsOfService: "Kondisyon sa Serbisyo",
    legalCloseBtn: "Nasabtan ug Isara",
    privacyUpdated: "Kataposang gi-update: Oktubre 17, 2026",
    privacySections: [
      {
        title: "1. Walay account nga gikinahanglan",
        text: "Magamit ang MangoLeaf AI bisan walay pagrehistro o pag-sign in. Dili mangayo ang app sa imong ngalan, email address, o numero sa telepono.",
      },
      {
        title: "2. Ang litrato ug mga scan magpabilin sa device",
        text: "Susihon sa AI ang litrato sa imong browser. Ang natipig nga resulta ug gipagamay nga litrato anaa sa IndexedDB niini nga browser, online man o offline. Dili i-upload sa Supabase ang bag-ong mga scan.",
      },
      {
        title: "3. Mga update sa giya sa pagtambal",
        text: "Kung konektado, i-download sa app ang publikong giya sa pagtambal gikan sa Supabase ug tipigan sa device aron mabasa offline. Dili iapil sa maong mga request ang imong litrato o resulta sa scan.",
      },
      {
        title: "4. Lokal nga storage ug pagkawala sa datos",
        text: "Ang mga scan iya niini nga browser profile. Mahimong mawala kini kung papason ang site data, tangtangon ang browser profile, o tangtangon sa browser ang storage. Walay account o awtomatikong pagbawi gikan sa cloud. Kung puno ang storage, adunay pahimangno aron madumala ang Dating Scan ug masulayan pagtipig ang resulta.",
      },
      {
        title: "5. Pag-delete ug karaang kopya sa cloud",
        text: "Mahimo nimong i-delete ang natipig nga report ug litrato sa Dating Scan. Permanente kini niini nga browser. Posibleng naka-upload og kopya sa cloud ang karaang bersyon sa app; dili na i-download o i-delete niini nga bersyon ang maong karaang mga kopya.",
      },
      {
        title: "6. Opsyonal nga diagnostic logs",
        text: "Naka-off daan ang recording. Kon imong i-on sa Bahin, tipigan sa app ang bag-ong teknikal nga panghitabo sa memory ug sulayan kining i-save sa localStorage niini nga browser. Lakip sa logs ang oras ug gidugayon sa aksiyon, matang sa error, bersyon sa app/model, ug impormasyon sa browser/runtime, apan walay litrato sa scan, resulta sa diagnosis, identifier sa report, o credential sa account. Mahimo nimong tan-awon, kopyahon, i-download, o papason ang logs. Dili mapapas ang Dating Scan kon papason ang logs; magpabilin ang daang logs kon i-off ang recording. Dili awtomatikong i-upload ang logs. Mahimong mapakyas ang pag-save o mawala ang pinakabag-ong panghitabo kon mo-crash ang app; ang na-download o nakopyang logs magpabilin diin nimo kini gitipigan o gipakigbahin.",
      },
    ],
    termsUpdated: "Kataposang gi-update: Oktubre 17, 2026",
    termsIntro: "Mga Termino sa Paggamit | Sistema sa Diagnosis sa Mangga",
    termsScopeTitle: "1. Sakop sa Paggamit:",
    termsScopeText:
      "Ang MangoLeaf AI gidisenyo alang sa mga mag-uuma sa mangga sa Pilipinas aron makatabang sa pag-diagnose sa pre-harvest nga sakit sa dahon ug prutas sa Carabao Mango (Mangifera indica L.).",
    termsConfidenceTitle: "2. AI Confidence Threshold sa Diagnosis:",
    termsConfidenceText:
      "Dawaton lamang ang diagnosis kon ang pinakataas nga raw score sa klase sa mangga labing menos 70%. Kon ubos niini, Uncertain / Unrecognized ang resulta. Ang dawaton ug uncertain nga resulta parehong magpakita sa pinakataas nga score, dili score sa dugang nga Uncertain nga klase o garantiya nga husto ang resulta. Tipigan sa bag-ong report ang raw score; ang confidence badge ipaubos ngadto sa labing daghan usa ka decimal ug dili ipakita ang kataposang .0, sama sa 69.8% o 70%. Ang karaang report magpabilin sa score nga natipigan kaniadto, busa mahimong 70% gihapon ang makita sa karaang Uncertain nga report.",
    termsGuidanceTitle: "3. Pahinumdom sa Pagtambal:",
    termsGuidanceText:
      "Ang giya sa pagtambal naggikan sa gisusi nga mga reperensiya sa agrikultura, lakip ang mga materyal sa DOST-PCAARRD ug BAFS. Kinatibuk-ang tabang kini sa pagdesisyon ug dili puli sa tambag sa kwalipikadong lokal nga eksperto sa agrikultura. Kinahanglan og koneksiyon aron makuha ang bag-ong tambag; kon offline, ang daang giya nga natipig sa device ang makita.",
    termsEthicsTitle: "4. Responsableng Paggamit ug Katungod sa Sulod:",
    termsEthicsText:
      "Gamita lamang ang mga litrato nga imo o gitugotan ka nga gamiton, ug tahora ang lisensya ug pag-ila sa gigikanan sa sulod. Tambag lamang ang resulta sa AI ug dili kini propesyonal nga sertipikasyon.",
  },
};
