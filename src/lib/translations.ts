export type Language = "en" | "bis";

export const translations = {
  en: {
    // Navigation
    navHome: "Home",
    navAbout: "About",
    navHistory: "History",
    installApp: "Install App",
    
    // Scanner Section
    heroHeadline: "What would you like to scan?",
    desktopHeroHeadline: "Diagnose Mango Diseases Instantly",
    desktopHeroSubtitle: "Upload a clear photo of a mango leaf or fruit to run an instant AI diagnostic report.",
    scanLeafTitle: "Scan Leaf",
    scanFruitTitle: "Scan Fruit",
    uploadPhotoBtn: "Upload Photo",
    takePhotoBtn: "Take Photo",
    takePhotoSubtext: "Capture a clear photo of a mango leaf or fruit in daylight",
    uploadPhotoSubtext: "Upload an existing leaf or fruit photo from your gallery",
    browseFilesBtn: "Browse Files",
    snapCameraBtn: "Snap Camera",
    openGalleryBtn: "Open Gallery",
    
    // AI Scanning Progress Overlay
    loadingPhoto: "Loading photo...",
    runningAI: "Running AI classification...",
    savingDiagnosis: "Saving diagnosis...",
    finishingUp: "Finishing up...",
    runDiagnosisBtn: "Run AI Diagnosis",
    retakeBtn: "Retake",
    cancelBtn: "Cancel",
    photoCheckHint: "Make sure the leaf or fruit is clear and in the center. If it's blurry or dark, take another photo.",
    analyzingTissue: "Analyzing mango leaf tissue...",
    
    // Info Callout Card
    didYouKnowTitle: "Did you know?",
    didYouKnowDesc: "Scanning leaves in bright, indirect sunlight provides the highest diagnostic accuracy. Avoid deep shadows for better results.",
    
    // Scan History Section
    recentScansTitle: "Recent Scans",
    scanHistoryTitle: "Scan History",
    searchPlaceholder: "Search scans...",
    filterAll: "≡ Filter All",
    viewAllHistory: "View All History →",
    viewAllHistoryShort: "View All →",
    noScanHistoryTitle: "No Scan History Yet",
    noScanHistoryText: "No previous scans recorded on this device. Upload or take a photo above to run your first diagnosis!",
    
    // Card & Scan Labels
    leafScanLabel: "Leaf Scan",
    fruitScanLabel: "Fruit Scan",
    detailsBtn: "Details",
    justNow: "Just now",
    yesterday: "Yesterday",
    
    // Scan Details Modal
    diagnosisPrefix: "Diagnosis:",
    scannedOnPrefix: "Scanned on",
    scorePrefix: "Score:",
    preTreatmentGuidelines: "Treatment Guidelines",
    closeDetailsBtn: "Close details",
    noImageOffline: "No Image Available Offline",
    
    // About Page
    aboutTitle: "About MangoLeaf AI",
    aboutDesc: "MangoLeaf AI is an offline-first Progressive Web Application (PWA) built specifically to empower Filipino mango farmers with instant, zero-latency disease diagnostics for Carabao mango leaves and fruits directly in the field.",
    aiEngineTitle: "On-Device AI Engine",
    aiEngineDesc: "Powered by an optimized MobileNetV3 deep learning model running directly inside your browser via TensorFlow.js. It achieves 98.25% diagnostic accuracy without sending photos to external servers.",
    offlineSyncTitle: "Offline & Cloud Sync",
    offlineSyncDesc: "All scan records and photo blobs are saved locally to IndexedDB first. When network connectivity is restored, records automatically sync seamlessly with Supabase cloud storage.",
    deviceIdLabel: "Device ID:",
    
    // Footer
    footerCopyright: "© 2026 MangoLeaf AI. Designed for the Future of Filipino Agriculture.",
    footerSubtext: "Empowering farmers with AI-driven diagnostics.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
  },
  bis: {
    // Navigation
    navHome: "Home",
    navAbout: "Bahin",
    navHistory: "Nangaging Scan",
    installApp: "I-install ang App",
    
    // Scanner Section
    heroHeadline: "Unsay gusto nimo i-scan?",
    desktopHeroHeadline: "Pag-diagnose sa Sakit sa Mangga Dihadiha",
    desktopHeroSubtitle: "Mag-upload og maayong hulagway sa dahon o prutas sa mangga aron makadawat og paspas nga diagnosis gikan sa AI.",
    scanLeafTitle: "I-scan ang Dahon",
    scanFruitTitle: "I-scan ang Bunga",
    uploadPhotoBtn: "I-upload ang Litrato",
    takePhotoBtn: "Kuhaa ang Litrato",
    takePhotoSubtext: "Maglitrato og maayong hulagway sa dahon o prutas sa mangga",
    uploadPhotoSubtext: "Mag-upload og hulagway sa dahon o prutas gikan sa imong gallery",
    browseFilesBtn: "Pangitaa sa File",
    snapCameraBtn: "Litrato sa Kamera",
    openGalleryBtn: "Ablihi ang Gallery",
    
    // AI Scanning Progress Overlay
    loadingPhoto: "Nag-load sa litrato...",
    runningAI: "Nag-classify sa AI...",
    savingDiagnosis: "Nagsave sa diagnosis...",
    finishingUp: "Naghuman na...",
    runDiagnosisBtn: "Sugdan ang Diagnosis",
    retakeBtn: "Kuhaa Pag-usab",
    cancelBtn: "I-kansela",
    photoCheckHint: "Siguroha nga klaro ug anaa sa tunga ang dahon o bunga. Kung hanap o ngitngit, pagkuha og laing litrato.",
    analyzingTissue: "Nagsusi sa dahon sa mangga...",
    
    // Info Callout Card
    didYouKnowTitle: "Kahibalo ba ka?",
    didYouKnowDesc: "Ang pag-scan sa mga dahon ilalom sa hayag apan dili direkta nga adlaw naghatag og pinakamaayo nga resulta sa diagnosis. Likayi ang ngitngit nga landong.",
    
    // Scan History Section
    recentScansTitle: "Bag-ong Scan",
    scanHistoryTitle: "Mga nangaging Scan",
    searchPlaceholder: "Pangitaa ang scan...",
    filterAll: "≡ I-filter Tanan",
    viewAllHistory: "Tan-awa Tanan nga History →",
    viewAllHistoryShort: "Tan-awa Tanan →",
    noScanHistoryTitle: "Wala pay Nangaging Scan",
    noScanHistoryText: "Wala pay nangaging scan nga nakarecord sa kini nga device. Pag-upload o paglitrato og dahon o bunga sa ibabaw aron masugdan ang pag-scan!",
    
    // Card & Scan Labels
    leafScanLabel: "Scan sa Dahon",
    fruitScanLabel: "Scan sa Bunga",
    detailsBtn: "Detalye",
    justNow: "Karon lang",
    yesterday: "Gahapon",
    
    // Scan Details Modal
    diagnosisPrefix: "Diagnosis:",
    scannedOnPrefix: "Na-scan niadtong",
    scorePrefix: "Puntos:",
    preTreatmentGuidelines: "Mga Pagtambal ug Pahinumdom",
    closeDetailsBtn: "Isara ang detalye",
    noImageOffline: "Walay Litrato nga Nadownload Offline",
    
    // About Page
    aboutTitle: "Bahin sa MangoLeaf AI",
    aboutDesc: "Ang MangoLeaf AI usa ka offline-first Progressive Web Application (PWA) nga gidisenyo alang sa mga mag-uuma sa mangga sa Pilipinas aron makahatag og paspas nga diagnosis sa sakit sa dahon ug bunga sa mangga bisan walay internet.",
    aiEngineTitle: "On-Device AI Engine",
    aiEngineDesc: "Gipaganap pinaagi sa optimized nga MobileNetV3 deep learning model nga nagdagan sa imong browser gamit ang TensorFlow.js. Makahatag kini og 98.25% nga sakto nga diagnosis nga dili na kinahanglan i-upload sa gawas.",
    offlineSyncTitle: "Offline ug Cloud Sync",
    offlineSyncDesc: "Tanan nga rekord sa scan ug litrato ginatipigan una sa IndexedDB sa imong device. Kung magka-internet na usab, awtomatiko kini nga mag-sync sa Supabase cloud database.",
    deviceIdLabel: "Device ID:",
    
    // Footer
    footerCopyright: "© 2026 MangoLeaf AI. Gidisenyo alang sa Kaugmaon sa Agrikultura sa Pilipinas.",
    footerSubtext: "Naghatag og kadasig sa mga mag-uuma pinaagi sa AI diagnosis.",
    privacyPolicy: "Polisiya sa Pribasya",
    termsOfService: "Kondisyon sa Serbisyo",
  }
};
