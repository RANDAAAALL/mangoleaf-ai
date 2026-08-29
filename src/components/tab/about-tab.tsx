import { memo } from "react";
import { Icon } from "@/components/brand/icon";
import { Logo } from "@/components/brand/logo";
import { translations, type Language } from "@/lib/translations";

interface AboutTabProps {
  language: Language;
  onScanPress: () => void;
}

type FeatureIconName = "offline" | "device" | "sync";

function FeatureIcon({ name }: { name: FeatureIconName }) {
  const paths = {
    offline: (
      <>
        <path d="M17.5 18H7a4 4 0 1 1 .6-7.95A5.5 5.5 0 0 1 18 12.5" />
        <path d="m4 4 16 16" />
      </>
    ),
    device: (
      <>
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M10 6h4M11 18h2" />
        <path d="m10 12 1.5 1.5L14.5 10" />
      </>
    ),
    sync: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.2 9A7 7 0 0 1 18 7M17.8 15A7 7 0 0 1 6 17" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.1"
    >
      {paths[name]}
    </svg>
  );
}

export const AboutTab = memo(function AboutTab({
  language,
  onScanPress,
}: AboutTabProps) {
  const t = translations[language];
  const contentLang = language === "en" ? "en" : "ceb";
  const fieldFeatures: Array<{
    icon: FeatureIconName;
    title: string;
    description: string;
  }> = [
    {
      icon: "offline",
      title: t.aboutOfflineFirstTitle,
      description: t.aboutOfflineFirstDesc,
    },
    {
      icon: "device",
      title: t.aboutOnDeviceTitle,
      description: t.aboutOnDeviceDesc,
    },
    { icon: "sync", title: t.aboutSyncTitle, description: t.aboutSyncDesc },
  ];
  const timeline = [
    {
      number: "01",
      title: t.aboutResearchTitle,
      description: t.aboutResearchDesc,
    },
    { number: "02", title: t.aboutDataTitle, description: t.aboutDataDesc },
    { number: "03", title: t.aboutAiStepTitle, description: t.aboutAiStepDesc },
    {
      number: "04",
      title: t.aboutApplicationTitle,
      description: t.aboutApplicationDesc,
    },
  ];

  return (
    <div className="flex flex-col gap-12 pb-8 sm:gap-16 sm:pb-12">
      <section className="relative isolate overflow-hidden rounded-3xl bg-[#1c682d] px-6 py-9 text-white shadow-sm sm:px-10 sm:py-12">
        <div className="absolute right-5 top-5 opacity-15 sm:right-8 sm:top-7" aria-hidden="true">
          <Logo className="h-24 w-24 sm:h-36 sm:w-36" fill="#d9f5d6" />
        </div>
        <div className="relative flex max-w-2xl flex-col items-start gap-5">
          {/* <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#bde3c0]"><Logo width={17} height={17} fill="#bde3c0" /><span>{t.aboutBrandName}</span></div> */}
          <h1 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
            {t.aboutHeroTitle}
          </h1>
          <p
            lang={contentLang}
            className="max-w-xl text-sm leading-7 text-[#d9ead9] sm:text-base"
          >
            {t.aboutHeroDesc}
          </p>
          <button
            type="button"
            onClick={onScanPress}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#1b5e28] shadow-sm transition-colors hover:bg-[#eef8eb] active:scale-98"
          >
            <Icon name="scan" size={18} strokeWidth={2.5} />
            {t.aboutScanLeafCta}
          </button>
        </div>
      </section>

      <section className="grid gap-5 border-y border-[#dbe8d4] py-8 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:gap-10 sm:py-10">
        <h2 className="text-2xl font-bold tracking-tight text-[#143519]">
          {t.aboutWhyTitle}
        </h2>
        <div className="flex max-w-2xl flex-col gap-3">
          <p
            lang={contentLang}
            className="text-lg font-medium leading-7 text-[#26492b]"
          >
            {t.aboutWhyLead}
          </p>
          <p
            lang={contentLang}
            className="text-sm leading-7 text-[#526856] sm:text-base"
          >
            {t.aboutWhyDesc}
          </p>
        </div>
      </section>

      <section aria-labelledby="field-title">
        <div className="mb-5 flex flex-col gap-1">
          {/* <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#277839]">
            {t.aboutBrandName}
          </p> */}
          <h2
            id="field-title"
            className="text-2xl font-bold tracking-tight text-[#143519]"
          >
            {t.aboutFieldTitle}
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {fieldFeatures.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-[#cfe2c8] bg-[#edf6e9] p-5 shadow-xs"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#277839] text-white shadow-sm">
                <FeatureIcon name={feature.icon} />
              </div>
              <h3 className="text-base font-bold text-[#143519]">
                {feature.title}
              </h3>
              <p
                lang={contentLang}
                className="mt-1.5 text-sm leading-6 text-[#526856]"
              >
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="ai-engine-title"
        className="rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] p-6 font-sans sm:p-8"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2
            id="ai-engine-title"
            className="text-2xl font-bold tracking-tight text-[#143519]"
          >
            {t.aboutAiEngineHeading}
          </h2>
          <div className="mt-5">
            <p className="text-6xl font-black tracking-[-0.07em] text-[#277839] sm:text-7xl">
              97.46%
            </p>
            <p className="mt-1 text-xs font-medium text-[#526856]">
              {t.aboutModelAccuracyLabel}
            </p>
          </div>
          <div className="mt-9 grid w-full gap-7 sm:grid-cols-3 sm:gap-5">
            <TechnicalFact
              value={t.aboutModelArchitectureValue}
              label={t.aboutArchitectureLabel}
            />
            <TechnicalFact
              value={t.aboutRuntimeValue}
              label={t.aboutRuntimeLabel}
            />
            <TechnicalFact
              value={t.aboutOnDeviceValue}
              label={t.aboutProcessingLabel}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="research-title">
        <div className="max-w-xl">
          {/* <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#277839]">
            {t.aboutBrandName}
          </p> */}
          <h2
            id="research-title"
            className="mt-1 text-2xl font-bold tracking-tight text-[#143519]"
          >
            {t.aboutResearchHeading}
          </h2>
        </div>
        <ol className="mt-7 grid gap-0 md:grid-cols-4 md:gap-4">
          {timeline.map((step, index) => (
            <li
              key={step.number}
              className="relative flex gap-4 pb-7 last:pb-0 md:block md:pb-0"
            >
              {index < timeline.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[13px] top-8 h-[calc(100%-1.1rem)] w-px bg-[#cfe2c8] md:left-8 md:top-8 md:h-px md:w-[calc(100%-1rem)]"
                />
              )}
              {index === timeline.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-16 top-8 hidden h-px w-[calc(100%-4rem)] bg-[#cfe2c8] md:block"
                />
              )}
              <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#a8cfa8] bg-[#f6faf1] text-[10px] font-black text-[#277839] md:mb-4 md:h-16 md:w-16 md:text-xs">
                {step.number}
              </span>
              <div className="pt-0.5 md:pt-0">
                <h3 className="text-xs font-black tracking-[0.12em] text-[#143519]">
                  {step.title}
                </h3>
                <p
                  lang={contentLang}
                  className="mt-1.5 text-sm leading-6 text-[#526856]"
                >
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-[#cfe2c8] bg-[#edf6e9] px-6 py-9 text-center shadow-xs sm:px-10 sm:py-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <Logo width={32} height={32} fill="#277839" />
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#143519] sm:text-3xl">
            {t.aboutMissionTitle}
          </h2>
          <p
            lang={contentLang}
            className="mt-3 text-lg font-medium leading-7 text-[#26492b]"
          >
            {t.aboutMissionStatement}
          </p>
          <p
            lang={contentLang}
            className="mt-3 max-w-xl text-sm leading-7 text-[#526856] sm:text-base"
          >
            {t.aboutMissionDesc}
          </p>
          <button
            type="button"
            onClick={onScanPress}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#277839] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#1f622d] active:scale-98"
          >
            <Icon name="scan" size={18} strokeWidth={2.5} />
            {t.aboutScanLeafCta}
          </button>
        </div>
      </section>
    </div>
  );
});

function TechnicalFact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold tracking-tight text-[#143519]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#526856]">
        {label}
      </p>
    </div>
  );
}
