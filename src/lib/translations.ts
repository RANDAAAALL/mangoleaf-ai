export type Language = "en" | "bis";

export const translations = {
  en: {
    websiteNavigationLabel: "Website navigation",
    backupTestingDescription:
      "Test reports and photos back up automatically while this app is open and online. Create and save a recovery code to restore them on another device. Offline reports wait on this device until they can upload.",
    backupAutomatic: "Cloud backup starts automatically",
    backupPause: "Pause backup",
    backupResume: "Resume backup",
    backupNewCodeHint:
      "Already have a recovery code? Enter it below. Creating a new code does not recover a forgotten code's backup.",
    backupShowCode: "Show recovery code",
    backupHideCode: "Hide recovery code",
    backupEnterCode: "Enter recovery code",
    backupClearInput: "Clear input",
    backupMergeHint:
      "Restored reports merge into History without replacing existing reports. Clearing this field only removes the typed code.",
    testingPrivacySections: [
      {
        title: "1. Local reports",
        text: "Diagnosis runs on this device. Reports and compressed photos are saved locally, including when offline.",
      },
      {
        title: "2. Automatic testing backup",
        text: "This testing build automatically uploads saved test reports and photos to the separate testing Supabase project while open and online. Supabase creates an anonymous authentication identity behind the scenes; no Sign In/Register screen or personal contact details are required. Uploads resume after reconnection.",
      },
      {
        title: "3. Recovery and deletion",
        text: "Creating a private recovery code connects recovery to the same authenticated owner. Save it outside this device. Restoring requires that code, a connection and completed cloud uploads; restored reports merge with local History. History deletion removes the local report and queues cloud deletion. Another device with an older copy can upload it again. Clearing app/browser data can erase local reports, credentials and pending deletions.",
      },
      {
        title: "4. Guidelines and diagnostics",
        text: "Guideline requests are public and contain no photos or diagnosis results. Diagnostic recording remains optional and contains bounded technical events, without photos, diagnosis results, report identifiers or recovery credentials. Logs stay local unless you choose to share them.",
      },
    ],
    siteDescription:
      "Offline-first mango leaf and fruit disease diagnosis for Android, with on-device AI and automatic private cloud backup.",
    nativePrivacyUpdated: "Updated October 22, 2026",
    nativePrivacySections: [
      {
        title: "1. Diagnosis and local reports",
        text: "Photos are analyzed on your phone. Saved reports and compressed photos stay in the Android app's private storage. Diagnosis and saving work without a cloud account or connection.",
      },
      {
        title: "2. Automatic private backup",
        text: "Saved reports and photos upload automatically to private Supabase storage while the app is open and online. An anonymous authenticated identity protects ownership without Sign In/Register screens. Create and save a private recovery code outside this phone to recover completed uploads on another phone. Anyone holding that code can access the backup; losing the phone without a saved code prevents recovery.",
      },
      {
        title: "3. Recovery and deletion",
        text: "Restoring a cloud backup is your choice. History deletion removes the local report/photo and queues deletion of its copies in the connected backup. Offline deletion retries while the app is open and online, even when uploads are paused. Keep the same recovery code connected until deletion finishes. Another device with an older copy can upload it again; pause backup there first. Uninstalling or clearing app data can erase local reports, queued deletions and the saved recovery code.",
      },
      {
        title: "4. Guidelines and updates",
        text: "Public treatment guidelines can refresh when connected. The app may download verified updates, which activate after a full restart. Public guideline requests do not contain scan photos or diagnosis results. Backup and updates need a working connection.",
      },
      {
        title: "5. Diagnostics",
        text: "Optional diagnostic logs contain bounded technical events, not photos, diagnosis results, report identifiers, or recovery credentials. Logs stay local unless you choose to share them.",
      },
    ],
    nativeWebViewUnsupported:
      "Update Android System WebView to open MangoLeaf AI.",
    nativeStartupError:
      "MangoLeaf AI could not start. Close and reopen the app. Your saved data has not been deleted.",
    androidUpdateReadyTitle: "Update ready",
    androidUpdateReadyText:
      "A verified update has downloaded. Restart MangoLeaf AI now to apply it. Your saved reports and photos stay on this phone.",
    androidUpdateManualRestart:
      "A verified update has downloaded. Fully close and reopen MangoLeaf AI to apply it. Your saved reports and photos stay on this phone.",
    androidUpdateRestart: "Restart now",
    androidUpdateLater: "Later",
    androidUpdateRestarting: "Restarting MangoLeaf AI...",
    androidUpdateRestartError:
      "Restart could not finish. Fully close and reopen the app when ready.",
    androidDownloadTitle: "MangoLeaf AI for Android",
    androidAlreadyInstalled:
      "Already installed? Open the app without downloading the APK again.",
    androidOpenApp: "Open app",
    androidOpenOrInstall: "Open or install",
    androidInstalledConfirmed:
      "MangoLeaf AI is installed on this device. Open the app to continue.",
    androidDownloadGuide: "APK download guide",
    androidDownloadAgain: "Reinstall or update Android app",
    androidDownloadAgainHint:
      "You already have the app. Download another APK only to reinstall it or update the Android version.",
    androidDownloadDescription:
      "The Android app saves reports on your phone and backs them up automatically when online. Save a private recovery code to recover them on another phone.",
    androidDownloadPending:
      "The Android APK download could not be confirmed. Check the official releases page or try again when connected.",
    androidDownloadChecking: "Checking Android APK availability...",
    androidDownloadAvailable: "Android APK available from release {version}.",
    androidDownloadVersion: "Available Android APK v{version}",
    androidDownloadApk: "Download Android APK",
    androidDownloadReleases: "View official releases",
    androidDownloadTrouble:
      "Download not finishing? Open this release on GitHub and tap mangoleaf-ai.apk.",
    androidDownloadFallback: "Download from GitHub instead",
    androidDownloadCompatibility:
      "The mobile app supports Android only. Android 8.0 or newer and an up-to-date Android System WebView are required.",
    androidDownloadMigration:
      "The APK has its own History. Existing browser reports stay in that browser and are not transferred automatically.",
    androidDownloadBrowser: "Open website",
    backupTitle: "Private cloud backup",
    backupDescription:
      "Reports and photos back up automatically while this app is open and online. No Sign In/Register screen is needed. Create and save a recovery code outside this phone to restore completed backups on another phone. Offline reports upload after reconnection.",
    backupCreate: "Create recovery code",
    backupRecoveryLabel: "Your private recovery code",
    backupRecoveryHint:
      "Anyone holding this code can access your backup. Save it outside this phone. If you lose both your phone and this code, your cloud backup cannot be recovered.",
    backupCopy: "Copy recovery code",
    backupSavedCode: "I saved my recovery code outside this phone",
    backupEnable: "Enable backup",
    backupRestoreCodeLabel: "Recovery code from your previous device",
    backupConnect: "Use recovery code",
    backupEnabled: "Cloud backup enabled",
    backupDisabled: "Cloud backup is off",
    backupNow: "Back up now",
    backupRestore: "Restore cloud reports",
    backupDisable: "Turn off backup on this device",
    backupDeleteCloud: "Delete this cloud backup",
    backupDeleteConfirm:
      "I paused backup on my other devices and understand this permanently deletes this recovery code's cloud reports and photos. Another enabled device can create new copies.",
    backupDeletionExplanation:
      "History deletion removes the local report/photo and deletes its copies in the connected cloud backup. Offline deletions retry while the app is open and online, even if uploads are paused. Keep the recovery code connected until deletion finishes. Pause backup on other devices holding older copies so they cannot upload those copies again. Restore remains manual.",
    backupBusy: "Working…",
    backupError:
      "Backup could not finish. Check your connection and recovery code, then retry. Local reports are safe.",
    backupDone: "Backup operation completed.",
    backupCodeCopied: "Recovery code copied. Save it outside this phone.",
    backupCodeCopyFailed: "Could not copy. Save the displayed code carefully.",
    backupRestored: "Restored {n} new reports.",
    backupUploaded: "Backed up {n} reports.",
    backupCloudDeleted:
      "Cloud backup deleted. Local reports remain on this device.",
    // Navigation
    navHome: "Home",
    navAbout: "About",
    navHistory: "History",
    installApp: "Install App",
    downloadApp: "Install",
    downloadPromptTitle: "Get MangoLeaf AI",
    downloadPromptDescription:
      "Get the MangoLeaf AI Android APK for offline diagnosis on your phone.",

    // Installation guide
    installGuideDesktopTitle: "Get MangoLeaf AI for Android",
    installGuideMobileTitle: "Install MangoLeaf AI for Android",
    installGuideDescription:
      "MangoLeaf AI supports Android phones only. Install the app using its APK. The website remains available from other devices.",
    installGuideQRDescription:
      "Scan this QR code with an Android phone to open the APK installation guide.",
    installGuideQRAlt: "QR code for MangoLeaf AI Android installation",
    installGuideWebsiteLink: "Open MangoLeaf AI website",
    installGuideAndroid: "Android",
    installGuideAndroidOpen: "Get the Android APK",
    installGuideAndroidOpenDescription:
      "Open the APK download guide below. Its download button gets the installer from official GitHub Releases when available.",
    installGuideAndroidInstall: "Open APK",
    installGuideAndroidInstallDescription:
      "Open the APK file. If Android asks, allow this browser or file manager to install the trusted download.",
    installGuideConfirm: "Confirm installation",
    installGuideConfirmDescription:
      "Tap Install in the Android installer, then open MangoLeaf AI from your app list.",
    installGuideContinue: "Back to website",

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

    // Live camera and its square capture preview
    guidedCameraTitle: "Take a Photo",
    guidedCameraHint:
      "Center one whole mango leaf or fruit inside the box. Hold steady and use good light.",
    guidedCameraGuideNote:
      "The photo includes only what you see inside the square preview.",
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
      "The selected reports and saved photos will be deleted from this device. This cannot be undone.",
    historyDeleteConfirmOneDescription:
      "The selected report and saved photo will be deleted from this device. This cannot be undone.",
    historyCloudDeleteHint:
      "Copies in your connected cloud backup will also be deleted. Offline deletions retry when the app is open and online.",
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
      "MangoLeaf AI is an offline-first Android application that brings AI-assisted mango disease detection closer to Filipino Dabawenyo farmers.",
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
      "Treatment guidelines refresh when connected. The Android app keeps scan History and photos in private app storage.",
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
      "Bringing the model into an offline-first Android application.",
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
    footerVersions: "App {appVersion} / Model {modelVersion}",
    footerApkVersions: "Android APK v{apkVersion} / Model {modelVersion}",
    aboutWebVersion: "Web app {version}",
    footerCopyright:
      "© 2026 MangoLeaf AI. Designed for the Future of Filipino Dabawenyo Agriculture.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    legalCloseBtn: "Understood & Close",
    privacyUpdated: "Last updated: October 24, 2026",
    privacySections: [
      {
        title: "1. Website use",
        text: "The website explains MangoLeaf AI and provides Android installation. It does not scan photos, show History, record diagnostics or upload private reports, including during development. No registration or sign-in is needed.",
      },
      {
        title: "2. Android reports and earlier browser data",
        text: "The Android APK analyzes photos on the device and stores its reports and photos in private app storage. Earlier browser reports and photos remain in that browser profile without a History interface; this website does not read, transfer or delete them.",
      },
      {
        title: "3. Website storage and download checks",
        text: "The website remembers your language choice locally when browser storage is available. The download page checks public GitHub release metadata to offer the official APK. These checks contain no scan photos or diagnosis results.",
      },
      {
        title: "4. Legacy browser storage and data loss",
        text: "Clearing site data, removing a browser profile or browser storage eviction can erase earlier browser reports, photos and saved settings. They are not transferred automatically into the APK, and this website offers no browser recovery controls.",
      },
      {
        title: "5. Earlier cloud copies",
        text: "This website does not start private backup, restore or deletion workers. Earlier cloud copies and stored browser deletion jobs are left unchanged. The Android app has its own authenticated backup, recovery and deletion behavior.",
      },
      {
        title: "6. Diagnostics",
        text: "The website has no Diagnostics panel and does not start diagnostic recording. Earlier browser logs are left unchanged. APK diagnostics remain optional and local unless you choose to share them.",
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
    websiteNavigationLabel: "Navigasyon sa website",
    backupTestingDescription:
      "Awtomatikong i-back up ang test report ug litrato samtang abli ug online ang app. Paghimo ug tipigi ang recovery code aron mabawi kini sa laing device. Ang offline nga mga report maghulat niini nga device hangtod ma-upload.",
    backupAutomatic: "Awtomatikong magsugod ang cloud backup",
    backupPause: "I-pause ang backup",
    backupResume: "Ipadayon ang backup",
    backupNewCodeHint:
      "Aduna ka nay recovery code? Isulod kini sa ubos. Ang bag-ong code dili makabawi sa backup sa nakalimtang code.",
    backupShowCode: "Ipakita ang recovery code",
    backupHideCode: "Itago ang recovery code",
    backupEnterCode: "Isulod ang recovery code",
    backupClearInput: "Haw-asa ang gisulod",
    backupMergeHint:
      "Ang gi-restore nga mga report idugang sa Dating Scan nga walay pag-ilis sa anaa nang report. Ang paghaw-as niini nga field motangtang lamang sa gisulod nga code.",
    testingPrivacySections: [
      {
        title: "1. Lokal nga mga report",
        text: "Dinhi sa device himoon ang diagnosis. Lokal nga tipigan ang mga report ug gipagamay nga litrato bisan offline.",
      },
      {
        title: "2. Awtomatikong testing backup",
        text: "Kini nga testing build awtomatikong mo-upload sa natipig nga test report ug litrato ngadto sa lahi nga testing Supabase project samtang abli ug online. Maghimo ang Supabase og anonymous nga identidad sa luyo sa app; walay Sign In/Register nga screen o personal nga detalye nga gikinahanglan. Mopadayon ang upload human makakonekta pag-usab.",
      },
      {
        title: "3. Pagbawi ug pagtangtang",
        text: "Ang paghimo og pribadong recovery code magkonektar sa pagbawi ngadto sa samang napamatud-ang tag-iya. Tipigi kini gawas sa device. Gikinahanglan ang code, koneksyon ug nahuman nga cloud upload aron ma-restore; idugang ang mga report sa lokal nga Dating Scan. Ang pagtangtang sa History mopapas sa lokal nga report ug mopila sa cloud deletion. Ang laing device nga adunay karaang kopya mahimong mo-upload niini pag-usab. Ang paglimpyo sa app/browser data mahimong mopapas sa lokal nga report, credential ug pending nga pagtangtang.",
      },
      {
        title: "4. Mga giya ug diagnostics",
        text: "Publiko ang mga request sa giya ug walay litrato o resulta sa diagnosis. Opsyonal gihapon ang diagnostic recording ug limitado sa teknikal nga panghitabo, walay litrato, resulta sa diagnosis, identifier sa report o recovery credential. Lokal ang logs gawas kon imong pilion nga ipaambit.",
      },
    ],
    siteDescription:
      "Offline-first nga pag-ila sa sakit sa dahon ug bunga sa mangga para sa Android, nga adunay AI sa device ug awtomatikong pribadong cloud backup.",
    nativePrivacyUpdated: "Gi-update niadtong Oktubre 22, 2026",
    nativePrivacySections: [
      {
        title: "1. Diagnosis ug lokal nga mga report",
        text: "Sa imong telepono analisahon ang mga litrato. Ang natipig nga mga report ug compressed nga litrato anaa sa pribadong storage sa Android app. Magamit ang diagnosis ug pagtipig bisan walay cloud account o koneksyon.",
      },
      {
        title: "2. Awtomatikong pribadong backup",
        text: "Awtomatikong i-upload ang natipig nga mga report ug litrato ngadto sa pribadong Supabase storage samtang abli ug online ang app. Protektado ang pagpanag-iya pinaagi sa anonymous nga identidad nga walay Sign In/Register nga screen. Paghimo ug tipigi ang pribadong recovery code gawas sa telepono aron mabawi ang nahuman nga upload sa laing telepono. Bisan kinsa nga adunay code makaabli sa backup; kon mawala ang telepono nga walay natipig nga code, dili na kini mabawi.",
      },
      {
        title: "3. Pagbawi ug pagtangtang",
        text: "Imong pilion ang pag-restore sa cloud backup. Ang pagtangtang sa History mopapas sa lokal nga report/litrato ug mopila sa pagtangtang sa mga kopya niini sa konektadong backup. Sulayan pag-usab ang offline nga pagtangtang samtang abli ug online ang app, bisan gi-pause ang upload. Ipadayon ang koneksyon sa samang recovery code hangtod mahuman ang pagtangtang. Mahimong ma-upload pag-usab sa laing device ang karaang kopya; i-pause una ang backup didto. Ang pag-uninstall o paglimpyo sa app data mahimong mopapas sa lokal nga report, gipilang pagtangtang ug natipig nga recovery code.",
      },
      {
        title: "4. Mga giya ug update",
        text: "Mahimong ma-refresh ang publikong mga giya sa pagtambal kon konektado. Mahimong mo-download ang app og napamatud-ang update nga magamit human hingpit nga i-restart. Walay litrato o resulta sa diagnosis sa publikong guideline request. Nagkinahanglan og koneksyon ang backup ug mga update.",
      },
      {
        title: "5. Diagnostics",
        text: "Limitadong teknikal nga mga hitabo ra ang opsyonal nga diagnostic log, dili mga litrato, resulta, report ID, o recovery credential. Lokal ra ang log hangtod imo kining ipaambit.",
      },
    ],
    nativeWebViewUnsupported:
      "I-update ang Android System WebView aron maablihan ang MangoLeaf AI.",
    nativeStartupError:
      "Wala makasugod ang MangoLeaf AI. Isira ug ablihi pag-usab ang app. Wala mapapas ang imong natipig nga datos.",
    androidUpdateReadyTitle: "Andam na ang update",
    androidUpdateReadyText:
      "Na-download na ang napamatud-ang update. I-restart ang MangoLeaf AI karon aron magamit kini. Magpabilin sa telepono ang imong natipig nga mga report ug litrato.",
    androidUpdateManualRestart:
      "Na-download na ang napamatud-ang update. Hingpit nga isira ug ablihi pag-usab ang MangoLeaf AI aron magamit kini. Magpabilin sa telepono ang imong mga report ug litrato.",
    androidUpdateRestart: "I-restart karon",
    androidUpdateLater: "Unya na",
    androidUpdateRestarting: "Gisugdan pag-usab ang MangoLeaf AI...",
    androidUpdateRestartError:
      "Wala mahuman ang pag-restart. Hingpit nga isira ug ablihi pag-usab ang app kon andam na.",
    androidDownloadTitle: "MangoLeaf AI alang sa Android",
    androidAlreadyInstalled:
      "Na-install na? Ablihi ang app nga dili na mag-download pag-usab sa APK.",
    androidOpenApp: "Ablihi ang app",
    androidOpenOrInstall: "Ablihi o i-install",
    androidInstalledConfirmed:
      "Na-install na ang MangoLeaf AI niini nga device. Ablihi ang app aron mopadayon.",
    androidDownloadGuide: "Giya sa pag-download sa APK",
    androidDownloadAgain: "I-install pag-usab o i-update ang Android app",
    androidDownloadAgainHint:
      "Aduna ka nay app. Pag-download lamang og laing APK aron i-install pag-usab o i-update ang Android nga bersiyon.",
    androidDownloadDescription:
      "Ang Android app magtipig sa report sa telepono ug awtomatikong mo-back up kon online. Tipigi ang pribadong recovery code aron mabawi kini sa laing telepono.",
    androidDownloadPending:
      "Wala mapamatud-i ang Android APK download. Tan-awa ang opisyal nga mga release o sulayi pag-usab kon konektado.",
    androidDownloadChecking: "Gisusi ang pagkaanaa sa Android APK...",
    androidDownloadAvailable:
      "Anaa ang Android APK gikan sa release {version}.",
    androidDownloadVersion: "Anaa nga Android APK v{version}",
    androidDownloadApk: "I-download ang Android APK",
    androidDownloadReleases: "Tan-awa ang opisyal nga mga release",
    androidDownloadTrouble:
      "Wala mahuman ang download? Ablihi kini nga release sa GitHub ug i-tap ang mangoleaf-ai.apk.",
    androidDownloadFallback: "I-download gikan sa GitHub",
    androidDownloadCompatibility:
      "Android lamang ang gisuportahan sa mobile app. Gikinahanglan ang Android 8.0 o mas bag-o ug updated nga Android System WebView.",
    androidDownloadMigration:
      "Ang APK adunay kaugalingong Dating Scan. Ang daang mga report sa browser magpabilin didto ug dili awtomatikong mabalhin.",
    androidDownloadBrowser: "Ablihi ang website",
    backupTitle: "Pribadong cloud backup",
    backupDescription:
      "Awtomatikong i-back up ang mga report ug litrato samtang abli ug online ang app. Walay Sign In/Register nga screen. Paghimo ug tipigi ang recovery code gawas sa telepono aron mabawi ang nahuman nga backup sa laing telepono. Ma-upload ang offline nga report human makakonekta pag-usab.",
    backupCreate: "Paghimo og recovery code",
    backupRecoveryLabel: "Imong pribadong recovery code",
    backupRecoveryHint:
      "Bisan kinsa nga adunay code makaabli sa imong backup. Tipigi kini gawas niining telepono. Kon mawala ang telepono ug code, dili na mabawi ang cloud backup.",
    backupCopy: "Kopyaha ang recovery code",
    backupSavedCode: "Natipig na nako ang recovery code gawas niining telepono",
    backupEnable: "I-enable ang backup",
    backupRestoreCodeLabel: "Recovery code gikan sa daang device",
    backupConnect: "Gamita ang recovery code",
    backupEnabled: "Na-enable ang cloud backup",
    backupDisabled: "Naka-off ang cloud backup",
    backupNow: "I-back up karon",
    backupRestore: "I-restore ang mga report sa cloud",
    backupDisable: "I-off ang backup niini nga device",
    backupDeleteCloud: "Papasa kining cloud backup",
    backupDeleteConfirm:
      "Gi-pause nako ang backup sa ubang device ug nasabtan nga permanenteng mapapas ang mga report ug litrato sa cloud alang niining recovery code. Ang laing naka-enable nga device mahimong maghimo og bag-ong kopya.",
    backupDeletionExplanation:
      "Ang pagtangtang sa History mopapas sa lokal nga report/litrato ug sa mga kopya niini sa konektadong cloud backup. Sulayan pag-usab ang offline nga pagtangtang samtang abli ug online ang app, bisan gi-pause ang upload. Ipadayon ang koneksyon sa recovery code hangtod mahuman. I-pause ang backup sa ubang device nga adunay karaang kopya aron dili kini ma-upload pag-usab. Manwal gihapon ang restore.",
    backupBusy: "Nagtrabaho…",
    backupError:
      "Wala mahuman ang backup. Susiha ang koneksyon ug recovery code, dayon sulayi pag-usab. Luwas ang lokal nga mga report.",
    backupDone: "Nahuman ang operasyon sa backup.",
    backupCodeCopied:
      "Nakopya ang recovery code. Tipigi kini gawas niining telepono.",
    backupCodeCopyFailed: "Wala makopya. Tipigi pag-ayo ang gipakitang code.",
    backupRestored: "Na-restore ang {n} bag-ong report.",
    backupUploaded: "Na-back up ang {n} ka report.",
    backupCloudDeleted:
      "Napapas ang cloud backup. Magpabilin sa device ang lokal nga mga report.",
    // Navigation
    navHome: "Home",
    navAbout: "Bahin",
    navHistory: "Dating Scan",
    installApp: "I-install ang App",
    downloadApp: "I-install",
    downloadPromptTitle: "Kuhaa ang MangoLeaf AI",
    downloadPromptDescription:
      "Kuhaa ang MangoLeaf AI Android APK alang sa offline nga diagnosis sa imong telepono.",

    // Installation guide
    installGuideDesktopTitle: "Kuhaa ang MangoLeaf AI para sa Android",
    installGuideMobileTitle: "I-install ang MangoLeaf AI para sa Android",
    installGuideDescription:
      "Mga Android phone lamang ang gisuportahan sa MangoLeaf AI. I-install ang app gamit ang APK niini. Maablihan gihapon ang website sa ubang device.",
    installGuideQRDescription:
      "I-scan kini nga QR code gamit ang Android phone aron maablihan ang giya sa pag-install sa APK.",
    installGuideQRAlt:
      "QR code alang sa pag-install sa MangoLeaf AI sa Android",
    installGuideWebsiteLink: "Ablihi ang website sa MangoLeaf AI",
    installGuideAndroid: "Android",
    installGuideAndroidOpen: "Kuhaa ang Android APK",
    installGuideAndroidOpenDescription:
      "Ablihi ang giya sa pag-download sa APK sa ubos. Ang download button niini mokuha sa installer gikan sa opisyal nga GitHub Releases kon anaa na.",
    installGuideAndroidInstall: "Ablihi ang APK",
    installGuideAndroidInstallDescription:
      "Ablihi ang APK file. Kung mangayo ang Android, tugoti kini nga browser o file manager sa pag-install sa kasaligang download.",
    installGuideConfirm: "Kumpirmaha ang pag-install",
    installGuideConfirmDescription:
      "I-tap ang Install sa Android installer, dayon ablihi ang MangoLeaf AI sa imong listahan sa mga app.",
    installGuideContinue: "Balik sa website",

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

    // Live camera and its square capture preview
    guidedCameraTitle: "Pagkuha og Litrato",
    guidedCameraHint:
      "Ibutang sa tunga sa kahon ang usa ka tibuok dahon o bunga sa mangga. Ipirme ang kamera ug gamita ang maayong kahayag.",
    guidedCameraGuideNote:
      "Ang makita lang sulod sa kuwadradong preview ang maapil sa litrato.",
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
      "I-delete ang mga gipiling report ug natipig nga litrato gikan niining device. Dili na kini mabalik.",
    historyDeleteConfirmOneDescription:
      "I-delete ang gipiling report ug natipig nga litrato gikan niining device. Dili na kini mabalik.",
    historyCloudDeleteHint:
      "Papason usab ang mga kopya sa imong konektadong cloud backup. Sulayan pag-usab ang offline nga pagtangtang kon abli ug online ang app.",
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
      "Ang MangoLeaf AI usa ka offline-first Android application nga nagpaabot sa AI-assisted nga pag-ila sa sakit sa mangga ngadto sa mga mag-uuma sa Pilipinas.",
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
      "Mo-refresh ang giya sa pagtambal kon konektado. Tipigan sa Android app ang Dating Scan ug mga litrato sa pribadong app storage.",
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
      "Pagdala sa model ngadto sa offline-first Android application.",
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
    footerVersions: "App {appVersion} / Modelo {modelVersion}",
    footerApkVersions: "Android APK v{apkVersion} / Modelo {modelVersion}",
    aboutWebVersion: "Bersyon sa web app {version}",
    privacyPolicy: "Polisiya sa Pribasya",
    termsOfService: "Kondisyon sa Serbisyo",
    legalCloseBtn: "Nasabtan ug Isara",
    privacyUpdated: "Kataposang gi-update: Oktubre 24, 2026",
    privacySections: [
      {
        title: "1. Paggamit sa website",
        text: "Ang website nagpasabot sa MangoLeaf AI ug naghatag og paagi sa pag-install sa Android app. Wala kini nag-scan og litrato, nagpakita og Dating Scan, nagrekord og diagnostics o nag-upload og pribadong report, bisan sa development. Dili kinahanglan magparehistro o mo-sign in.",
      },
      {
        title: "2. Android reports ug karaang browser data",
        text: "Ang Android APK mag-analisar sa litrato sa device ug magtipig sa report ug litrato sa pribadong app storage. Ang karaang browser reports ug litrato magpabilin sa maong browser profile nga walay History interface; dili kini basahon, ibalhin o papason sa website.",
      },
      {
        title: "3. Website storage ug download checks",
        text: "Kon gitugotan ang browser storage, hinumdoman sa website ang imong piniling pinulongan. Ang download page mosusi sa publikong GitHub release aron itanyag ang opisyal nga APK. Walay litrato sa scan o resulta sa diagnosis nga ilakip niini.",
      },
      {
        title: "4. Karaang browser storage ug pagkawala sa data",
        text: "Ang pag-clear sa site data, pagtangtang sa browser profile o paglimpyo sa storage sa browser mahimong makapapas sa karaang report, litrato ug settings. Dili kini awtomatikong ibalhin ngadto sa APK ug walay browser recovery controls niini nga website.",
      },
      {
        title: "5. Karaang cloud copies",
        text: "Dili magpadagan ang website og pribadong backup, restore o deletion worker. Dili usbon ang karaang cloud copies ug natipig nga browser deletion jobs. Ang Android app adunay kaugalingong authenticated backup, recovery ug deletion.",
      },
      {
        title: "6. Diagnostics",
        text: "Walay Diagnostics panel ang website ug dili kini magsugod og diagnostic recording. Dili usbon ang karaang browser logs. Opsyonal ug lokal ang APK diagnostics gawas kon imo kining ipakigbahin.",
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
