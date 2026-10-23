import { memo } from "react";
import { translations, type Language } from "@/lib/translations";
import { Logo } from "@/components/brand/logo";
import { modelVersion } from "@/lib/constants";
import { useAndroidVersion } from "@/hooks/useAndroidVersion";

interface FooterProps {
  language: Language;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

/** APK identity comes from the installed host; browser app/model labels remain independent. */
export const Footer = memo(function Footer({
  language,
  onOpenPrivacy,
  onOpenTerms,
}: FooterProps) {
  const t = translations[language];
  const apkVersion = useAndroidVersion();

  return (
    <footer className="border-t border-[#e2ebd9] bg-[#edf4e8]/60 mt-16 pt-12 pb-28 md:pb-12 text-center transition-colors">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Logo width={22} height={22} />
          <span className="text-lg font-bold text-[#143519]">MangoLeaf AI</span>
        </div>

        {/* Text Details */}
        <div className="flex flex-col gap-1 text-xs text-[#526856]">
          <p>{t.footerCopyright}</p>
          <p className="font-medium text-[#66786a]">
            {(apkVersion ? t.footerApkVersions : t.footerVersions)
              .replace("{apkVersion}", apkVersion ?? "")
              .replace(
                "{appVersion}",
                process.env.NEXT_PUBLIC_APP_VERSION ?? "",
              )
              .replace("{modelVersion}", modelVersion)}
          </p>
        </div>

        {/* Legal Links — extra bottom space on mobile so bottom nav does not cover links */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-[#425946] font-medium pt-1 max-w-xs sm:max-w-none mx-auto">
          <button
            onClick={onOpenPrivacy}
            className="hover:text-[#277839] transition-colors cursor-pointer whitespace-normal text-center leading-snug"
          >
            {t.privacyPolicy}
          </button>
          <span className="text-[#738a77]" aria-hidden="true">
            •
          </span>
          <button
            onClick={onOpenTerms}
            className="hover:text-[#277839] transition-colors cursor-pointer whitespace-normal text-center leading-snug"
          >
            {t.termsOfService}
          </button>
        </div>
      </div>
    </footer>
  );
});
