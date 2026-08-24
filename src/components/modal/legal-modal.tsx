import { memo } from "react";
import { type Language } from "@/lib/translations";

interface LegalModalProps {
  type: "privacy" | "terms" | null;
  language: Language;
  onClose: () => void;
}

export const LegalModal = memo(function LegalModal({
  type,
  language,
  onClose,
}: LegalModalProps) {
  if (!type) return null;

  const isPrivacy = type === "privacy";
  const isEn = language === "en";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#cce0be] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col gap-5 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2ebd9] pb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-[#143519]">
            {isPrivacy
              ? isEn
                ? "Privacy Policy"
                : "Polisiya sa Adlaw-adlaw nga Pagkapribado"
              : isEn
              ? "Terms of Service"
              : "Mga Termino ug Kondisyon sa Paggamit"}
          </h3>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#f6faf1] text-[#277839] hover:bg-[#e2ebd9] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Body (Justified Typography, Manuscript Grounded) */}
        <div
          lang={isEn ? "en" : "ceb"}
          className="text-xs sm:text-sm text-[#3b523f] leading-relaxed flex flex-col gap-4 overflow-y-auto pr-2 text-justify [text-justify:inter-word] break-words hyphens-auto"
        >
          {isPrivacy ? (
            isEn ? (
              <>
                <p className="font-semibold text-[#143519]">
                  Last Updated: July 2026 | Compliant with Republic Act No. 10173 (Data Privacy Act of 2012)
                </p>
                <p>
                  <strong>1. Zero Personal Data Collection:</strong> MangoLeaf AI is engineered as an offline-first diagnostic tool. The application functions entirely without requiring user authentication, account creation, or personal identity submission.
                </p>
                <p>
                  <strong>2. Anonymous Device Identification:</strong> Devices are identified strictly via randomly generated universal unique identifiers (UUIDs). No personal names, email addresses, or phone numbers are requested or recorded.
                </p>
                <p>
                  <strong>3. On-Device Image Processing & Local Storage:</strong> Leaf and fruit images captured or uploaded by users are processed locally inside the browser using MobileNetV3-Large and WebGL shaders via TensorFlow.js. Images and diagnostic history remain stored in your device&apos;s local IndexedDB database.
                </p>
                <p>
                  <strong>4. Cloud Synchronization:</strong> When an active internet connection is detected, anonymous diagnostic records and image blobs automatically synchronize with our secure Supabase database to maintain cross-device scan history.
                </p>
                <p>
                  <strong>5. Data Security & Rights:</strong> Users retain full ownership of their diagnostic records. You may delete local scan logs at any time directly through the application interface.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-[#143519]">
                  Gi-update Niadtong: Hulyo 2026 | Nag-sunod sa Republic Act No. 10173 (Data Privacy Act of 2012)
                </p>
                <p>
                  <strong>1. Walay Koleksyon sa Personal nga Impormasyon:</strong> Ang MangoLeaf AI usa ka offline-first nga tool. Nagdagan kini nga walay kinahanglan nga account registration, pag-login, o paghatag sa imong ngalan.
                </p>
                <p>
                  <strong>2. Anonimo nga Pag-ila sa Device:</strong> Ang imong device gi-ila lamang pinaagi sa awtomatiko nga gi-generate nga random Device UUID. Walay email, numero sa telepono, o personal nga datos nga ginatipigan.
                </p>
                <p>
                  <strong>3. Pagproseso sa Litrato sa Mismo nga Device:</strong> Ang mga litrato sa dahon ug prutas gi-proseso sa mismong browser nimo gamit ang MobileNetV3 ug TensorFlow.js. Ang litrato ug rekord gi-save sa IndexedDB sa imong telepono.
                </p>
                <p>
                  <strong>4. Cloud Synchronization:</strong> Kung magka-internet, ang mga anonimong rekord ug litrato mag-sync sa among secure Supabase database aron mapreserbar ang imong scan history.
                </p>
                <p>
                  <strong>5. Siguridad ug Katungod sa Datos:</strong> Imo ang tanang katungod sa imong scan history. Mahimo nimong idelete ang imong local scan records bisan unsang orasa pinaagi sa app.
                </p>
              </>
            )
          ) : isEn ? (
            <>
              <p className="font-semibold text-[#143519]">
                Terms of Service & Usage Guidelines | Philippine Carabao Mango Diagnostic System
              </p>
              <p>
                <strong>1. Scope of Application:</strong> MangoLeaf AI is specifically designed to assist Filipino smallholder farmers in detecting pre-harvest diseases affecting Philippine Carabao Mango (<em>Mangifera indica L.</em>) leaves and green fruit.
              </p>
              <p>
                <strong>2. Diagnostic AI Confidence Threshold:</strong> Classifications are generated by a deep learning model trained on target disease classes (Anthracnose, Sooty Mold, Bacterial Canker, Bacterial Black Spot, Mango Scab, and Healthy). A minimum 70% confidence threshold is enforced, together with prediction-margin and entropy criteria calibrated on held-out out-of-scope images. Results failing any of the three are flagged as Uncertain.
              </p>
              <p>
                <strong>3. Treatment Guidance Disclaimer:</strong> All disease treatment protocols and reminders provided in this app are sourced from standardized agricultural guidelines published by DOST-PCAARRD and BAFS. Recommendations serve as advisory decision support and do not replace professional agricultural extension services.
              </p>
              <p>
                <strong>4. Intellectual Property & Ethical Standards:</strong> Developed in compliance with Republic Act No. 8293 (Intellectual Property Code of the Philippines) and DOST-PHREB research ethics standards.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-[#143519]">
                Mga Termino sa Paggamit | Sistema sa Diagnosis sa Mangga
              </p>
              <p>
                <strong>1. Sakop sa Paggamit:</strong> Ang MangoLeaf AI gidisenyo alang sa mga mag-uuma sa mangga sa Pilipinas aron makatabang sa pag-diagnose sa pre-harvest nga sakit sa dahon ug prutas sa Carabao Mango (<em>Mangifera indica L.</em>).
              </p>
              <p>
                <strong>2. AI Confidence Threshold sa Diagnosis:</strong> Ang mga resulta gi-generate pinaagi sa MobileNetV3 model alang sa 6 ka klase (Anthracnose, Sooty Mold, Bacterial Canker, Bacterial Black Spot, Mango Scab, ug Healthy). Gipatuman ang minimum nga 70% confidence threshold, uban sa prediction-margin ug entropy criteria nga gi-calibrate gamit ang mga nakalaan nga out-of-scope nga mga hulagway. Ang mga resulta nga dili makapasar sa bisan asa niining tulo kay markahan isip &apos;Uncertain&apos;.
              </p>
              <p>
                <strong>3. Pahinumdom sa Pagtambal:</strong> Ang tanang gabay sa pagtambal gikan sa mga opisyal nga giya sa DOST-PCAARRD ug BAFS. Nagserbisyo kini isip tambag sa pag-atiman ug dili puli sa opisyal nga konsultasyon sa kapunongan sa agrikultura.
              </p>
              <p>
                <strong>4. Propetikal nga Katungod (IP Code):</strong> Gi-develop subay sa Republic Act No. 8293 (Intellectual Property Code sa Pilipinas) ug etikong sumbanan sa DOST-PHREB.
              </p>
            </>
          )}
        </div>

        {/* Footer Close Button (Full width on mobile, right-aligned on desktop) */}
        <div className="border-t border-[#e2ebd9] pt-4 w-full flex flex-col md:flex-row md:justify-end">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-3 md:py-2.5 bg-[#277839] text-white font-extrabold md:font-bold rounded-xl text-xs hover:bg-[#1f622d] transition-colors cursor-pointer shadow-xs text-center active:scale-98"
          >
            {isEn ? "Understood & Close" : "Nasabtan ug Isara"}
          </button>
        </div>
      </div>
    </div>
  );
});
